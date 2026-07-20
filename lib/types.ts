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
  externalMergedPRs: number;
  maxExternalPRRepoStars: number;
  closedIssues: number;
  worldCupRepos: WorldCupRepo[];
  // True when GraphQL was unavailable (rate-limited / budget exhausted) and
  // this profile came from the cheap REST last-resort fallback instead —
  // real but reduced (no contribution history, no orgs). Re-attempted via
  // GraphQL on the next visit rather than cached for a full day; see
  // getGithubProfile in lib/github.ts.
  degraded: boolean;
  // False when one or more contribution-year chunks (or the rolling
  // lastYear window) never resolved, even after retry and bisection — see
  // missingYears. An incomplete profile is never durably (24h) cached; see
  // getGithubProfile/PartialProfileError in lib/github.ts.
  complete: boolean;
  // Calendar years whose contributionsCollection chunk never resolved.
  // Excluded from contributionsByYear (never fabricated as zero).
  missingYears: number[];
  // Debugging aid for the chunked-fetch pipeline: when this profile was
  // assembled and how many GraphQL requests it took (base + repo pages +
  // one per contribution year + the rolling-365-day window).
  computedAt: string;
  chunksUsed: number;
}

// Distinct 10k+ star repos the user landed a merged external PR in — each is
// its own "World Cup Player" occurrence (lib/achievements.ts).
export interface WorldCupRepo {
  name: string;
  stars: number;
  year: number;
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
  reviews: number;
  issues: number;
  totalContributions: number;
  hasData: boolean;
  // True for a year GitHub reports the user has contributions in
  // (contributionYears) but whose chunk hasn't resolved yet — distinct from
  // hasData: false, which means "resolved, genuinely zero" (an "on loan"
  // season). A pending season is rendered as a real row with a "syncing…"
  // placeholder, never silently dropped from the table.
  pending?: boolean;
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

// Derived stats consumed by lib/achievements.ts. Computed once in player.ts
// so achievement rules stay pure functions over plain data.
export interface AchievementStats {
  maxRepoStars: number;
  totalForks: number;
  languageCount: number;
  externalMergedPRs: number;
  maxExternalPRRepoStars: number;
  closedIssues: number;
  followers: number;
  longestStreakDays: number;
  publicRepos: number;
  accountAgeYears: number;
  maxCommitsInYear: number;
  maxCommitsYear: number;
  maxInactivityGapDays: number;
  hadLoanSpell: boolean;
  hasFridayEveningCommit: boolean;
}

export interface Player {
  login: string;
  name: string;
  avatarUrl: string;
  bio: string | null;
  currentClub: string;
  currentClubAvatar: string | null;
  joinedDate: string;
  joinedYear: number;
  birthDate: string;
  age: number;
  birthPlace: string;
  nationalityName: string;
  nationalityIso2: string | null;
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
  achievementStats: AchievementStats;
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
  worldCupRepos: WorldCupRepo[];
  // Surfaces GithubProfile.complete/missingYears/degraded to the UI so a
  // partial fetch is shown as partial (banner + "syncing…" season rows)
  // instead of silently rendering as if it were the full picture.
  dataCompleteness: {
    complete: boolean;
    missingYears: number[];
    degraded: boolean;
  };
}
