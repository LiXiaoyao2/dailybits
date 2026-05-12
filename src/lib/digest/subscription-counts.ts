import type { DigestType } from "../../types";

export const DIGEST_TYPES = ["GITHUB_TRENDING", "AI_NEWS", "ARXIV_AI_PAPERS"] as const;

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
