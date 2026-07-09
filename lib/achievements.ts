import type { Player } from "./types";

// Achievements are evaluated against the fully-built player (including the
// derived achievementStats), matching GitFut/Transfermarkt's "trophy
// cabinet" concept.
export type PlayerProfile = Player;

export type Tier = "squad" | "international" | "ballon-dor";

export interface AchievementProgress {
  current: number;
  target: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: "Repositories" | "Impact" | "Career" | "Medical Record" | "Dev Culture";
  tier: Tier;
  check: (p: PlayerProfile) => boolean;
  progress?: (p: PlayerProfile) => AchievementProgress;
  // Best-effort estimate of when the achievement was unlocked. Omitted when
  // there's no reliable single date to attach to the rule.
  dateHint?: (p: PlayerProfile) => string | null;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "golden-boot-repo",
    name: "The Standout",
    description: "At least 1 owned repo with 50+ stars",
    category: "Repositories",
    tier: "international",
    check: (p) => p.achievementStats.maxRepoStars >= 50,
  },
  {
    id: "playmaker",
    name: "Game Creator",
    description: "30+ forks across all repos combined",
    category: "Repositories",
    tier: "squad",
    check: (p) => p.achievementStats.totalForks >= 30,
    progress: (p) => ({ current: Math.min(p.achievementStats.totalForks, 30), target: 30 }),
  },
  {
    id: "polyglot",
    name: "The Polyglot",
    description: "Repos in 5+ languages",
    category: "Repositories",
    tier: "squad",
    check: (p) => p.achievementStats.languageCount >= 5,
    progress: (p) => ({ current: Math.min(p.achievementStats.languageCount, 5), target: 5 }),
  },
  {
    id: "open-source-hero",
    name: "Open Source Hero",
    description: "10+ PRs merged into other people's repos",
    category: "Impact",
    tier: "international",
    check: (p) => p.achievementStats.externalMergedPRs >= 10,
    progress: (p) => ({ current: Math.min(p.achievementStats.externalMergedPRs, 10), target: 10 }),
  },
  {
    id: "bug-catcher",
    name: "Bug Catcher",
    description: "20+ closed issues",
    category: "Impact",
    tier: "squad",
    check: (p) => p.achievementStats.closedIssues >= 20,
    progress: (p) => ({ current: Math.min(p.achievementStats.closedIssues, 20), target: 20 }),
  },
  {
    id: "crowd-favorite",
    name: "Crowd Favorite",
    description: "30+ followers",
    category: "Impact",
    tier: "squad",
    check: (p) => p.achievementStats.followers >= 30,
    progress: (p) => ({ current: Math.min(p.achievementStats.followers, 30), target: 30 }),
  },
  {
    id: "engine-room",
    name: "Engine Room",
    description: "A 7+ day commit streak",
    category: "Career",
    tier: "squad",
    check: (p) => p.achievementStats.longestStreakDays >= 7,
    progress: (p) => ({ current: Math.min(p.achievementStats.longestStreakDays, 7), target: 7 }),
  },
  {
    id: "system-architect",
    name: "System Architect",
    description: "15+ public repos",
    category: "Career",
    tier: "squad",
    check: (p) => p.achievementStats.publicRepos >= 15,
    progress: (p) => ({ current: Math.min(p.achievementStats.publicRepos, 15), target: 15 }),
  },
  {
    id: "veteran",
    name: "The Veteran",
    description: "Account is 3+ years old",
    category: "Career",
    tier: "squad",
    check: (p) => p.achievementStats.accountAgeYears >= 3,
    progress: (p) => ({ current: Math.min(p.achievementStats.accountAgeYears, 3), target: 3 }),
    dateHint: (p) =>
      p.achievementStats.accountAgeYears >= 3 ? `${p.joinedYear + 3}` : null,
  },
  {
    id: "world-cup-player",
    name: "World Cup Player",
    description: "A merged PR in a repo with 10,000+ stars",
    category: "Impact",
    tier: "ballon-dor",
    check: (p) => p.achievementStats.maxExternalPRRepoStars >= 10_000,
  },
  {
    id: "golden-boot-season",
    name: "Golden Boot",
    description: "2,000+ commits in a single calendar year",
    category: "Career",
    tier: "ballon-dor",
    check: (p) => p.achievementStats.maxCommitsInYear >= 2000,
    progress: (p) => ({ current: Math.min(p.achievementStats.maxCommitsInYear, 2000), target: 2000 }),
    dateHint: (p) =>
      p.achievementStats.maxCommitsInYear >= 2000 ? `${p.achievementStats.maxCommitsYear}` : null,
  },
  {
    id: "acute-burnout",
    name: "Acute Burnout",
    description: "30+ days without activity in the last year",
    category: "Medical Record",
    tier: "squad",
    check: (p) => p.achievementStats.maxInactivityGapDays >= 30,
    progress: (p) => ({ current: Math.min(p.achievementStats.maxInactivityGapDays, 30), target: 30 }),
  },
  {
    id: "risky-deploy",
    name: "Risky Deploy",
    description: "A commit made on a Friday after 6pm",
    category: "Dev Culture",
    tier: "squad",
    // TODO: needs commit-level data (per-commit author timestamp) — see
    // lib/player.ts buildAchievementStats for why it's disabled for now.
    check: (p) => p.achievementStats.hasFridayEveningCommit,
  },
  {
    id: "loan-spell",
    name: "Loan Spell",
    description: "A full calendar year with no contributions, with activity afterward",
    category: "Medical Record",
    tier: "squad",
    check: (p) => p.achievementStats.hadLoanSpell,
  },
];

export interface AchievementResult {
  achievement: Achievement;
  unlocked: boolean;
  progress: AchievementProgress | null;
  dateHint: string | null;
}

export function evaluateAchievements(player: PlayerProfile): AchievementResult[] {
  return ACHIEVEMENTS.map((achievement) => {
    const unlocked = achievement.check(player);
    return {
      achievement,
      unlocked,
      progress: achievement.progress ? achievement.progress(player) : null,
      dateHint: unlocked && achievement.dateHint ? achievement.dateHint(player) : null,
    };
  });
}
