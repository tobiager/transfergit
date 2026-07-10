import { test } from "node:test";
import assert from "node:assert/strict";
import { ACHIEVEMENTS, evaluateAchievements } from "./achievements.ts";
import type { AchievementStats, Player } from "./types.ts";

const BASE_STATS: AchievementStats = {
  maxRepoStars: 0,
  totalForks: 0,
  languageCount: 0,
  externalMergedPRs: 0,
  maxExternalPRRepoStars: 0,
  closedIssues: 0,
  followers: 0,
  longestStreakDays: 0,
  publicRepos: 0,
  accountAgeYears: 0,
  maxCommitsInYear: 0,
  maxCommitsYear: 2024,
  maxInactivityGapDays: 0,
  hadLoanSpell: false,
  hasFridayEveningCommit: false,
};

function makePlayer(stats: Partial<AchievementStats>): Player {
  return {
    login: "octocat",
    name: "Octocat",
    avatarUrl: "",
    bio: null,
    currentClub: "Free Agent",
    currentClubAvatar: null,
    joinedDate: "01/01/2020",
    joinedYear: 2020,
    birthDate: "01/01/2020",
    age: 4,
    birthPlace: "Localhost",
    nationalityName: "Unknown",
    nationalityIso2: null,
    agent: "Family",
    provider: "TypeScript",
    position: { main: "Central Midfielder", secondary: "Right Winger", foot: "Right" },
    scoutReport: "",
    ratings: [],
    marketValueUpdatedAt: "",
    trophies: { stars: 0, forks: 0, repos: 0, followers: 0 },
    achievementStats: { ...BASE_STATS, ...stats },
    marketValue: 0,
    marketValueFormatted: "€0",
    marketValueHistory: [],
    recordValue: { value: 0, formatted: "€0", year: 2020 },
    seasons: [],
    transfers: [],
    injuries: [],
  };
}

function checkOf(id: string) {
  const achievement = ACHIEVEMENTS.find((a) => a.id === id);
  assert.ok(achievement, `achievement ${id} should exist`);
  return achievement.check;
}

test("has exactly 14 achievements with unique ids", () => {
  assert.strictEqual(ACHIEVEMENTS.length, 14);
  assert.strictEqual(new Set(ACHIEVEMENTS.map((a) => a.id)).size, 14);
});

test("golden-boot-repo: unlocked at 50+ stars on a single repo", () => {
  const check = checkOf("golden-boot-repo");
  assert.strictEqual(check(makePlayer({ maxRepoStars: 49 })), false);
  assert.strictEqual(check(makePlayer({ maxRepoStars: 50 })), true);
});

test("playmaker: unlocked at 30+ total forks", () => {
  const check = checkOf("playmaker");
  assert.strictEqual(check(makePlayer({ totalForks: 29 })), false);
  assert.strictEqual(check(makePlayer({ totalForks: 30 })), true);
});

test("polyglot: unlocked at 5+ distinct languages", () => {
  const check = checkOf("polyglot");
  assert.strictEqual(check(makePlayer({ languageCount: 4 })), false);
  assert.strictEqual(check(makePlayer({ languageCount: 5 })), true);
});

test("open-source-hero: unlocked at 10+ merged external PRs", () => {
  const check = checkOf("open-source-hero");
  assert.strictEqual(check(makePlayer({ externalMergedPRs: 9 })), false);
  assert.strictEqual(check(makePlayer({ externalMergedPRs: 10 })), true);
});

test("bug-catcher: unlocked at 20+ closed issues", () => {
  const check = checkOf("bug-catcher");
  assert.strictEqual(check(makePlayer({ closedIssues: 19 })), false);
  assert.strictEqual(check(makePlayer({ closedIssues: 20 })), true);
});

test("crowd-favorite: unlocked at 30+ followers", () => {
  const check = checkOf("crowd-favorite");
  assert.strictEqual(check(makePlayer({ followers: 29 })), false);
  assert.strictEqual(check(makePlayer({ followers: 30 })), true);
});

test("engine-room: unlocked at a 7+ day commit streak", () => {
  const check = checkOf("engine-room");
  assert.strictEqual(check(makePlayer({ longestStreakDays: 6 })), false);
  assert.strictEqual(check(makePlayer({ longestStreakDays: 7 })), true);
});

test("system-architect: unlocked at 15+ public repos", () => {
  const check = checkOf("system-architect");
  assert.strictEqual(check(makePlayer({ publicRepos: 14 })), false);
  assert.strictEqual(check(makePlayer({ publicRepos: 15 })), true);
});

test("veteran: unlocked at 3+ account years", () => {
  const check = checkOf("veteran");
  assert.strictEqual(check(makePlayer({ accountAgeYears: 2 })), false);
  assert.strictEqual(check(makePlayer({ accountAgeYears: 3 })), true);
});

test("world-cup-player: unlocked with a merged PR in a 10k+ star repo", () => {
  const check = checkOf("world-cup-player");
  assert.strictEqual(check(makePlayer({ maxExternalPRRepoStars: 9_999 })), false);
  assert.strictEqual(check(makePlayer({ maxExternalPRRepoStars: 10_000 })), true);
});

test("golden-boot-season: unlocked at 2000+ commits in a calendar year", () => {
  const check = checkOf("golden-boot-season");
  assert.strictEqual(check(makePlayer({ maxCommitsInYear: 1999 })), false);
  assert.strictEqual(check(makePlayer({ maxCommitsInYear: 2000 })), true);
});

test("acute-burnout: unlocked at a 30+ day inactivity gap", () => {
  const check = checkOf("acute-burnout");
  assert.strictEqual(check(makePlayer({ maxInactivityGapDays: 29 })), false);
  assert.strictEqual(check(makePlayer({ maxInactivityGapDays: 30 })), true);
});

test("risky-deploy: disabled pending commit-level data", () => {
  const check = checkOf("risky-deploy");
  assert.strictEqual(check(makePlayer({ hasFridayEveningCommit: false })), false);
  assert.strictEqual(check(makePlayer({ hasFridayEveningCommit: true })), true);
});

test("loan-spell: unlocked when a full inactive year is followed by activity", () => {
  const check = checkOf("loan-spell");
  assert.strictEqual(check(makePlayer({ hadLoanSpell: false })), false);
  assert.strictEqual(check(makePlayer({ hadLoanSpell: true })), true);
});

test("evaluateAchievements: reports progress and unlocked state consistently", () => {
  const player = makePlayer({ totalForks: 12, publicRepos: 20 });
  const results = evaluateAchievements(player);
  const playmaker = results.find((r) => r.achievement.id === "playmaker");
  const systemArchitect = results.find((r) => r.achievement.id === "system-architect");

  assert.deepStrictEqual(playmaker?.progress, { current: 12, target: 30 });
  assert.strictEqual(playmaker?.unlocked, false);
  assert.strictEqual(systemArchitect?.unlocked, true);
});
