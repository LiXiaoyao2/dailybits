import assert from "node:assert/strict";
import test from "node:test";
import { buildPushHistoryPage } from "./history";

test("buildPushHistoryPage merges question and knowledge logs by pushedAt", () => {
  const page = buildPushHistoryPage({
    questionLogs: [
      {
        pushedAt: new Date("2026-05-11T01:00:00.000Z"),
        question: {
          content: "Question content",
          correctAnswer: "A",
          bank: { title: "Question Bank" },
        },
      },
    ],
    knowledgeLogs: [
      {
        pushedAt: new Date("2026-05-11T02:00:00.000Z"),
        contentSnapshot: "Knowledge card content",
        bank: { title: "Knowledge Bank" },
      },
    ],
    page: 1,
    pageSize: 10,
  });

  assert.equal(page.total, 2);
  assert.equal(page.logs[0].kind, "knowledge");
  assert.equal(page.logs[0].bankName, "Knowledge Bank");
  assert.equal(page.logs[0].questionExcerpt, "Knowledge card content");
  assert.equal(page.logs[1].kind, "question");
});
