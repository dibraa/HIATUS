import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
function load(file) {
  const exports = {};
  const source = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const formatPrice = (n) => `₱${n.toFixed(2)}`;
  vm.runInNewContext(source, { exports, Set, Number, require: () => ({ formatPrice }) });
  return exports;
}
const { quickCash, cashError, cashReference } = load('../src/lib/cash.ts');

test('quick cash offers exact plus the next 100, 500 and 1000 strictly above the total', () => {
  assert.deepEqual([...quickCash(350)], [350, 400, 500, 1000]);
  assert.deepEqual([...quickCash(400)], [400, 500, 1000]);
  assert.deepEqual([...quickCash(150.5)], [150.5, 200, 500, 1000]);
  assert.deepEqual([...quickCash(1200)], [1200, 1300, 1500, 2000]);
});

test('cash below the total, empty, or a slipped extra zero is refused', () => {
  assert.equal(cashError(360, 350), null);
  assert.equal(cashError(350, 350), null);
  assert.match(cashError(300, 350), /Short by ₱50.00/);
  assert.match(cashError(0, 350), /Type the cash/);
  assert.match(cashError(10351, 350), /over ₱10,000/);
  assert.equal(cashError(10350, 350), null);
});

test('the saved reference carries the exact cash and change', () => {
  assert.equal(cashReference(360, 350), 'Cash ₱360.00 · change ₱10.00');
});
