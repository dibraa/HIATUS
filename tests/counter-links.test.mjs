import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

test('legacy POS bookmarks keep the order and search across all payment filters', async () => {
  const source = ts.transpileModule(readFileSync(new URL('../src/app/staff/pos/page.tsx', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  let target;
  const exports = {};
  vm.runInNewContext(source, { exports, URLSearchParams, require(name) { assert.equal(name, 'next/navigation'); return { redirect(url) { target = url; } }; } });
  for (const tab of ['unpaid','paid','reversed']) {
    await exports.default({ searchParams: Promise.resolve({ tab, order: 'fixture-order', q: 'Customer & coffee' }) });
    const url = new URL(target, 'http://localhost');
    assert.equal(url.pathname, '/staff');
    assert.equal(url.searchParams.get('order'), 'fixture-order');
    assert.equal(url.searchParams.get('q'), 'Customer & coffee');
    assert.equal(url.searchParams.get('tab'), tab === 'unpaid' ? 'unpaid' : 'history');
    assert.equal(url.searchParams.get('payment'), tab === 'unpaid' ? null : tab);
  }
});
