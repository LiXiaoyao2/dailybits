import type { DigestType } from "../../types";

export const ALL_DIGEST_TYPES = [
  "GITHUB_TRENDING",
  "AI_NEWS",
  "ARXIV_AI_PAPERS",
] as const satisfies readonly DigestType[];

export const SUBSCRIBABLE_DIGEST_TYPES = [
  "GITHUB_TRENDING",
  "AI_NEWS",
] as const satisfies readonly DigestType[];

export const DELIVERABLE_DIGEST_TYPES = SUBSCRIBABLE_DIGEST_TYPES;

export type SubscribableDigestType = (typeof SUBSCRIBABLE_DIGEST_TYPES)[number];

function includesDigestType(
  values: readonly DigestType[],
  value: unknown,
): value is DigestType {
  return typeof value === "string" && values.includes(value as DigestType);
}

export function isKnownDigestType(value: unknown): value is DigestType {
  return includesDigestType(ALL_DIGEST_TYPES, value);
}

export function isSubscribableDigestType(
  value: unknown,
): value is SubscribableDigestType {
  return includesDigestType(SUBSCRIBABLE_DIGEST_TYPES, value);
}

export function isDeliverableDigestType(value: unknown): value is DigestType {
  return includesDigestType(DELIVERABLE_DIGEST_TYPES, value);
}
