import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("review uploads allow the 16 MB limit declared by the form", () => {
  const nextConfig = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");
  const match = nextConfig.match(/bodySizeLimit:\s*"(\d+)mb"/);

  assert.ok(match, "Next.js Server Actions must define a body size limit");
  assert.ok(
    Number(match[1]) >= 16,
    `Server Action limit must be at least 16 MB; found ${match[1]} MB`,
  );
});
