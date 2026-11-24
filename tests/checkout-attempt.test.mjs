import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function loadAttemptModule() {
  const source = ts.transpileModule(
    readFileSync(new URL("../src/lib/checkout-attempt.ts", import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }
  ).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, crypto: globalThis.crypto });
  return exports;
}

function memoryStorage() {
  const map = new Map();
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); },
  };
}

test("same cart reuses the persisted checkout attempt key across interruptions and reloads", () => {
  const { getCheckoutAttemptKey, clearCheckoutAttemptKey } = loadAttemptModule();
  const storage = memoryStorage();
  const items = [{ menuItemId: "6742b3c4d5e6f708192a3b4c", quantity: 1, size: "M" }];

  const first = getCheckoutAttemptKey(storage, items);
  assert.match(first, /^[A-Za-z0-9_-]{16,128}$/);

  // Simulates returning from /session-unavailable or retrying after network drop.
  const retry = getCheckoutAttemptKey(storage, [{ ...items[0] }]);
  assert.equal(retry, first);

  // After a successful order clears the cart, a new intentional order gets a fresh key.
  clearCheckoutAttemptKey(storage);
  const nextOrder = getCheckoutAttemptKey(storage, items);
  assert.notEqual(nextOrder, first);
});

test("modifying the cart rotates the checkout attempt key while item order alone does not", () => {
  const { getCheckoutAttemptKey } = loadAttemptModule();
  const storage = memoryStorage();
  const a = { menuItemId: "6742b3c4d5e6f708192a3b4c", quantity: 1, size: "M" };
  const b = { menuItemId: "6742b3c4d5e6f708192a3b4d", quantity: 2, size: "L" };

  const key1 = getCheckoutAttemptKey(storage, [a, b]);
  const keyReordered = getCheckoutAttemptKey(storage, [b, a]);
  assert.equal(keyReordered, key1);

  const keyModified = getCheckoutAttemptKey(storage, [{ ...a, quantity: 2 }, b]);
  assert.notEqual(keyModified, key1);
});

test("corrupted storage recovers cleanly with a valid attempt key", () => {
  const { getCheckoutAttemptKey } = loadAttemptModule();
  const storage = memoryStorage();
  storage.setItem("hiatus-checkout-attempt", "{not-valid-json");
  const key = getCheckoutAttemptKey(storage, [{ menuItemId: "6742b3c4d5e6f708192a3b4c", quantity: 1, size: "S" }]);
  assert.match(key, /^[A-Za-z0-9_-]{16,128}$/);
});
