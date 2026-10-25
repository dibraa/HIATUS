import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const source = ts.transpileModule(readFileSync(new URL("../src/lib/settings.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const exported = {};
vm.runInNewContext(source, { exports: exported, Intl, Date, require: () => ({ apiJson: async () => { throw Error("Isolated settings outage"); } }) });
test("storefront hours carry over closed weekdays and show the later closing time for overlapping windows", () => {
  const hours = exported.DEFAULT_BUSINESS_HOURS.map(row => ({ ...row, closed: true }));
  hours[6] = { ...hours[6], closed: false, open: "22:00", close: "02:00" };
  const at = utc => exported.isOpenNow(hours, "Asia/Manila", new Date(utc));
  assert.equal(at("2024-03-02T13:59:59Z").open, false);
  assert.equal(at("2024-03-02T14:00:00Z").open, true);
  assert.equal(at("2024-03-02T17:30:00Z").today.close, "02:00");
  assert.equal(at("2024-03-02T18:00:00Z").open, false);
  hours[0] = { ...hours[0], closed: false, open: "00:00", close: "01:00" };
  assert.equal(at("2024-03-02T16:30:00Z").today.close, "02:00");
});
test("settings outages cannot become editable defaults or an open checkout", async () => {
  const settings = await exported.getSettings();
  assert.equal(settings.loaded, false);
  assert.equal(settings.availability.can_order, false);
  assert.equal(settings.businessHours.length, 0);
});
