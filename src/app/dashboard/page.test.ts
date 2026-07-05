import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "page.tsx"),
  "utf8",
);

test("dashboard renders digest subscription list", () => {
  assert.match(source, /DigestSubscriptionList/);
  assert.match(source, /<DigestSubscriptionList\s*\/>/);
});
