import assert from "node:assert/strict";
import test from "node:test";
import { parseJsonText } from "./sync-json";

test("parseJsonText accepts JSON files with a UTF-8 BOM", () => {
  assert.deepEqual(parseJsonText('\uFEFF{"type":"knowledge","cards":["card"]}', "bom.json"), {
    type: "knowledge",
    cards: ["card"],
  });
});
