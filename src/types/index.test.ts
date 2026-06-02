import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_KNOWLEDGE_PUSH_TIMES,
  DEFAULT_PUSH_TIMES,
  MAX_PUSH_TIMES_PER_SUBSCRIPTION,
} from "./index";

test("question and knowledge subscriptions default to two daytime push times", () => {
  assert.deepEqual(DEFAULT_PUSH_TIMES, ["09:30", "14:00"]);
  assert.deepEqual(DEFAULT_KNOWLEDGE_PUSH_TIMES, DEFAULT_PUSH_TIMES);
});

test("question and knowledge subscriptions allow at most fifteen push times", () => {
  assert.equal(MAX_PUSH_TIMES_PER_SUBSCRIPTION, 15);
});
