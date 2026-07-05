import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const banksRouteSource = readFileSync(
  join(process.cwd(), "src/app/api/banks/route.ts"),
  "utf8",
);
const knowledgeBanksRouteSource = readFileSync(
  join(process.cwd(), "src/app/api/knowledge-banks/route.ts"),
  "utf8",
);

test("question bank list supports authenticated owner=mine filtering", () => {
  assert.match(banksRouteSource, /searchParams\.get\("owner"\) === "mine"/);
  assert.match(banksRouteSource, /creatorId: session\.user\.id/);
  assert.match(banksRouteSource, /owner=mine/);
});

test("knowledge bank list supports authenticated owner=mine filtering", () => {
  assert.match(knowledgeBanksRouteSource, /searchParams\.get\("owner"\) === "mine"/);
  assert.match(knowledgeBanksRouteSource, /creatorId: session\.user\.id/);
  assert.match(knowledgeBanksRouteSource, /owner=mine/);
});
