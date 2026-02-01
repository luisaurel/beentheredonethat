export const STAMP_LIMITS = { bronze: 5, silver: 10, gold: 20 } as const;

export const STAMP_STARTS = {
  bronze: 1,
  silver: STAMP_LIMITS.bronze + 1,              // 6
  gold: STAMP_LIMITS.bronze + STAMP_LIMITS.silver + 1, // 16
} as const;

export function getTierStarted(total: number) {
  return {
    bronze: total >= STAMP_STARTS.bronze,
    silver: total >= STAMP_STARTS.silver,
    gold: total >= STAMP_STARTS.gold,
  };
}

/** Splittet den Gesamtcount in capped Kategorie-Counts */
export function splitCounts(total: number) {
  const bronze = Math.min(total, STAMP_LIMITS.bronze);

  const silverRaw = Math.max(total - STAMP_LIMITS.bronze, 0);
  const silver = Math.min(silverRaw, STAMP_LIMITS.silver);

  const goldRaw = Math.max(total - STAMP_LIMITS.bronze - STAMP_LIMITS.silver, 0);
  const gold = Math.min(goldRaw, STAMP_LIMITS.gold);

  return { bronze, silver, gold };
}
