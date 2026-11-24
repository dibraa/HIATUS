import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";

function load(file, modules = {}) {
  const source = ts.transpileModule(
    readFileSync(new URL("../src/" + file, import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }
  ).outputText;
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    require: (name) => {
      assert(name in modules, `Unexpected module: ${name}`);
      return modules[name];
    },
  });
  return exports;
}

const mockGsap = {
  registerPlugin() {},
  matchMedia: () => ({ add() {}, revert() {} }),
  timeline: () => ({ from() { return this; }, to() { return this; } }),
  from() {},
  to() {},
  fromTo() {},
  set() {},
};

const gsapStub = {
  gsap: mockGsap,
  ScrollTrigger: { batch() {}, create() {} },
  useGSAP() {},
  HIATUS_EASE: { arrive: "power3.out", tactile: "back.out(1.4)", smooth: "power2.inOut" },
  HIATUS_DUR: { feedback: 0.18, state: 0.28, reveal: 0.45, focal: 0.65 },
  MOTION_MEDIA: {
    motion: "(prefers-reduced-motion: no-preference)",
    reduce: "(prefers-reduced-motion: reduce)",
    desktop: "(min-width: 768px)",
  },
};

test("gsap bootstrap registers useGSAP + ScrollTrigger and exposes reduced-motion queries", () => {
  const registered = [];
  const mod = load("lib/gsap.ts", {
    gsap: { default: { registerPlugin: (...plugins) => registered.push(...plugins) }, registerPlugin: (...plugins) => registered.push(...plugins) },
    "gsap/ScrollTrigger": { ScrollTrigger: "ScrollTriggerPlugin" },
    "@gsap/react": { useGSAP: "useGSAPHook" },
  });
  assert.deepEqual(registered, ["useGSAPHook", "ScrollTriggerPlugin"]);
  assert.equal(mod.MOTION_MEDIA.reduce, "(prefers-reduced-motion: reduce)");
  assert.equal(mod.MOTION_MEDIA.motion, "(prefers-reduced-motion: no-preference)");
  assert.equal(mod.HIATUS_EASE.arrive, "power2.out");
  assert.equal(mod.HIATUS_EASE.tactile, "power2.out");
  assert(mod.HIATUS_DUR.feedback >= 0.25 && mod.HIATUS_DUR.focal >= 0.9);
});

test("OrderProgress renders accessible SSR markup with progress bars and hides cancelled orders", () => {
  const { OrderProgress } = load("components/order-progress.tsx", {
    react: React,
    "react/jsx-runtime": jsxRuntime,
    "@/lib/gsap": gsapStub,
  });

  const cancelled = renderToStaticMarkup(React.createElement(OrderProgress, { status: "cancelled" }));
  assert.equal(cancelled, "");

  const ready = renderToStaticMarkup(React.createElement(OrderProgress, { status: "ready" }));
  assert.match(ready, /aria-label="Order progress"/);
  assert.match(ready, /aria-current="step"/);
  assert.match(ready, /Waiting for you/);
  // Steps 0 (pending), 1 (preparing), 2 (ready) should have active fill bars.
  assert.equal([...ready.matchAll(/data-step-bar/g)].length, 3);
});

test("CartBadge renders accessible SSR counts only after hydration", () => {
  let cartState = { totalItems: 3, hydrated: false };
  const { CartBadge } = load("components/cart-badge.tsx", {
    react: React,
    "react/jsx-runtime": jsxRuntime,
    "next/link": {
      default: ({ href, children, ...rest }) => React.createElement("a", { href, ...rest }, children),
    },
    "@/lib/cart-context": { useCart: () => cartState },
    "@/lib/gsap": gsapStub,
  });

  const unhydrated = renderToStaticMarkup(React.createElement(CartBadge));
  assert.match(unhydrated, /aria-label="Cart, empty"/);
  assert.doesNotMatch(unhydrated, /\(3\)/);

  cartState = { totalItems: 3, hydrated: true };
  const hydrated = renderToStaticMarkup(React.createElement(CartBadge));
  assert.match(hydrated, /aria-label="Cart, 3 items"/);
  assert.match(hydrated, /\(3\)/);
});

test("GsapStagger and GsapLineDraw keep children visible in SSR HTML", () => {
  const { GsapStagger } = load("components/motion/gsap-stagger.tsx", {
    react: React,
    "react/jsx-runtime": jsxRuntime,
    "@/lib/gsap": gsapStub,
  });
  const { GsapLineDraw } = load("components/motion/gsap-line-draw.tsx", {
    react: React,
    "react/jsx-runtime": jsxRuntime,
    "@/lib/gsap": gsapStub,
  });

  const gridHtml = renderToStaticMarkup(
    React.createElement(GsapStagger, { mode: "scroll" }, React.createElement("p", null, "Spanish Latte"))
  );
  assert.match(gridHtml, /Spanish Latte/);
  assert.doesNotMatch(gridHtml, /opacity:\s*0/);

  const chartHtml = renderToStaticMarkup(
    React.createElement(GsapLineDraw, null, React.createElement("svg", null, React.createElement("polyline", { points: "0,50 100,10" })))
  );
  assert.match(chartHtml, /polyline/);
});
