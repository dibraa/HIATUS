import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
test("custom credential editor renders only Google, SMTP and reCAPTCHA even with legacy extra providers", () => {
  const source = ts.transpileModule(readFileSync(new URL("../src/app/admin/settings/custom-credentials.tsx", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const modules = {
    react: React, "react/jsx-runtime": jsxRuntime,
    "@/components/permission-controls": { withPermission: (_permission, Component) => Component },
    "next/navigation": { useRouter: () => ({ refresh() {} }) },
    "@/components/ui/button": { Button: ({ loading, variant, ...props }) => { void loading; void variant; return React.createElement("button", props); } },
    "@/components/ui/field": { TextField: () => null }, "@/components/ui/modal": { Modal: () => null },
    "@/app/actions/credentials": { readCredentialSettings() {}, saveCredentialSettings() {} },
  };
  const exports = {}; vm.runInNewContext(source, { exports, require: name => { assert(name in modules, name); return modules[name]; } });
  const providers = Object.fromEntries(["google", "smtp", "recaptcha", "resend", "cloudinary", "maps", "onesignal", "posthog", "sentry"].map(name => [name, { source: "original", configured: false, values: {}, secrets: {} }]));
  const markup = renderToStaticMarkup(React.createElement(exports.CustomCredentials, { initial: { revision: "fixture", providers } }));
  assert.match(markup, /Google sign-in/); assert.match(markup, /Email \(SMTP\)/); assert.match(markup, /reCAPTCHA/);
  for (const name of ["resend", "cloudinary", "maps", "onesignal", "posthog", "sentry"]) assert(!markup.includes('aria-controls="credentials-' + name + '"'));
  assert.equal((markup.match(/aria-controls="credentials-/g) || []).length, 3);
});
