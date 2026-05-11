import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_KNOWLEDGE_PUSH_TIMES, DEFAULT_PUSH_TIMES } from "./index";

test("knowledge subscriptions default to the same three push times as question banks", () => {
  assert.deepEqual(DEFAULT_KNOWLEDGE_PUSH_TIMES, DEFAULT_PUSH_TIMES);
});
