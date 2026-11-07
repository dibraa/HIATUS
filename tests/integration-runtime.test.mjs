import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
function load(file, globals = {}, modules = {}) {
  const source = ts.transpileModule(readFileSync(new URL("../src/" + file, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, require: name => { assert(name in modules, name); return modules[name]; }, ...globals });
  return exports;
}
test("browser analytics sends only selected properties when enabled and respects privacy signals", async () => {
  const calls = [], storage = new Map();
  const client = load("lib/integration-client.ts", { window: { dispatchEvent() {} }, Event: class {}, navigator: {}, sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) }, crypto: { randomUUID: () => "00000000-0000-0000-0000-000000000001" }, fetch: async (...args) => { calls.push(args); return {}; } });
  client.trackEvent("cart_added"); assert.equal(calls.length, 0);
  client.setIntegrations({ posthog_enabled: true }); client.trackEvent("cart_added", { item_id: "000000000000000000000001", quantity: 2 }); assert.equal(calls.length, 1);
  const body = JSON.parse(calls[0][1].body); assert.equal(body.event, "cart_added"); assert.equal(body.quantity, 2);
  client.setIntegrations(null); client.trackEvent("checkout_started"); assert.equal(calls.length, 1);
  const blocked = load("lib/integration-client.ts", { window: { dispatchEvent() {} }, Event: class {}, navigator: { doNotTrack: "1" }, fetch: async () => { throw Error("Must not send"); } });
  blocked.setIntegrations({ posthog_enabled: true }); blocked.trackEvent("menu_viewed");
});
test("browser Sentry events discard raw errors, URLs, tokens and form contents", async () => {
  const calls = [];
  const client = load("lib/integration-client.ts", { Error, window: { dispatchEvent() {} }, Event: class {}, fetch: async (...args) => { calls.push(args); return {}; } });
  const error = new TypeError("password=private-password private@example.test"); error.stack = "TypeError: private\n at https://shop.test/_next/static/chunks/app.js?token=private-token:10:2";
  client.reportBrowserError(error); assert.equal(calls.length, 0);
  client.setIntegrations({ sentry_enabled: true }); client.reportBrowserError(error);
  const body = JSON.parse(calls[0][1].body); assert.equal(body.frames[0].filename, "app.js"); assert(!calls[0][1].body.includes("private")); assert(!calls[0][1].body.includes("shop.test"));
});
test("telemetry proxy rejects cross-origin and unsupported operations before contacting Express", async () => {
  const calls = [];
  const { forwardIntegration: POST } = load("lib/integration-proxy.ts", { URL, Response, JSON }, { "@/lib/api-client": { apiFetch: async (...args) => { calls.push(args); return Response.json({ ok: true }); } }, "@/lib/server-token": { getServerToken: async () => "server-session" } });
  const context = operation => operation;
  const request = (origin, body = "{}") => ({ url: "https://shop.test/api/integrations/events", headers: new Headers({ origin, "content-length": String(body.length) }), text: async () => body });
  assert.equal((await POST(request("https://evil.test"), context("events"))).status, 403); assert.equal(calls.length, 0);
  assert.equal((await POST(request("https://shop.test"), context("credentials"))).status, 404); assert.equal(calls.length, 0);
  assert.equal((await POST(request("https://shop.test", "x".repeat(8193)), context("errors"))).status, 413); assert.equal(calls.length, 0);
  assert.equal((await POST(request("https://shop.test"), context("push-test"))).status, 200); assert.equal(calls[0][1].token, "server-session");
});
test("native pushes stop when OneSignal is selected, preventing duplicate provider delivery", async () => {
  const calls = [];
  const server = load("lib/push-server.ts", { URL, process: { env: {} }, console }, {
    "web-push": { default: { sendNotification: async () => calls.push("native") } },
    "@/lib/api-client": { apiJson: async () => ({ push_enabled: true, push_provider: "onesignal" }) },
    "@/lib/settings": { getSettings: async () => { throw Error("Must stop before sending"); } }, "@/lib/format": { orderCode: () => "CODE" }, "@/lib/order-meta": { STATUS_LABELS: {} }, "@/lib/order-alerts": { shouldAlert: () => true }, "@/lib/push-flag": { PUSH_ENABLED: true },
  });
  assert.equal(await server.getPushTargets("id", "token"), null);
  await server.sendOrderPush("id", { subscriptions: [{}], status: "pending", prefs: {} }, "ready", "token"); assert.equal(calls.length, 0);
  await assert.rejects(server.sendTestPush({}), /disabled/);
});

test("OneSignal loads only after authenticated identity and uses scoped consent and opaque aliases", async () => {
  const calls = [], scripts = [], target = {}, sdk = {
    init: async options => calls.push(["init", options]), setConsentGiven: async consent => calls.push(["consent", consent]), login: async alias => calls.push(["login", alias]), logout: async () => {},
    User: { PushSubscription: { optedIn: false, optIn: async () => {}, optOut: async () => {} } }, Notifications: { requestPermission: async () => true },
  };
  let permitted = false;
  const identity = { app_id: "12345678-1234-1234-1234-123456789abc", external_id: "a".repeat(64) };
  const client = load("lib/onesignal-client.ts", {
    setTimeout, clearTimeout, URL, window: target, navigator: {}, location: { hostname: "localhost" },
    document: { querySelector: () => scripts[0], createElement: () => ({}), head: { appendChild: script => { scripts.push(script); queueMicrotask(() => target.OneSignalDeferred[0](sdk)); } } },
    fetch: async () => Response.json(permitted ? identity : {}, { status: permitted ? 200 : 401 }),
  });
  await assert.rejects(client.enableOneSignal(), /Sign in/); assert.equal(scripts.length, 0);
  permitted = true; await client.enableOneSignal(); assert.equal(scripts.length, 1);
  const init = calls.find(c => c[0] === "init")[1]; assert.equal(init.requiresUserPrivacyConsent, true); assert.equal(init.serviceWorkerParam.scope, "/onesignal/"); assert.equal(init.serviceWorkerPath, "/onesignal/OneSignalSDKWorker.js");
  assert.equal(calls.find(c => c[0] === "login")[1], identity.external_id);
  client.stopOneSignal(); assert.equal(calls.at(-1)[1], false);
});
