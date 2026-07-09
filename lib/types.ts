export interface GithubRepo {
  name: string;
  stars: number;
  forks: number;
  language: string | null;
  createdAt: string;
  pushedAt: string;
}

export interface GithubOrg {
  login: string;
  avatarUrl: string;
  name: string | null;
}

export interface YearContribution {
  year: number;
  commits: number;
  pullRequests: number;
  issues: number;
  reviews: number;
  totalContributions: number;
}

export interface ContributionDay {
  date: string;
  count: number;
}

export interface GithubProfile {
  login: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  location: string | null;
  company: string | null;
  createdAt: string;
  followers: number;
  following: number;
  publicRepos: number;
  websiteUrl: string | null;
  twitterUsername: string | null;
  repositories: GithubRepo[];
  organizations: GithubOrg[];
  contributionsByYear: YearContribution[];
  lastYearCalendar: ContributionDay[];
  lastYearCommits: number;
}

export interface MarketValuePoint {
  year: number;
  value: number;
}

export interface SeasonStat {
  year: number;
  activeDays: number;
  commits: number;
  pullRequests: number;
  issues: number;
  totalContributions: number;
  hasData: boolean;
}

export interface TransferRecord {
  season: string;
  from: string;
  to: string;
  fee: string;
}

export interface Injury {
  name: string;
  from: string;
  to: string;
  daysOut: number;
  matchesMissed: number;
}

export interface PlayerPosition {
  main: string;
  secondary: string;
  foot: string;
}

export interface RatingMetric {
  key: string;
  label: string;
  rawLabel: string;
  score: number;
}

export interface Player {
  login: string;
  name: string;
  avatarUrl: string;
  bio: string | null;
  currentClub: string;
  joinedDate: string;
  joinedYear: number;
  contractUntil: string;
  birthDate: string;
  age: number;
  birthPlace: string;
  nationalityFlag: string;
  nationalityName: string | null;
  agent: string;
  provider: string;
  position: PlayerPosition;
  scoutReport: string;
  ratings: RatingMetric[];
  marketValueUpdatedAt: string;
  trophies: {
    stars: number;
    forks: number;
    repos: number;
    followers: number;
  };
  marketValue: number;
  marketValueFormatted: string;
  marketValueHistory: MarketValuePoint[];
  recordValue: {
    value: number;
    formatted: string;
    year: number;
  };
  seasons: SeasonStat[];
  transfers: TransferRecord[];
  injuries: Injury[];
}
