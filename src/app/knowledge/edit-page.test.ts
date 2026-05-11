import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "[id]", "edit", "page.tsx"),
  "utf8",
);

test("knowledge edit page exposes a title editor wired to the existing PATCH API", () => {
  assert.match(source, /id="knowledge-bank-title"/);
  assert.match(source, /知识库标题/);
  assert.match(source, /const \[editTitle, setEditTitle\]/);
  assert.match(source, /body: JSON\.stringify\(\{\s*title: editTitle\.trim\(\)/);
});
