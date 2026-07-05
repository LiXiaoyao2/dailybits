import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const statsSource = readFileSync(
  join(process.cwd(), "src/components/dashboard/stats-cards.tsx"),
  "utf8",
);
const statsRouteSource = readFileSync(
  join(process.cwd(), "src/app/api/dashboard/stats/route.ts"),
  "utf8",
);

test("dashboard stats expose created question and knowledge bank counts", () => {
  assert.match(statsSource, /createdQuestionBanksCount: number/);
  assert.match(statsSource, /createdKnowledgeBanksCount: number/);
  assert.match(statsRouteSource, /createdQuestionBanksCount/);
  assert.match(statsRouteSource, /createdKnowledgeBanksCount/);
  assert.match(statsRouteSource, /createdBanksCount:\s*createdQuestionBanksCount \+ createdKnowledgeBanksCount/);
});
