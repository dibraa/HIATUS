import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function load(file, modules, globals = {}) {
  const source = ts.transpileModule(readFileSync(new URL("../src/" + file, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, require: name => { assert(name in modules, name); return modules[name]; }, Response, AbortSignal, Error, String, Number, JSON, Object, ...globals });
  return exports;
}
const ID = "0123456789abcdef01234567";
const post = (method, body) => new Request("http://localhost/api/admin/menu-lock", { method, body: JSON.stringify(body) });

test("the edit-turn route forwards to the API with the admin's token and passes the status through", async () => {
  const calls = [];
  let token = "admin-session";
  const route = load("app/api/admin/menu-lock/route.ts", {
    "@/lib/server-token": { getServerToken: async () => token },
    "@/lib/api-client": { apiFetch: async (path, options) => { calls.push({ path, ...options }); return new Response(JSON.stringify({ error: "Ana is editing this item." }), { status: 409 }); } },
  });
  const joined = await route.POST(post("POST", { id: ID, session: "s", join: true }));
  assert.equal(joined.status, 409, "conflicts stay visible in the browser's Network tab");
  assert.deepEqual(await joined.json(), { error: "Ana is editing this item." });
  assert.equal(calls[0].path, `/menu/${ID}/lock`);
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].token, "admin-session");
  assert.deepEqual(JSON.parse(calls[0].body), { session: "s", join: true }, "the id moves into the API path");

  await route.DELETE(post("DELETE", { id: ID, session: "s" }));
  assert.equal(calls[1].method, "DELETE");
  assert.deepEqual(JSON.parse(calls[1].body), { session: "s" }, "DELETE always carries a JSON body");

  assert.equal((await route.POST(post("POST", { id: "../../admin", session: "s" }))).status, 404);
  assert.equal((await route.POST(new Request("http://localhost/x", { method: "POST", body: "not json" }))).status, 404);
  token = null;
  assert.equal((await route.POST(post("POST", { id: ID }))).status, 401);
  assert.equal(calls.length, 2);
});

test("the edit-turn route is static, because next.config.ts rewrites /api/* to Express before dynamic routes", () => {
  const config = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");
  assert(config.includes('source: "/api/:path*"'), "if this rewrite changes, the route below may be able to move");
  assert.throws(() => readFileSync(new URL("../src/app/api/admin/menu/[id]/lock/route.ts", import.meta.url)), "a dynamic /api route would be shadowed by the rewrite");
  assert(readFileSync(new URL("../src/app/admin/menu/edit-turn.ts", import.meta.url), "utf8").includes('"/api/admin/menu-lock"'));
});

function saveFixture(permissions) {
  const calls = [];
  const actions = load("app/actions/menu.ts", {
    "next/cache": { revalidatePath() {} },
    "next/navigation": { redirect() { throw new Error("unexpected redirect"); } },
    "@/lib/auth": { getCurrentUser: async () => ({ permissions }) },
    "@/lib/server-token": { getServerToken: async () => "admin-session" },
    "@/lib/api-client": { apiFetch: async () => assert.fail("no upload expected"), apiJson: async (path, options) => { calls.push({ path, ...options }); return {}; } },
  });
  const form = (fields) => { const data = new FormData(); for (const [key, value] of Object.entries(fields)) data.set(key, value); return data; };
  const base = { id: ID, presentation: "dialog", name: "Latte", flavor: "Original", category: "coffee", item_type: "drink", pricing_mode: "sized", "price-S": "85", "price-M": "100", "price-L": "125", edit_session: "turn-session", original_is_available: "true" };
  return { calls, save: fields => actions.saveMenuItem({ error: null }, form({ ...base, ...fields })) };
}

test("saving sends the editing turn and only sends availability when the editor changed it", async () => {
  const { calls, save } = saveFixture(["menu.edit", "menu.availability"]);
  const result = await save({ is_available: "on" });
  assert.equal(result.error, null);
  assert.equal(result.success, true);
  const unchanged = JSON.parse(calls[0].body);
  assert.equal(calls[0].path, `/menu/${ID}`);
  assert.equal(unchanged.edit_session, "turn-session");
  assert.equal("is_available" in unchanged, false, "an unchanged switch can't undo a sold-out toggle made meanwhile");
  await save({});
  assert.equal(JSON.parse(calls[1].body).is_available, false, "turning it off is sent");
});

test("an editor without the availability permission never sends availability", async () => {
  const { calls, save } = saveFixture(["menu.edit"]);
  await save({ original_is_available: "false", is_available: "on" });
  assert.equal("is_available" in JSON.parse(calls[0].body), false);
});
