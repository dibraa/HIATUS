import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";

const off = { google_enabled: false, recaptcha_enabled: false, google_client_id: null, recaptcha_site_key: null };
const on = { google_enabled: true, recaptcha_enabled: true, google_client_id: "review.apps.googleusercontent.com", recaptcha_site_key: "public-key" };
const result = options => ({ options, error: null });
function load(file, modules, globals = {}) {
  const compiled = ts.transpileModule(readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, AbortSignal, Response, ...globals, require: name => {
    assert(name in modules, `Unexpected dependency: ${name}`); return modules[name];
  } });
  return exports;
}

test("options preserve explicit off switches and never invent a disabled security policy on failure", async () => {
  for (const response of [off, on]) {
    const api = load("lib/authentication-options.ts", { "@/lib/api-client": { apiJson: async () => response } });
    const loaded = await api.getAuthenticationOptions();
    assert.equal(loaded.options, response); assert.equal(loaded.error, null);
  }
  for (const response of [{}, { ...on, recaptcha_site_key: null }, { ...off, recaptcha_enabled: "false" }]) {
    const api = load("lib/authentication-options.ts", { "@/lib/api-client": { apiJson: async () => response } });
    assert.equal((await api.getAuthenticationOptions()).options, null);
  }
  const failed = load("lib/authentication-options.ts", { "@/lib/api-client": { apiJson: async () => { throw Error("outage"); } } });
  const loaded = await failed.getAuthenticationOptions();
  assert.equal(loaded.options, null); assert.match(loaded.error, /email and password/);
});

test("the browser options endpoint is uncached for both success and failure", async () => {
  for (const value of [result(off), { options: null, error: "Unavailable" }]) {
    const route = load("app/api/auth/options/route.ts", { "@/lib/authentication-options": { getAuthenticationOptions: async () => value } });
    const response = await route.GET();
    assert.equal(response.status, value.options ? 200 : 503);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), value);
  }
});

function login(authentication) {
  let googleMounts = 0, captchaMounts = 0;
  const input = ({ label, ...props }) => React.createElement("label", null, label, React.createElement("input", props));
  const form = load("app/login/login-form.tsx", {
    react: React, "react/jsx-runtime": jsxRuntime,
    "next/navigation": { useSearchParams: () => new URLSearchParams() },
    "@/app/actions/auth": { signIn: async () => ({ error: null }) },
    "@/lib/use-authentication-options": { useAuthenticationOptions: initial => ({ ...initial, refresh() {} }) },
    "@/components/ui/field": { TextField: input, PasswordField: input, FormError: ({ children }) => children ? React.createElement("p", { role: "alert" }, children) : null },
    "@/components/ui/button": { Button: ({ loading, ...props }) => { void loading; return React.createElement("button", props); } },
    "@/components/ui/text-link": { TextLink: ({ href, children }) => React.createElement("a", { href }, children) },
    "@/components/google-sign-in": { GoogleSignIn: () => { googleMounts++; return React.createElement("div", { "data-provider": "google" }); } },
    "@/components/login-captcha": { LoginCaptcha: () => { captchaMounts++; return React.createElement("div", { "data-provider": "captcha" }); } },
  });
  const html = renderToStaticMarkup(React.createElement(form.LoginForm, { authentication }));
  return { html, googleMounts, captchaMounts };
}

test("both switches off render an enabled password form without mounting Google or CAPTCHA", () => {
  const rendered = login(result(off));
  assert.equal(rendered.googleMounts, 0); assert.equal(rendered.captchaMounts, 0);
  assert.doesNotMatch(rendered.html, /recaptcha_token|Complete the verification/);
  assert.match(rendered.html, /type="submit"/);
  assert.doesNotMatch(rendered.html, /disabled=""/);
});

test("an options outage allows a password attempt and offers retry without assuming CAPTCHA is off", () => {
  const rendered = login({ options: null, error: "Additional options unavailable" });
  assert.match(rendered.html, /Refresh sign-in options/);
  assert.doesNotMatch(rendered.html, /disabled=""/);
  assert.equal(rendered.googleMounts + rendered.captchaMounts, 0);
});

