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

test("digest subscription cards show subscriber counts as title-row badges", () => {
  assert.match(
    source,
    /<CardTitle className="flex min-w-0 flex-wrap items-center gap-2">[\s\S]*<Badge[\s\S]*aria-label=\{`\$\{option\.title\} \$\{subscriberCounts\[option\.type\]\} 人已订阅`\}/,
  );
  assert.doesNotMatch(
    source,
    /<div className="text-xs text-muted-foreground">\s*\{subscriberCounts\[option\.type\]\} 人已订阅\s*<\/div>/,
  );
});
