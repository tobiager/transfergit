import type { Player } from "./types";
import achievementRarity from "./achievementRarity.json" with { type: "json" };

// Achievements are evaluated against the fully-built player (including the
// derived achievementStats), matching GitFut/Transfermarkt's "trophy
// cabinet" concept.
export type PlayerProfile = Player;

export type Tier = "squad" | "international" | "ballon-dor";

export interface AchievementProgress {
  current: number;
  target: number;
}

// One instance of a repeatable achievement (Golden Boot, Acute Burnout,
// Loan Spell, World Cup Player) — each year/gap/repo that satisfies the rule
// on its own, not just the first time it was ever true.
export interface AchievementOccurrence {
  year: number;
  detail?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: "Repositories" | "Impact" | "Career" | "Medical Record" | "Dev Culture";
  tier: Tier;
  check: (p: PlayerProfile) => boolean;
  progress?: (p: PlayerProfile) => AchievementProgress;
  // Short label for the modal's progress row, e.g. "Forks" -> "Forks: 12/30".
  // Only meaningful alongside `progress`.
  progressLabel?: string;
  // Best-effort estimate of when the achievement was unlocked. Omitted when
  // there's no reliable single date to attach to the rule.
  dateHint?: (p: PlayerProfile) => string | null;
  // Only set for repeatable achievements — every other achievement is
  // binary (unlocked once or not at all).
  occurrences?: (p: PlayerProfile) => AchievementOccurrence[];
}

// Injury.from is formatted "DD/MM/YYYY" (lib/format.ts formatDate).
function yearFromFormattedDate(ddmmyyyy: string): number {
  return Number(ddmmyyyy.split("/")[2]);
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
    progressLabel: "Forks",
  },
  {
    id: "polyglot",
    name: "The Polyglot",
    description: "Repos in 5+ languages",
    category: "Repositories",
    tier: "squad",
    check: (p) => p.achievementStats.languageCount >= 5,
    progress: (p) => ({ current: Math.min(p.achievementStats.languageCount, 5), target: 5 }),
    progressLabel: "Languages",
  },
  {
    id: "open-source-hero",
    name: "Open Source Hero",
    description: "10+ PRs merged into other people's repos",
    category: "Impact",
    tier: "international",
    check: (p) => p.achievementStats.externalMergedPRs >= 10,
    progress: (p) => ({ current: Math.min(p.achievementStats.externalMergedPRs, 10), target: 10 }),
    progressLabel: "Merged PRs",
  },
  {
    id: "bug-catcher",
    name: "Bug Catcher",
    description: "20+ closed issues",
    category: "Impact",
    tier: "squad",
    check: (p) => p.achievementStats.closedIssues >= 20,
    progress: (p) => ({ current: Math.min(p.achievementStats.closedIssues, 20), target: 20 }),
    progressLabel: "Closed issues",
  },
  {
    id: "crowd-favorite",
    name: "Crowd Favorite",
    description: "30+ followers",
    category: "Impact",
    tier: "squad",
    check: (p) => p.achievementStats.followers >= 30,
    progress: (p) => ({ current: Math.min(p.achievementStats.followers, 30), target: 30 }),
    progressLabel: "Followers",
  },
  {
    id: "engine-room",
    name: "Engine Room",
    description: "A 7+ day commit streak",
    category: "Career",
    tier: "squad",
    check: (p) => p.achievementStats.longestStreakDays >= 7,
    progress: (p) => ({ current: Math.min(p.achievementStats.longestStreakDays, 7), target: 7 }),
    progressLabel: "Streak days",
  },
  {
    id: "system-architect",
    name: "System Architect",
    description: "15+ public repos",
    category: "Career",
    tier: "squad",
    check: (p) => p.achievementStats.publicRepos >= 15,
    progress: (p) => ({ current: Math.min(p.achievementStats.publicRepos, 15), target: 15 }),
    progressLabel: "Public repos",
  },
  {
    id: "veteran",
    name: "The Veteran",
    description: "Account is 3+ years old",
    category: "Career",
    tier: "squad",
    check: (p) => p.achievementStats.accountAgeYears >= 3,
    progress: (p) => ({ current: Math.min(p.achievementStats.accountAgeYears, 3), target: 3 }),
    progressLabel: "Account years",
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
    occurrences: (p) => p.worldCupRepos.map((repo) => ({ year: repo.year, detail: repo.name })),
  },
  {
    id: "golden-boot-season",
    name: "Golden Boot",
    description: "2,000+ commits in a single calendar year",
    category: "Career",
    tier: "ballon-dor",
    check: (p) => p.achievementStats.maxCommitsInYear >= 2000,
    progress: (p) => ({ current: Math.min(p.achievementStats.maxCommitsInYear, 2000), target: 2000 }),
    progressLabel: "Commits",
    dateHint: (p) =>
      p.achievementStats.maxCommitsInYear >= 2000 ? `${p.achievementStats.maxCommitsYear}` : null,
    occurrences: (p) =>
      p.seasons
        .filter((s) => s.commits >= 2000)
        .map((s) => ({ year: s.year }))
        .sort((a, b) => a.year - b.year),
  },
  {
    id: "acute-burnout",
    name: "Acute Burnout",
    description: "30+ days without activity in the last year",
    category: "Medical Record",
    tier: "squad",
    check: (p) => p.achievementStats.maxInactivityGapDays >= 30,
    progress: (p) => ({ current: Math.min(p.achievementStats.maxInactivityGapDays, 30), target: 30 }),
    progressLabel: "Days inactive",
    occurrences: (p) =>
      p.injuries
        .filter((i) => i.daysOut >= 30)
        .map((i) => ({ year: yearFromFormattedDate(i.from) }))
        .sort((a, b) => a.year - b.year),
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
    occurrences: (p) => {
      const currentYear = new Date().getFullYear();
      const years = [...p.seasons].sort((a, b) => a.year - b.year);
      const spells: AchievementOccurrence[] = [];
      years.forEach((season, i) => {
        if (season.year >= currentYear || season.hasData) return;
        const hasLaterActivity = years.slice(i + 1).some((s) => s.hasData);
        if (hasLaterActivity) spells.push({ year: season.year });
      });
      return spells;
    },
  },
];

