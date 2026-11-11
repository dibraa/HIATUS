import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
function load(file) {
  const exports = {};
  const source = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(source, { exports, URLSearchParams, require: () => ({}) });
  return exports;
}
const { menuPage } = load('../src/lib/menu-pagination.ts');
const { buildHref } = load('../src/components/menu-filters.tsx');
test('41 products produce six non-overlapping pages with eight items except the last', () => {
  const products = Array.from({ length: 41 }, (_, i) => i);
  const selected = [];
  for (let i = 1; i <= 6; i++) {
    const p = menuPage(products.length, String(i));
    assert.equal(p.pages, 6);
    const items = products.slice(p.start, p.end);
    assert.equal(items.length, i === 6 ? 1 : 8);
    selected.push(...items);
  }
  assert.deepEqual(selected, products);
});
test('invalid pages and smaller filtered results never create an empty extra page', () => {
  for (const value of [undefined, '', '0', '-1', '1.5', 'abc', 'Infinity', '999999999999999999999']) {
    assert.equal(menuPage(41, value).page, 1);
  }
  assert.equal(menuPage(41, '999').page, 6);
  assert.equal(menuPage(6, '6').page, 1);
  assert.equal(menuPage(0, '2').start, 0);
});
test('page links retain all filters and new filter links omit previous page', () => {
  const filters = { query: 'milk & coffee', category: 'Cold Brew Kopi', flavor: 'Ube' };
  const url = new URL(buildHref({ ...filters, page: 3 }), 'http://localhost');
  assert.equal(url.searchParams.get('q'), filters.query);
  assert.equal(url.searchParams.get('category'), filters.category);
  assert.equal(url.searchParams.get('flavor'), filters.flavor);
  assert.equal(url.searchParams.get('page'), '3');
  assert.equal(new URL(buildHref(filters), 'http://localhost').searchParams.has('page'), false);
});
