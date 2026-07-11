import referenceDataset from "./referenceDataset.json";

interface ReferenceEntry {
  login: string;
  name: string;
  avatarUrl: string;
  marketValue: number;
  marketValueFormatted: string;
  position: string;
  followers: number;
  stars: number;
  commitsThisSeason: number;
}

const REFERENCE: ReferenceEntry[] = referenceDataset;

export interface RankingResult {
  rank: number;
  total: number;
  percentile: number;
}

// Ranks the player's market value against the static reference dataset
// (lib/referenceDataset.json — see scripts/generate-reference-dataset.ts).
// `filterPosition`, if given, narrows the comparison set to players sharing
// the same main position.
export function rankAgainstReference(
  login: string,
  marketValue: number,
  filterPosition?: string
): RankingResult {
  const pool = filterPosition ? REFERENCE.filter((r) => r.position === filterPosition) : REFERENCE;
  const values = pool
    .filter((r) => r.login.toLowerCase() !== login.toLowerCase())
    .map((r) => r.marketValue)
    .concat(marketValue)
    .sort((a, b) => b - a);

  const rank = values.indexOf(marketValue) + 1;
  const total = values.length;
  // "Top N%" phrasing: rank 1 of 32 -> top 3%, not top 100%.
  const percentile = Math.max(1, Math.round((rank / total) * 100));

  return { rank, total, percentile };
}

type LegendStat = "followers" | "stars" | "commitsThisSeason";

// Statistical percentile (0-99): what fraction of legends this value beats
// or ties. Higher value -> higher percentile, the opposite convention from
// rankAgainstReference's "top N%" — this is what the stat-card rings show.
export function percentileOf(stat: LegendStat, value: number): number {
  const values = REFERENCE.map((r) => r[stat]);
  if (values.length === 0) return 50;
  const countBelowOrEqual = values.filter((v) => v <= value).length;
  const percentile = Math.round((countBelowOrEqual / values.length) * 100);
  return Math.min(99, Math.max(1, percentile));
}
