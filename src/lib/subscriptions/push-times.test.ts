import assert from "node:assert/strict";
import test from "node:test";
import {
  getAllowedPushTimeCountForUpdate,
  isPushTimeCountAllowedForUpdate,
} from "./push-times";

function makeHourlyTimes(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `${String(8 + index).padStart(2, "0")}:00`);
}

test("push time updates can keep historical subscriptions above the current limit", () => {
  const existingTimes = makeHourlyTimes(16);

  assert.equal(getAllowedPushTimeCountForUpdate(existingTimes), existingTimes.length);
  assert.equal(isPushTimeCountAllowedForUpdate(existingTimes, existingTimes), true);
});

test("push time updates cannot add more times to historical subscriptions over the limit", () => {
  const existingTimes = makeHourlyTimes(16);

  assert.equal(
    isPushTimeCountAllowedForUpdate(
      [...existingTimes, "23:30"],
      existingTimes,
    ),
    false,
  );
});

test("push time updates enforce the fifteen-time limit for normal subscriptions", () => {
  const fifteenTimes = makeHourlyTimes(15);

  assert.equal(isPushTimeCountAllowedForUpdate(fifteenTimes, ["09:30"]), true);
  assert.equal(
    isPushTimeCountAllowedForUpdate([...fifteenTimes, "23:00"], ["09:30"]),
    false,
  );
});
