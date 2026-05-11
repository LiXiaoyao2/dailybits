import assert from "node:assert/strict";
import test from "node:test";
import { paginateKnowledgePoints } from "./pagination";

test("paginateKnowledgePoints exposes all 60 points across three 20 item pages", () => {
  const points = Array.from({ length: 60 }, (_, index) => ({
    id: `point-${index + 1}`,
    content: `Point ${index + 1}`,
  }));

  const first = paginateKnowledgePoints(points, 1, 20);
  const third = paginateKnowledgePoints(points, 3, 20);

  assert.equal(first.totalPages, 3);
  assert.equal(first.items.length, 20);
  assert.equal(first.items[0].displayIndex, 1);
  assert.equal(first.items[19].displayIndex, 20);
  assert.equal(third.items.length, 20);
  assert.equal(third.items[0].displayIndex, 41);
  assert.equal(third.items[19].displayIndex, 60);
});

test("paginateKnowledgePoints clamps out of range page numbers", () => {
  const points = Array.from({ length: 21 }, (_, index) => ({
    id: `point-${index + 1}`,
    content: `Point ${index + 1}`,
  }));

  assert.equal(paginateKnowledgePoints(points, 99, 20).page, 2);
  assert.equal(paginateKnowledgePoints(points, 0, 20).page, 1);
});
