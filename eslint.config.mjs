import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Agent tooling checked out alongside the app. These are CommonJS helper
    // scripts, not application code — linting them with the app's TS rules only
    // reports that `.cjs` files use `require()`, which is what they are for.
    ".claude/**",
    ".impeccable/**",
    ".playwright-mcp/**",
  ]),
]);

export default eslintConfig;
