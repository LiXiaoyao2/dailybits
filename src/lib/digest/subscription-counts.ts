import type { DigestType } from "../../types";
import { ALL_DIGEST_TYPES } from "./options";

export const DIGEST_TYPES = ALL_DIGEST_TYPES;

export type DigestSubscriptionCounts = Record<DigestType, number>;

interface DigestSubscriptionCountRow {
  digestType: DigestType;
  _count: {
    _all: number;
  };
}

export function buildDigestSubscriptionCounts(
  rows: DigestSubscriptionCountRow[],
): DigestSubscriptionCounts {
  const counts = Object.fromEntries(
    DIGEST_TYPES.map((digestType) => [digestType, 0]),
  ) as DigestSubscriptionCounts;

  for (const row of rows) {
    counts[row.digestType] = row._count._all;
  }

  return counts;
}
