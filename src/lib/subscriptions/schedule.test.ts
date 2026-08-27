import assert from "node:assert/strict";
import test from "node:test";
import {
  formatSubscriptionSchedule,
  parseQuestionBankSchedule,
} from "./schedule";

test("weekly fixed bank schedule defaults to Monday when no weekday is provided", () => {
  const parsed = parseQuestionBankSchedule({
    subscriptionScheduleMode: "FIXED",
    subscriptionCadence: "WEEKLY",
    subscriptionPushTimes: ["09:30"],
  });

  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.deepEqual(parsed.value.subscriptionWeekdays, [1]);
    assert.equal(formatSubscriptionSchedule(parsed.value), "周一 09:30");
  }
});

test("bank schedule rejects malformed push times", () => {
  const parsed = parseQuestionBankSchedule({
    subscriptionScheduleMode: "FIXED",
    subscriptionCadence: "DAILY",
    subscriptionPushTimes: ["25:00"],
  });

  assert.equal(parsed.ok, false);
});

test("custom bank schedule is labeled as subscriber controlled", () => {
  const parsed = parseQuestionBankSchedule({
    subscriptionScheduleMode: "CUSTOM",
  });

  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(formatSubscriptionSchedule(parsed.value), "订阅者自定义推送时间");
  }
});
