import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
function fixture(user, fail = false) {
  const calls = [], refreshes = [], result = { locked: true, providers: {} };
  const modules = {
    "@/lib/auth": { getCurrentUser: async () => user }, "@/lib/server-token": { getServerToken: async () => "admin-session" },
    "@/lib/api-client": { apiJson: async (path, options) => { calls.push({ path, ...options }); if (fail) throw Error("Access expired."); return result; } },
    "next/cache": { revalidatePath: path => refreshes.push(path) },
  };
  const source = ts.transpileModule(readFileSync(new URL("../src/app/actions/credentials.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {}; vm.runInNewContext(source, { exports, Error, require(name) { assert(name in modules, name); return modules[name]; } });
  return { exports, calls, refreshes, result };
}
test("all credential access actions block non-admin or inactive sessions before forwarding", async () => {
  for (const user of [null, { role: "staff", isActive: true }, { role: "customer", isActive: true }, { role: "admin", isActive: false }]) {
    const f = fixture(user);
    assert((await f.exports.readCredentialSettings()).error);
    assert((await f.exports.requestCredentialOtp()).error);
    assert((await f.exports.verifyCredentialOtp("challenge", "123456")).error);
    assert((await f.exports.unlockCredentialSettings("challenge", "fixture-pin")).error);
    assert((await f.exports.saveCredentialSettings("smtp", "save", "revision", {}, "access-token")).error);
    assert.equal(f.calls.length, 0);
  }
});
test("locked reads omit the access grant; unlocked reads forward it without caching", async () => {
  const f = fixture({ role: "admin", isActive: true });
  await f.exports.readCredentialSettings(); assert.deepEqual(JSON.parse(JSON.stringify(f.calls[0].headers)), {});
  await f.exports.readCredentialSettings("memory-token"); assert.equal(f.calls[1].headers["X-Credential-Access"], "memory-token");
  assert.equal(f.calls[0].cache, "no-store"); assert.equal(f.calls[1].cache, "no-store");
});
test("OTP and PIN use access endpoints without a credential draft or environment write", async () => {
  const f = fixture({ role: "admin", isActive: true });
  await f.exports.requestCredentialOtp(); await f.exports.verifyCredentialOtp("challenge", "123456"); await f.exports.unlockCredentialSettings("challenge", "fixture-pin");
  assert.deepEqual(f.calls.map(c => c.path), ["/settings/credentials/access/otp", "/settings/credentials/access/verify-otp", "/settings/credentials/access/unlock"]);
  assert.equal(f.calls[0].body, "{}");
  assert.deepEqual(JSON.parse(f.calls[1].body), { challenge_id: "challenge", otp: "123456" });
  assert.deepEqual(JSON.parse(f.calls[2].body), { challenge_id: "challenge", pin: "fixture-pin" });
  assert.equal(f.refreshes.length, 0);
});
test("save forwards the memory-only grant and draft, then refreshes provider screens", async () => {
  const f = fixture({ role: "admin", isActive: true });
  await f.exports.saveCredentialSettings("google", "save", "revision", { client_id: "fixture.apps.googleusercontent.com" }, "memory-token");
  assert.equal(f.calls[0].headers["X-Credential-Access"], "memory-token");
  assert.deepEqual(JSON.parse(f.calls[0].body), { action: "save", revision: "revision", values: { client_id: "fixture.apps.googleusercontent.com" } });
  assert.deepEqual(f.refreshes, ["/admin/settings", "/login", "/signup"]);
});
test("lock revokes the supplied grant; failed updates report errors without success or revalidation", async () => {
  const f = fixture({ role: "admin", isActive: true }); await f.exports.lockCredentialSettings("memory-token");
  assert.equal(f.calls[0].path, "/settings/credentials/access/lock"); assert.equal(f.calls[0].headers["X-Credential-Access"], "memory-token");
  const failed = fixture({ role: "admin", isActive: true }, true);
  assert.equal((await failed.exports.saveCredentialSettings("google", "save", "revision", {}, "expired-token")).error, "Access expired.");
  assert.equal(failed.refreshes.length, 0);
});
test("all eight provider writes require an admin session and the unlock grant; removed integrations stay rejected", async () => {
  for (const provider of ["google", "smtp", "recaptcha", "cloudinary", "onesignal", "posthog", "sentry", "native_push"]) {
    const f=fixture({role:"admin",isActive:true});const result=await f.exports.saveCredentialSettings(provider,"save","revision",{},"memory-token");assert.equal(result.error,null);assert.equal(f.calls[0].path,"/settings/credentials/"+provider);assert.equal(f.calls[0].headers["X-Credential-Access"],"memory-token");
  }
  for (const provider of ["maps","resend","unknown"]) {const f=fixture({role:"admin",isActive:true});assert((await f.exports.saveCredentialSettings(provider,"save","revision",{},"memory-token")).error);assert.equal(f.calls.length,0);}
});
