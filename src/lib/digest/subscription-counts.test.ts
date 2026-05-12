import assert from "node:assert/strict";
import test from "node:test";
import { buildDigestSubscriptionCounts } from "./subscription-counts";

test("digest subscription counts include every digest type with zero defaults", () => {
  assert.deepEqual(
    buildDigestSubscriptionCounts([
      { digestType: "GITHUB_TRENDING", _count: { _all: 2 } },
      { digestType: "ARXIV_AI_PAPERS", _count: { _all: 1 } },
    ]),
    {
      GITHUB_TRENDING: 2,
      AI_NEWS: 0,
      ARXIV_AI_PAPERS: 1,
    },
  );
});
