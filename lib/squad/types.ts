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
  marketValue: number;
  marketValueFormatted: string;
}

export type SquadPlayer = Contributor & ContributorValuation;

export interface PositionSlot {
  id: string;
  label: string;
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
  starters: Starter[];
  bench: SquadPlayer[];
  totalValue: number;
  totalValueFormatted: string;
  mvp: SquadPlayer;
  captain: SquadPlayer;
}
