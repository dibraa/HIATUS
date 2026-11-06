import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function actions(file, user) {
  const calls = [], refreshes = [];
  const modules = {
    "next/cache": { revalidatePath: path => refreshes.push(path) },
    "next/server": { after() { throw Error("Unexpected push scheduling"); } },
    "@/lib/server-token": { getServerToken: async () => "fixture-session" },
    "@/lib/auth": { getCurrentUser: async () => user },
    "@/lib/api-client": { apiJson: async (path, options) => { calls.push({ path, ...options }); } },
    "@/lib/push-server": {
      getPushTargets: async () => { calls.push({ path: "push-targets" }); return null; },
      sendOrderPush() {}, sendReadyOrderPush() {},
    },
  };
  const source = ts.transpileModule(readFileSync(new URL(`../src/app/actions/${file}.ts`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, require(name) { assert(name in modules, name); return modules[name]; } });
  return { exports, calls, refreshes };
}

test("all Staff actions reject non-Staff sessions before API calls, pushes, or revalidation", async () => {
  for (const user of [null, { role: "admin", isActive: true }, { role: "customer", isActive: true }, { role: "staff", isActive: false }]) {
    const fixture = actions("staff", user);
    const operations = [
      ["advanceOrderStatus", "order", "preparing"], ["notifyCustomerReady", "order"],
      ["prioritizeOrder", "order", true], ["flagSpecialRequest", "order", true],
      ["setItemAvailability", "item", true], ["assignTable", "order", "A1"],
      ["setOrderPriority", "order", 1], ["takePayment", "order", "cash", 100, ""],
      ["refundOrder", "order", null, "Reason"], ["voidOrder", "order", "Reason"],
      ["applyManualDiscount", "order", 10, "Reason"], ["clockIn", 0], ["clockOut", 0, ""],
    ];
    for (const [name, ...args] of operations) assert((await fixture.exports[name](...args)).error, name);
    assert.equal(fixture.calls.length, 0);
    assert.equal(fixture.refreshes.length, 0);
  }
});

test("Staff advances through Counter; Admin advances through a separately authorized endpoint", async () => {
  const staff = actions("staff", { role: "staff", isActive: true });
  assert.equal((await staff.exports.advanceOrderStatus("order", "ready")).error, null);
  assert.equal(staff.calls.at(-1).path, "/orders/order/status");
  const admin = actions("orders", { role: "admin", isActive: true });
  assert.equal((await admin.exports.updateOrderStatus("order", "ready")).error, null);
  assert.equal(admin.calls.at(-1).path, "/admin/orders/order/status");
  assert.equal(admin.calls.at(-1).token, "fixture-session");
  for (const user of [null, { role: "staff", isActive: true }, { role: "customer", isActive: true }, { role: "admin", isActive: false }]) {
    const blocked = actions("orders", user);
    assert((await blocked.exports.updateOrderStatus("order", "ready")).error);
    assert.equal(blocked.calls.length, 0);
    assert.equal(blocked.refreshes.length, 0);
  }
});

test("direct Counter and legacy POS links redirect Admin while allowing Staff", async () => {
  const compile = path => ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const roles = {};
  vm.runInNewContext(compile("../src/lib/roles.ts"), { exports: roles });
  for (const role of ["admin", "staff", "customer"]) {
    const permissionCatalog = JSON.parse(readFileSync(new URL("../src/lib/permission-catalog.json", import.meta.url), "utf8"));
    const permissionExports = {};
    vm.runInNewContext(compile("../src/lib/permissions.ts"), { exports: permissionExports, require: () => permissionCatalog });
    const modules = {
      "@/lib/permissions": permissionExports,
      "next/server": { NextResponse: { next: () => ({ allowed: true }), redirect: url => ({ redirected: url.pathname }) } },
      "jose": { jwtVerify: async () => ({ payload: { role } }) },
      "@/lib/roles": roles,
      "@/lib/mock-staff-data": { USE_MOCKS: false },
    };
    const exports = {};
    vm.runInNewContext(compile("../src/proxy.ts"), {
      exports, Headers, TextEncoder, console,
      process: { env: { JWT_SECRET: "fixture", NODE_ENV: "test" } },
      fetch: async () => ({ ok: true, json: async () => ({ role, is_active: true, permissions: permissionCatalog.filter(p => p.role === role).map(p => p.key) }) }),
      require(name) { assert(name in modules, name); return modules[name]; },
    });
    for (const path of ["/staff", "/staff/pos", "/staff/menu", "/staff/shift"]) {
      const nextUrl = new URL(`http://localhost${path}`);
      nextUrl.clone = () => new URL(nextUrl);
      const result = await exports.proxy({ headers: new Headers(), nextUrl, cookies: { get: () => ({ value: "fixture" }) } });
      if (role === "staff") assert.equal(result.allowed, true);
      else assert.equal(result.redirected, role === "admin" ? "/admin" : "/");
    }
  }
});
