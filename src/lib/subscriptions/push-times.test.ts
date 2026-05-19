import assert from "node:assert/strict";
import test from "node:test";
import {
  getAllowedPushTimeCountForUpdate,
  isPushTimeCountAllowedForUpdate,
} from "./push-times";

test("push time updates can keep historical subscriptions above the current limit", () => {
  const existingTimes = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
  ];

  assert.equal(getAllowedPushTimeCountForUpdate(existingTimes), existingTimes.length);
  assert.equal(isPushTimeCountAllowedForUpdate(existingTimes, existingTimes), true);
});

test("push time updates cannot add more times to historical subscriptions over the limit", () => {
  const existingTimes = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
  ];

  assert.equal(
    isPushTimeCountAllowedForUpdate(
      [...existingTimes, "17:00"],
      existingTimes,
    ),
    false,
  );
});

test("push time updates enforce the eight-time limit for normal subscriptions", () => {
  const eightTimes = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
  ];

  assert.equal(isPushTimeCountAllowedForUpdate(eightTimes, ["09:30"]), true);
  assert.equal(
    isPushTimeCountAllowedForUpdate([...eightTimes, "16:00"], ["09:30"]),
    false,
  );
});
