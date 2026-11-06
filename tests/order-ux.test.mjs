import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
function load(file, modules = {}) {
  const source = ts.transpileModule(readFileSync(new URL("../src/" + file, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, Intl, require: name => { assert(name in modules, name); return modules[name]; } });
  return exports;
}
const sizes = load("lib/sizes.ts");
const { SizeSelector } = load("components/ui/size-selector.tsx", { "react/jsx-runtime": jsxRuntime, "@/lib/sizes": sizes });
test("size labels use actual item prices for custom, zero, negative, default and floored deltas", () => {
  for (const [basePrice, pricing, labels] of [
    [140, { S: 0, M: 0, L: 30 }, ["Small, 12 oz", "Medium, 16 oz", "Large, 22 oz, plus 30 pesos"]],
    [140, { S: -20, L: -10 }, ["Small, 12 oz, minus 20 pesos", "Medium, 16 oz", "Large, 22 oz, minus 10 pesos"]],
    [10, null, ["Small, 12 oz, minus 10 pesos", "Medium, 16 oz", "Large, 22 oz, plus 25 pesos"]],
  ]) {
    const html = renderToStaticMarkup(React.createElement(SizeSelector, { basePrice, pricing, value: "M", name: "fixture", onChange() {} }));
    assert.deepEqual([...html.matchAll(/aria-label="([^"]+)"/g)].map(match => match[1]), labels);
  }
});
test("display codes preserve legacy references and prefer immutable server references", () => {
  const { orderCode } = load("lib/format.ts");
  assert.equal(orderCode("abcdef123456789012345678"), "#ABCDEF");
  assert.equal(orderCode("abcdef123456789012345678", "H-234567"), "#H-234567");
});
