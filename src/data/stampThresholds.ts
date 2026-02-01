export const STAMP_THRESHOLDS = { bronze: 5, silver: 10, gold: 20 } as const;

export function getTier(count: number) {
  return {
    bronze: count >= STAMP_THRESHOLDS.bronze,
    silver: count >= STAMP_THRESHOLDS.silver,
    gold: count >= STAMP_THRESHOLDS.gold
  };
}
