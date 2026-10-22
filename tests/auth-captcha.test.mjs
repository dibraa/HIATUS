import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = ts.transpileModule(readFileSync(new URL("../src/lib/recaptcha-loader.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function fixture(initialApi) {
  const scripts = [], timeouts = new Map(), intervals = new Map();
  let timerId = 0;
  const window = {
    grecaptcha: initialApi,
    setTimeout: callback => { timeouts.set(++timerId, callback); return timerId; },
    setInterval: callback => { intervals.set(++timerId, callback); return timerId; },
    clearTimeout: id => timeouts.delete(id), clearInterval: id => intervals.delete(id),
  };
  const document = {
    createElement: () => ({ dataset: {}, removed: false, remove() { this.removed = true; } }),
    head: { appendChild: script => scripts.push(script) },
  };
  const exports = {};
  vm.runInNewContext(source, { exports, window, document });
  return { load: exports.loadRecaptcha, scripts, window, timeouts, intervals };
}
const api = () => ({ render: () => 0, reset() {}, getResponse: () => "" });

test("a partially loaded Google bootstrap is not mistaken for a ready widget", async () => {
  const f = fixture({ ready() {} });
  let settled = false;
  const first = f.load(); first.then(() => { settled = true; });
  assert.equal(f.load(), first, "simultaneous mounts must share the script request");
  assert.equal(f.scripts.length, 1);
  assert.match(f.scripts[0].src, /onload=__hiatusRecaptchaReady&render=explicit/);
  f.window.__hiatusRecaptchaReady();
  await Promise.resolve();
  assert.equal(settled, false, "an early SDK callback must not reject or render too soon");
  const loaded = api(); f.window.grecaptcha = loaded;
  f.window.__hiatusRecaptchaReady();
  assert.equal(await first, loaded);
  assert.equal(f.timeouts.size, 0); assert.equal(f.intervals.size, 0);
});

test("polling waits for render/reset/getResponse and a late provider callback stays safe", async () => {
  const f = fixture();
  const promise = f.load();
  f.window.grecaptcha = { render() {} };
  for (const check of f.intervals.values()) check();
  assert.equal(f.timeouts.size, 1);
  const loaded = api(); f.window.grecaptcha = loaded;
  for (const check of f.intervals.values()) check();
  assert.equal(await promise, loaded);
  assert.doesNotThrow(() => f.window.__hiatusRecaptchaReady());
  assert.equal(await f.load(), loaded);
  assert.equal(f.scripts.length, 1, "theme/size remounts reuse the loaded API");
});

test("a real script failure removes the failed request and allows a fresh retry", async () => {
  const f = fixture();
  const failed = f.load();
  f.scripts[0].onerror();
  await assert.rejects(failed, /Verification could not load/);
  assert.equal(f.scripts[0].removed, true);
  assert.equal(f.timeouts.size + f.intervals.size, 0);
  const retry = f.load();
  assert.equal(f.scripts.length, 2);
  const loaded = api(); f.window.grecaptcha = loaded;
  f.window.__hiatusRecaptchaReady();
  assert.equal(await retry, loaded);
});

test("a stalled SDK times out with retry guidance, then can recover", async () => {
  const f = fixture({ ready() {} });
  const failed = f.load();
  for (const timeout of f.timeouts.values()) timeout();
  await assert.rejects(failed, /took too long.*Retry/);
  assert.equal(f.scripts[0].removed, true);
  const retry = f.load();
  const loaded = api(); f.window.grecaptcha = loaded;
  f.window.__hiatusRecaptchaReady();
  assert.equal(await retry, loaded);
});
