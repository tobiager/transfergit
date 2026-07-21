import type { FormationName } from "./formations";

export interface Contributor {
  login: string;
  avatarUrl: string;
  commits: number;
}

export interface ContributorValuation {
  login: string;
  followers: number;
  starsTotal: number;
  mainLanguage: string | null;
  countryName: string | null;
  countryIso2: string | null;
  marketValue: number | null;
  marketValueFormatted: string;
  // True when a valuation couldn't be fetched (after retry) and no prior
  // cached value exists — marketValue is null and excluded from squad totals.
  valuationPending?: boolean;
}

export type SquadPlayer = Contributor & ContributorValuation;

// Tier 2 (roster positions 31-100): never valued — no GitHub profile fetch
// at all, just what the single contributors REST call already returned.
export type ReservePlayer = Contributor;

export interface PositionSlot {
  id: string;
  label: string;
  // Short display tag for the position pill (e.g. "CB", "CAM", "ST") — see
  // lib/squad/formations.ts for the per-formation role mapping.
  role: string;
  x: number;
  y: number;
}

export interface Starter extends SquadPlayer {
  position: PositionSlot;
}

export interface Squad {
  owner: string;
  repo: string;
  formation: FormationName;
  // Every formation name selectable at this squad's player count. Length 1
  // means there's no real choice — hide formation pills in that case.
  formationOptions: FormationName[];
  starters: Starter[];
  bench: SquadPlayer[];
  // Tier 2 — unvalued reserves (roster positions 31-100). See ReservePlayer.
  reserves: ReservePlayer[];
  totalValue: number;
  totalValueFormatted: string;
  mvp: SquadPlayer;
  captain: SquadPlayer;
  // Logins whose valuation is pending (fetch failed after retry, no cache
  // to fall back to) — excluded from totalValue.
  pendingValuations: string[];
}
