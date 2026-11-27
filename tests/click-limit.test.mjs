import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const compile = file => ts.transpileModule(readFileSync(new URL("../src/" + file, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const settle = () => new Promise(resolve => setImmediate(resolve));

function setup({ offline = false } = {}) {
  const state = { now: 0, toasts: [], requests: [], handler: null };
  const modules = {
    react: { useEffect: effect => effect() },
    "react-hot-toast": { __esModule: true, default: { error: (message, options) => state.toasts.push({ message, id: options.id }) } },
  };
  const exports = {};
  vm.runInNewContext(compile("components/click-limit.tsx"), {
    exports, require: name => modules[name], Math, JSON,
    Date: { now: () => state.now },
    fetch: async (url, init) => {
      state.requests.push({ url, init });
      if (offline) throw new TypeError("offline");
      return { json: async () => ({ error: "Server: try again in " + JSON.parse(init.body).retry_after_seconds + " seconds." }) };
    },
    window: { addEventListener: (type, handler, capture) => { assert.equal(type, "click"); assert.equal(capture, true); state.handler = handler; }, removeEventListener() {} },
  });
  exports.ClickLimit();
  return state;
}
// A fake element of the given tag: closest() matches it only when the selector lists that tag.
const element = (tag = "button", exempt = false) => {
  const el = { closest: selector => selector.includes("data-click-limit") ? (exempt ? el : null) : selector.split(",").some(part => part.trim().split("[")[0] === tag) ? el : null };
  return el;
};
function click(state, target) {
  const event = { target, blocked: false, preventDefault() { this.blocked = true; }, stopImmediatePropagation() { this.stopped = true; } };
  state.handler(event);
  return event.blocked && event.stopped;
}

test("a button takes five clicks per 10 seconds; a blocked click is reported for a 429 and pops up the server's message", async () => {
  const state = setup(), save = element();
  for (let i = 0; i < 5; i++) { state.now = i * 1000; assert.equal(click(state, save), false, `click ${i + 1}`); }
  assert.equal(state.requests.length, 0, "allowed clicks send nothing extra");
  state.now = 5000;
  assert.equal(click(state, save), true);
  assert.equal(state.requests.length, 1);
  assert.equal(state.requests[0].url, "/api/rate-limit");
  assert.equal(state.requests[0].init.method, "POST");
  assert.deepEqual(JSON.parse(state.requests[0].init.body), { retry_after_seconds: 5 });
  await settle();
  assert.deepEqual(state.toasts, [{ message: "Server: try again in 5 seconds.", id: "click-limit" }]);
  state.now = 10001;
  assert.equal(click(state, save), false, "frees up once the oldest click is 10 seconds old");
});

test("the pop-up still appears with the local message if the report cannot be sent", async () => {
  const state = setup({ offline: true }), save = element();
  for (let i = 0; i < 5; i++) click(state, save);
  assert.equal(click(state, save), true, "the click is blocked even when offline");
  await settle();
  assert.deepEqual(state.toasts, [{ message: "You're clicking too fast. Try again in 10 seconds.", id: "click-limit" }]);
});

test("each button is counted separately and steppers opt out", () => {
  const state = setup(), first = element(), second = element(), stepper = element("button", true);
  for (let i = 0; i < 5; i++) click(state, first);
  assert.equal(click(state, first), true);
  assert.equal(click(state, second), false);
  for (let i = 0; i < 20; i++) assert.equal(click(state, stepper), false);
  assert.equal(click(state, { closest: () => null }), false, "clicks outside buttons are ignored");
});

test("navigation links are limited like buttons; other elements are not", () => {
  const state = setup(), nav = element("a"), heading = element("h1");
  for (let i = 0; i < 5; i++) assert.equal(click(state, nav), false, `link click ${i + 1}`);
  assert.equal(click(state, nav), true, "sixth quick click on a sidebar link is blocked");
  for (let i = 0; i < 10; i++) assert.equal(click(state, heading), false);
});

test("/api/rate-limit answers 429 with Retry-After and a bounded wait", async () => {
  const exports = {};
  vm.runInNewContext(compile("app/api/rate-limit/route.ts"), { exports, Response, Math, Number, String });
  const post = body => exports.POST(new Request("http://localhost/api/rate-limit", { method: "POST", body }));
  const response = await post(JSON.stringify({ retry_after_seconds: 7 }));
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "7");
  assert.deepEqual(await response.json(), { error: "You're clicking too fast. Try again in 7 seconds.", code: "RATE_LIMITED", retry_after_seconds: 7 });
  for (const [body, expected] of [[JSON.stringify({ retry_after_seconds: 999 }), 10], [JSON.stringify({ retry_after_seconds: -5 }), 1], ["not json", 10], [JSON.stringify({ retry_after_seconds: "x" }), 10]]) {
    assert.equal((await (await post(body)).json()).retry_after_seconds, expected, body);
  }
  const serverRes = await post(JSON.stringify({ source: "server", retry_after_seconds: 60, message: "Too many reset requests." }));
  assert.equal(serverRes.status, 429);
  assert.equal(serverRes.headers.get("retry-after"), "60");
  assert.deepEqual(await serverRes.json(), { error: "Too many reset requests.", code: "RATE_LIMITED", retry_after_seconds: 60 });
});
