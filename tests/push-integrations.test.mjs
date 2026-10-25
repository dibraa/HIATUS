import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

test("disabled push blocks status, ready resend, and test delivery, including already-loaded targets", async () => {
  let enabled = false, calls = 0, unavailable = false;
  const modules = {
    "web-push": { default: { setVapidDetails() {}, async sendNotification() { calls++; } } },
    "@/lib/api-client": { async apiJson(path) { if (unavailable) throw Error("outage"); return path.includes("integrations") ? { push_enabled: enabled } : { subscriptions: [] }; } },
    "@/lib/settings": { getSettings: async () => ({ templates: {} }) },
    "@/lib/format": { orderCode: value => value },
    "@/lib/order-meta": { STATUS_LABELS: { ready: "Ready" } },
    "@/lib/order-alerts": { shouldAlert: () => true },
    "@/lib/push-flag": { PUSH_ENABLED: true },
  };
  const source = ts.transpileModule(readFileSync(new URL("../src/lib/push-server.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, console, URL, process: { env: { NEXT_PUBLIC_VAPID_PUBLIC_KEY: "fixture", VAPID_PRIVATE_KEY: "fixture" } }, require(name) { assert(name in modules); return modules[name]; } });
  const targets = { status: "preparing", prefs: {}, subscriptions: [{ endpoint: "https://fixture.invalid" }] };
  assert.equal(await exports.getPushTargets("id", "token"), null);
  await exports.sendOrderPush("id", targets, "ready", "token");
  await exports.sendReadyOrderPush("id", targets, "token");
  await assert.rejects(exports.sendTestPush(targets.subscriptions[0]), /disabled/);
  assert.equal(calls, 0);
  enabled = true;
  await exports.sendTestPush(targets.subscriptions[0]);
  assert.equal(calls, 1);
  unavailable = true;
  await exports.sendOrderPush("id", targets, "ready", "token");
  assert.equal(calls, 1, "policy outage never sends push");
});
