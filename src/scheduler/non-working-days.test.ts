import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "index.ts"),
  "utf8",
);

test("scheduler skips non-working days before any subscription push job runs", () => {
  const tickStart = source.indexOf("cron.schedule");
  const skipDecision = source.indexOf("const skipDecision = shouldSkipPushToday(now);", tickStart);
  const digestPush = source.indexOf("await runDueDigestSubscriptions", tickStart);
  const knowledgePush = source.indexOf("await runDueKnowledgeSubscriptions", tickStart);
  const questionQuery = source.indexOf("const matchedSubs = await prisma.subscription.findMany", tickStart);

  assert.notEqual(skipDecision, -1);
  assert.notEqual(digestPush, -1);
  assert.notEqual(knowledgePush, -1);
  assert.notEqual(questionQuery, -1);
  assert.ok(skipDecision < digestPush, "digest push should be behind non-working day check");
  assert.ok(skipDecision < knowledgePush, "knowledge push should be behind non-working day check");
  assert.ok(skipDecision < questionQuery, "question push should be behind non-working day check");
});
