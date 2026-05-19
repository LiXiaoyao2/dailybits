import { MAX_PUSH_TIMES_PER_SUBSCRIPTION } from "@/types";

export function getAllowedPushTimeCountForUpdate(existingPushTimes?: string[] | null): number {
  return Math.max(
    MAX_PUSH_TIMES_PER_SUBSCRIPTION,
    Array.isArray(existingPushTimes) ? existingPushTimes.length : 0,
  );
}

export function isPushTimeCountAllowedForUpdate(
  nextPushTimes: string[],
  existingPushTimes?: string[] | null,
): boolean {
  return nextPushTimes.length <= getAllowedPushTimeCountForUpdate(existingPushTimes);
}

export function getPushTimeLimitMessage(): string {
  return `pushTimes cannot exceed ${MAX_PUSH_TIMES_PER_SUBSCRIPTION}`;
}
