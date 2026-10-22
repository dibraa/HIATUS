import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function loadActions(apiJson, revalidatePath) {
  const source = ts.transpileModule(readFileSync(new URL("../src/app/actions/admin.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  const modules = {
    "next/cache": { revalidatePath },
    "@/lib/server-token": { getServerToken: async () => "test-admin-session" },
    "@/lib/api-client": { apiJson },
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