export interface AchievementResult {
  achievement: Achievement;
  unlocked: boolean;
  progress: AchievementProgress | null;
  dateHint: string | null;
  occurrences: AchievementOccurrence[];
}

export function evaluateAchievements(player: PlayerProfile): AchievementResult[] {
  return ACHIEVEMENTS.map((achievement) => {
    const unlocked = achievement.check(player);
    return {
      achievement,
      unlocked,
      progress: achievement.progress ? achievement.progress(player) : null,
      dateHint: unlocked && achievement.dateHint ? achievement.dateHint(player) : null,
      occurrences: unlocked && achievement.occurrences ? achievement.occurrences(player) : [],
    };
  });
}

const TIER_PRIORITY: Record<Tier, number> = { "ballon-dor": 0, international: 1, squad: 2 };
const RARITY: Record<string, number> = achievementRarity;

// Overview cabinet's top N: rarest/most prestigious trophies first —
// ballon-dor > international > squad, tied broken by rarity across the
// legends dataset (fewer legends with it = shown first).
export function topTrophies(results: AchievementResult[], limit: number): AchievementResult[] {
  return results
    .filter((r) => r.unlocked)
    .sort((a, b) => {
      const tierDiff = TIER_PRIORITY[a.achievement.tier] - TIER_PRIORITY[b.achievement.tier];
      if (tierDiff !== 0) return tierDiff;
      const rarityA = RARITY[a.achievement.id] ?? 100;
      const rarityB = RARITY[b.achievement.id] ?? 100;
      return rarityA - rarityB;
    })
    .slice(0, limit);
}

// Total honours for the "N HONOURS" header count — repeatable achievements
// count every occurrence, not just "unlocked once".
export function countHonours(results: AchievementResult[]): number {
  return results.reduce((sum, r) => {
    if (!r.unlocked) return sum;
    return sum + (r.occurrences.length > 0 ? r.occurrences.length : 1);
  }, 0);
}
