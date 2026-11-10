import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function fixture(user, fail = false) {
  const calls = [], refreshes = [];
  const result = { revision: "new-revision", providers: {} };
  const modules = {
    "@/lib/auth": { getCurrentUser: async () => user },
    "@/lib/server-token": { getServerToken: async () => "admin-session" },
    "@/lib/api-client": { apiJson: async (path, options) => { calls.push({ path, ...options }); if (fail) throw Error("Credentials changed elsewhere."); return result; } },
    "next/cache": { revalidatePath: path => refreshes.push(path) },
  };
  const source = ts.transpileModule(readFileSync(new URL("../src/app/actions/credentials.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, Error, require(name) { assert(name in modules, name); return modules[name]; } });
  return { exports, calls, refreshes, result };
}
test("credential actions block non-admin sessions before reading or forwarding credentials", async () => {
  for (const user of [null, { role: "staff", isActive: true }, { role: "customer", isActive: true }, { role: "admin", isActive: false }]) {
    const f = fixture(user);
    assert((await f.exports.readCredentialSettings()).error);
    assert((await f.exports.saveCredentialSettings("smtp", "save", "old", { api_key: "must-not-forward" })).error);
    assert.equal(f.calls.length, 0);
    assert.equal(f.refreshes.length, 0);
  }
});
test("admin saves use the protected backend with revision checks and revalidate provider screens", async () => {
  const f = fixture({ role: "admin", isActive: true });
  assert.equal((await f.exports.readCredentialSettings()).error, null);
  assert.equal(f.calls[0].cache, "no-store");
  const saved = await f.exports.saveCredentialSettings("google", "save", "old", { client_id: "fixture.apps.googleusercontent.com" });
  assert.equal(saved.data, f.result);
  assert.equal(f.calls[1].path, "/settings/credentials/google");
  assert.equal(f.calls[1].token, "admin-session");
  assert.deepEqual(JSON.parse(f.calls[1].body), { action: "save", revision: "old", values: { client_id: "fixture.apps.googleusercontent.com" } });
  assert.deepEqual(f.refreshes, ["/admin/settings", "/login", "/signup"]);
});
test("failed credential saves retain API conflict feedback without revalidation or success", async () => {
  const f = fixture({ role: "admin", isActive: true }, true);
  const result = await f.exports.saveCredentialSettings("recaptcha", "save", "old", { secret_key: "" });
  assert.equal(result.data, null);
  assert.equal(result.error, "Credentials changed elsewhere.");
  assert.equal(f.refreshes.length, 0);
});
