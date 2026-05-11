import assert from "node:assert/strict";
import test from "node:test";
import { buildKnowledgePushPayload } from "./delivery";

test("buildKnowledgePushPayload sends knowledge cards as a single digest-style item", () => {
  assert.deepEqual(
    buildKnowledgePushPayload({
      receiver: "user-1",
      title: "Knowledge Bank",
      content: "Knowledge card content",
      knowledgeBankId: "bank-1",
      knowledgePointId: "point-1",
    }),
    {
      receiver: "user-1",
      title: "Knowledge Bank",
      items: ["Knowledge card content"],
      knowledgeBankId: "bank-1",
      knowledgePointId: "point-1",
    },
  );
});
