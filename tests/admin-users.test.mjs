import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function loadActions(apiJson, revalidatePath) {
  const phone = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL("../src/lib/phone.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: phone });
  const source = ts.transpileModule(readFileSync(new URL("../src/app/actions/admin.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  const modules = {
    "next/cache": { revalidatePath },
    "@/lib/server-token": { getServerToken: async () => "test-admin-session" },
    "@/lib/api-client": { apiJson },
    "@/lib/phone": phone,
  };
  vm.runInNewContext(source, { exports, require: (name) => {
    assert(name in modules, `Unexpected module ${name}`);
    return modules[name];
  } });
  return exports;
}

test("role and credential changes forward the admin session and revalidate Users after server confirmation", async () => {
  const calls = [], refreshes = [];
  const actions = loadActions(async (path, options) => { calls.push({ path, ...options }); }, (path) => refreshes.push(path));
  for (const role of ["admin", "staff", "customer"]) {
    const result = await actions.updateUserRole("test-user", role);
    assert.equal(result.error, null);
    const call = calls.at(-1);
    assert.equal(call.path, "/admin/team/test-user/role");
    assert.equal(call.token, "test-admin-session");
    assert.equal(call.method, "PUT");
    assert.deepEqual(JSON.parse(call.body), { role });
  }
  await actions.updateStaffCredentials("test-user", { full_name: "Changed name", phone: "09123456789" });
  assert.deepEqual(JSON.parse(calls.at(-1).body), { full_name: "Changed name", phone: "09123456789" });
  assert.equal(calls.at(-1).path, "/admin/team/test-user/credentials");
  assert.deepEqual(refreshes, Array(4).fill("/admin/team"));
});

test("failed account mutations return API errors without reporting success or revalidating", async () => {
  const refreshes = [];
  const actions = loadActions(async () => { throw new Error("That email is already in use"); }, (path) => refreshes.push(path));
  const result = await actions.updateStaffCredentials("test-user", { email: "taken@example.test" });
  assert.equal(result.error, "That email is already in use");
  assert.equal((await actions.updateUserRole("test-user", "staff")).error, "That email is already in use");
  assert.deepEqual(refreshes, []);
});

test("account creation never forwards or returns a frontend-provided temporary password", async () => {
  const calls = [], refreshed = [];
  const actions = loadActions(async (path, options) => { calls.push({ path, ...options }); return { setup_email_sent: true }; }, path => refreshed.push(path));
  const form = new FormData();
  for (const [key, value] of Object.entries({ full_name: " New account ", email: "new@example.test", role: "staff", phone: " 09123456789 ", password: "MustNeverBeForwarded" })) form.set(key, value);
  const result = await actions.createStaffAccount({ error: null, success: null }, form);
  assert.equal(result.error, null);
  assert.equal(result.success, "Account created.");
  const payload = JSON.parse(calls[0].body);
  assert.deepEqual(payload, { full_name: "New account", email: "new@example.test", phone: "09123456789", role: "staff" });
  assert(!JSON.stringify(result).includes("MustNeverBeForwarded"));
  assert.deepEqual(refreshed, ["/admin/team"]);
});

test("invalid phone and required fields fail before contacting the API", async () => {
  let requests = 0;
  const actions = loadActions(async () => { requests++; }, () => {});
  for (const value of ["abc", "+639123456789", "123456", "1234567890123456"]) {
    const form = new FormData(); form.set("full_name", "Name"); form.set("email", "name@example.test"); form.set("phone", value);
    assert((await actions.createStaffAccount({ error: null, success: null }, form)).error);
    assert((await actions.updateStaffCredentials("test", { phone: value })).error);
  }
  const blank = new FormData(); blank.set("full_name", " "); blank.set("email", "bad");
  assert((await actions.createStaffAccount({ error: null, success: null }, blank)).error);
  assert.equal(requests, 0);
});

test("email delivery failures distinguish a created account from a failed delivery", async () => {
  const actions = loadActions(async () => ({ setup_email_sent: false }), () => {});
  const form = new FormData(); form.set("full_name", "Name"); form.set("email", "name@example.test");
  const result = await actions.createStaffAccount({ error: null, success: null }, form);
  assert.equal(result.error, null);
  assert.equal(result.success, "Account created.");
  assert.match(result.warning, /setup email could not be delivered/);
});

test("confirmed account deletion uses the protected endpoint and revalidates affected screens", async () => {
  let request;
  const refreshes = [];
  const actions = loadActions(async (path, options) => { request = { path, ...options }; }, path => refreshes.push(path));
  assert.equal((await actions.deleteUserAccount("selected-user")).error, null);
  assert.equal(request.path, "/admin/team/selected-user");
  assert.equal(request.method, "DELETE");
  assert.equal(request.token, "test-admin-session");
  assert.deepEqual(refreshes, ["/admin/team", "/admin/activity", "/admin/performance"]);
});
