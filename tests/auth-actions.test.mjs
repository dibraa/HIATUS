import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as crypto from "node:crypto";
import vm from "node:vm";
import ts from "typescript";

// Exercise the real server-action boundary with isolated Next cookie/redirect adapters.
const compiled = ts.transpileModule(readFileSync(new URL("../src/app/actions/auth.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function fixture({ cookie = "isolated-browser-secret", response = {}, jsonResponse = {} } = {}) {
  const jar = new Map(cookie ? [["google_auth", { value: cookie }]] : []);
  const writes = [], calls = [];
  const modules = {
    "next/headers": { cookies: async () => ({ get: name => jar.get(name), set: (name, value, options) => {
      writes.push({ name, value, options }); jar.set(name, { value });
    }, delete: name => jar.delete(name) }) },
    "next/navigation": { redirect: path => { throw Object.assign(new Error("Isolated redirect"), { redirect: path }); } },
    "@/lib/api-client": {
      apiFetch: async (path, options) => { calls.push({ path, body: JSON.parse(options.body) }); return Response.json(response.body || { token: "isolated-session", user: { role: "customer" } }, { status: response.status || 200 }); },
      apiJson: async (path, options) => { calls.push({ path, body: JSON.parse(options.body) }); return jsonResponse; },
    },
    "@/lib/roles": { homePathFor: role => role === "admin" ? "/admin" : role === "staff" ? "/staff" : "/" },
    "node:crypto": crypto,
  };
  const exports = {};
  vm.runInNewContext(compiled, { exports, require: name => {
    assert(name in modules, `Unexpected server dependency: ${name}`); return modules[name];
  }, process: { env: { NODE_ENV: "production" } } });
  return { actions: exports, jar, writes, calls };
}
function data(values = {}) {
  const form = new FormData();
  for (const [name, value] of Object.entries({ credential: "isolated-credential", nonce: "isolated-nonce", ...values })) form.set(name, value);
  return form;
}

test("Google challenge binds a fresh secret to an HttpOnly Secure cookie; only its hash reaches Express", async () => {
  const f = fixture({ jsonResponse: { nonce: "provider-nonce" } });
  const result = await f.actions.beginGoogleAuthentication("login");
  assert.equal(result.nonce, "provider-nonce");
  const cookie = f.writes.find(write => write.name === "google_auth");
  assert(cookie.options.httpOnly && cookie.options.secure && cookie.options.sameSite === "lax");
  assert.equal(cookie.options.maxAge, 600);
  assert.equal(f.calls[0].body.browser_hash, crypto.createHash("sha256").update(cookie.value).digest("hex"));
  assert.notEqual(f.calls[0].body.browser_hash, cookie.value);
  assert.equal(f.calls[0].body.intent, "login");
});

test("Google submission without browser cookie never calls Express", async () => {
  const f = fixture({ cookie: null });
  assert.equal((await f.actions.signInWithGoogle(data())).code, "CHALLENGE_EXPIRED");
  assert.equal(f.calls.length, 0); assert.equal(f.writes.length, 0);
});

test("Google action ignores a client-supplied browser binding and preserves provider error codes", async () => {
  const f = fixture({ response: { status: 409, body: { error: "Confirm your password", code: "LINK_REQUIRED" } } });
  const result = await f.actions.signInWithGoogle(data({ browser_hash: "attacker-binding", password: "isolated-password", recaptcha_token: "isolated-captcha" }));
  assert.equal(result.code, "LINK_REQUIRED");
  assert.equal(f.calls[0].body.browser_hash, crypto.createHash("sha256").update("isolated-browser-secret").digest("hex"));
  assert.equal(f.calls[0].body.password, "isolated-password");
  assert.equal(f.calls[0].body.recaptcha_token, "isolated-captcha");
  assert.equal(f.writes.length, 0); assert(f.jar.has("google_auth"));
});

test("Google success retires verifier cookie, sets existing JWT session, and retains safe role redirects", async () => {
  for (const [role, destination] of [["customer", "/"], ["staff", "/staff"], ["admin", "/admin"]]) {
    for (const next of ["", "https://attacker.example", "//attacker.example", "/\\attacker.example"]) {
      const f = fixture({ response: { body: { token: "isolated-jwt", user: { role } } } });
      await assert.rejects(f.actions.signInWithGoogle(data({ next })), error => error.redirect === destination);
      assert(!f.jar.has("google_auth"));
      const session = f.writes.find(write => write.name === "token");
      assert.equal(session.value, "isolated-jwt");
      assert(session.options.httpOnly && session.options.secure && session.options.sameSite === "lax");
    }
  }
  const f = fixture();
  await assert.rejects(f.actions.signInWithGoogle(data({ next: "/orders?view=active" })), error => error.redirect === "/orders?view=active");
});

test("password login forwards CAPTCHA without changing role/session behavior; reset fallback is defined", async () => {
  const f = fixture({ jsonResponse: { token: "password-session", user: { role: "staff" } } });
  await assert.rejects(f.actions.signIn({ error: null }, data({ email: "staff@example.test", password: "isolated-password", recaptcha_token: "captcha-response" })), error => error.redirect === "/staff");
  assert.equal(f.calls[0].body.recaptcha_token, "captcha-response");
  const reset = fixture({ response: { status: 404, body: {} } });
  const result = await reset.actions.updatePassword({}, data({ token: "reset-token", password: "long-password", confirm_password: "long-password" }));
  assert.equal(result.success, false);
  assert.match(result.error, /temporarily unavailable/);
});

test("ordinary email signup and password recovery reach Express without CAPTCHA", async () => {
  const signup = fixture();
  const created = await signup.actions.signUp({ error: null }, data({ full_name: "Review Member", email: "member@example.test", password: "ValidPassword123" }));
  assert.equal(created.error, null);
  assert.equal(signup.calls[0].path, "/auth/signup");
  assert.equal(signup.calls[0].body.recaptcha_token, undefined);
  const recovery = fixture();
  const reset = await recovery.actions.requestPasswordReset({}, data({ email: "member@example.test" }));
  assert.equal(reset.sent, true);
  assert.equal(recovery.calls[0].path, "/auth/forgot-password");
  assert.equal(recovery.calls[0].body.recaptcha_token, undefined);
});
