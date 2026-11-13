import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
test("all eight credential editors remain locked and redact values", () => {
  const source = ts.transpileModule(readFileSync(new URL("../src/app/admin/settings/custom-credentials.tsx", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const modules = {
    "./credential-otp-dialog": { CredentialOtpDialog: () => null },
    react: React, "react/jsx-runtime": jsxRuntime,
    "@/components/permission-controls": { withPermission: (_permission, Component) => Component },
    "next/navigation": { useRouter: () => ({ refresh() {} }) },
    "@/components/ui/button": { Button: ({ loading, variant, ...props }) => { void loading; void variant; return React.createElement("button", props); } },
    "@/components/ui/field": { TextField: () => null }, "@/components/ui/modal": { Modal: () => null },
    "@/app/actions/credentials": { readCredentialSettings() {}, saveCredentialSettings() {} },
  };
  const exports = {}; vm.runInNewContext(source, { exports, require: name => { assert(name in modules, name); return modules[name]; } });
  const providers = Object.fromEntries(["google", "smtp", "recaptcha", "cloudinary", "native_push", "onesignal", "posthog", "sentry"].map(name => [name, { source: "original", configured: false, values: { client_id: "fixture-sensitive-value" }, secrets: {} }]));
  const markup = renderToStaticMarkup(React.createElement(exports.CustomCredentials, { initial: { locked: true, providers } }));
  assert.match(markup, /Google sign-in/); assert.match(markup, /Email \(SMTP\)/); assert.match(markup, /reCAPTCHA/);
  for (const name of ["cloudinary", "maps", "onesignal", "posthog", "sentry"]) assert(!markup.includes('aria-controls="credentials-' + name + '"'));
  for (const label of ["Cloudinary", "OneSignal", "PostHog", "Sentry", "Browser push (VAPID)"]) assert(markup.includes(label));
  assert.match(markup, /Unlock credentials/);
  assert.equal((markup.match(/ disabled=""/g) || []).length, 8);
  assert(!markup.includes("custom-google-client_id"));
  assert(!markup.includes("fixture-sensitive-value"));
});
