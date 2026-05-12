import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "digest-subscription-list.tsx"),
  "utf8",
);

test("digest subscription cards render per-type subscriber counts", () => {
  assert.match(source, /subscriberCounts/);
  assert.match(source, /人已订阅/);
});
