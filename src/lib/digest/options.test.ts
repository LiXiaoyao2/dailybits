import assert from "node:assert/strict";
import test from "node:test";
import {
  ALL_DIGEST_TYPES,
  SUBSCRIBABLE_DIGEST_TYPES,
  isDeliverableDigestType,
  isKnownDigestType,
  isSubscribableDigestType,
} from "./options";

test("arXiv paper digest remains known historical data but is no longer subscribable", () => {
  assert.deepEqual(ALL_DIGEST_TYPES, [
    "GITHUB_TRENDING",
    "AI_NEWS",
    "ARXIV_AI_PAPERS",
  ]);
  assert.deepEqual(SUBSCRIBABLE_DIGEST_TYPES, [
    "GITHUB_TRENDING",
    "AI_NEWS",
  ]);

  assert.equal(isKnownDigestType("ARXIV_AI_PAPERS"), true);
  assert.equal(isSubscribableDigestType("ARXIV_AI_PAPERS"), false);
  assert.equal(isDeliverableDigestType("ARXIV_AI_PAPERS"), false);
});
