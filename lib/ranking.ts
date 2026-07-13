// Ceiling per stat: the value at which the log curve saturates to 99.
// Chosen so a legend (e.g. torvalds' ~237k followers) lands at 99, an active
// dev (100+ stars / 500+ commits) lands in the 75-88 range, and a
// brand-new profile still starts at 60 rather than bottoming out near 0.
const CURVE_CEILING = {
  followers: 200_000,
  stars: 200_000,
  commitsThisSeason: 5_000,
} as const;

const CURVE_FLOOR = 60;
const CURVE_MAX = 99;

type LegendStat = keyof typeof CURVE_CEILING;

// Logarithmic 60-99 curve, independent of any reference dataset: raw activity
// in, a flattering-but-honest score out. Linear scaling made ordinary
// profiles read as single digits next to legends; log growth means each
// order of magnitude of activity buys a comparable score bump.
export function percentileOf(stat: LegendStat, value: number): number {
  const ceiling = CURVE_CEILING[stat];
  const v = Math.max(0, value);
  const raw = CURVE_FLOOR + (CURVE_MAX - CURVE_FLOOR) * (Math.log10(v + 1) / Math.log10(ceiling + 1));
  return Math.min(CURVE_MAX, Math.max(CURVE_FLOOR, Math.round(raw)));
}

export type PercentileTier = "TOP 0.1%" | "TOP 1%" | "TOP 5%" | "TOP 15%" | "PROSPECT";

export interface TierInput {
  stars: number;
  commits: number;
  followers: number;
}

// Dynamic percentile badge shown on the card, replacing the old rank-vs-32-
// legends "#N". Thresholds are GitHub-activity benchmarks, not a comparison
// against the small legends dataset, so an ordinary active dev lands
// somewhere real (TOP 15% / TOP 5%) instead of "#36 of 40".
export function percentileTier({ stars, commits, followers }: TierInput): PercentileTier {
  if (stars >= 5_000 || commits >= 8_000 || followers >= 20_000) return "TOP 0.1%";
  if (stars >= 500 || commits >= 1_500 || followers >= 2_000) return "TOP 1%";
  if (stars >= 100 || commits >= 500 || followers >= 300) return "TOP 5%";
  if (stars >= 20 || commits >= 150 || followers >= 50) return "TOP 15%";
  return "PROSPECT";
}