test("enabled CAPTCHA blocks submission until solved; Google stays independent", () => {
  const protectedForm = login(result({ ...on, google_enabled: false, google_client_id: null }));
  assert.match(protectedForm.html, /disabled=""/);
  assert.match(protectedForm.html, /name="recaptcha_token"/);
  assert.equal(protectedForm.captchaMounts, 1); assert.equal(protectedForm.googleMounts, 0);
  const googleOnly = login(result({ ...on, recaptcha_enabled: false, recaptcha_site_key: null }));
  assert.doesNotMatch(googleOnly.html, /disabled=""/);
  assert.equal(googleOnly.captchaMounts, 0); assert.equal(googleOnly.googleMounts, 1);
});

test("admin switches show saved enabled values and can be turned off when provider configuration is missing", () => {
  const { AuthenticationSettingsForm } = load("app/admin/settings/authentication-settings.tsx", {
    react: React, "react/jsx-runtime": jsxRuntime,
    "@/app/actions/settings": { saveAuthenticationSettings: async () => ({ error: null, success: "Saved." }) },
    "next/navigation": { useRouter: () => ({ refresh() {} }) },
    "@/components/ui/field": {
      CheckboxField: ({ label, hint, ...props }) => { void hint; return React.createElement("label", null, label, React.createElement("input", { type: "checkbox", ...props })); },
      FormError: () => null, FormSuccess: () => null,
    },
    "@/components/ui/button": { Button: ({ loading, ...props }) => { void loading; return React.createElement("button", props); } },
  });
  for (const enabled of [true, false]) {
    const html = renderToStaticMarkup(React.createElement(AuthenticationSettingsForm, {
      settings: { google_enabled: enabled, recaptcha_enabled: enabled, google_ready: false, recaptcha_ready: false }, error: null,
    }));
    const switches = html.match(/<input[^>]*type="checkbox"[^>]*>/g);
    assert.equal(switches.length, 2);
    for (const checkbox of switches) {
      assert.equal(checkbox.includes('checked=""'), enabled);
      assert.equal(checkbox.includes('disabled=""'), !enabled);
    }
  }
});

test("open forms pick up off switches on refresh and keep known CAPTCHA requirements during an outage", async () => {
  const states = [], windowEvents = new Map(), documentEvents = new Map();
  let effect, interval, cleanup, signal, response = result(on), failing = false, stateIndex = 0;
  const validator = load("lib/authentication-options.ts", { "@/lib/api-client": {} });
  const hook = load("lib/use-authentication-options.ts", {
    react: {
      useState(initial) { const index = stateIndex++; states[index] = initial; return [initial, value => { states[index] = typeof value === "function" ? value(states[index]) : value; }]; },
      useCallback: callback => callback, useEffect: callback => { effect = callback; },
    },
    "@/lib/authentication-options": validator,
  }, {
    AbortController,
    document: { visibilityState: "visible", addEventListener: (name, callback) => documentEvents.set(name, callback), removeEventListener: name => documentEvents.delete(name) },
    window: { setInterval: callback => { interval = callback; return 1; }, clearInterval() {}, addEventListener: (name, callback) => windowEvents.set(name, callback), removeEventListener: name => windowEvents.delete(name) },
    fetch: async (_url, options) => { signal = options.signal; if (failing) throw Error("outage"); return Response.json(response); },
  });
  const controls = hook.useAuthenticationOptions(result(on));
  cleanup = effect();
  const flush = () => new Promise(resolve => setImmediate(resolve));
  await flush();
  failing = true; await interval();
  assert.equal(states[0].options.recaptcha_enabled, true);
  assert.match(states[0].error, /Additional sign-in options/);
  response = result(off); failing = false;
  await windowEvents.get("focus")();
  assert.deepEqual(states[0].options, off); assert.equal(states[0].error, null);
  controls.refresh(); assert.equal(states[1], 1);
  cleanup();
  assert.equal(signal.aborted, true); assert.equal(windowEvents.size, 0); assert.equal(documentEvents.size, 0);
});
