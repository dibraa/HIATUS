import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToString } from 'react-dom/server';

test('initial open panels wait for hydration before rendering portals', () => {
  const source = ts.transpileModule(readFileSync(new URL('../src/lib/use-presence.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, require(name) { assert.equal(name, 'react'); return React; } });
  function Panel({ open }) {
    const { mounted } = exports.usePresence(open);
    return mounted ? React.createElement('div', { role: 'alertdialog' }, 'Ready') : null;
  }
  // Server output must match the initial hydration snapshot even if browser storage opens an alert.
  assert.equal(renderToString(React.createElement(Panel, { open: true })), '');
  assert.equal(renderToString(React.createElement(Panel, { open: false })), '');
});
