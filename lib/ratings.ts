import type { RatingMetric } from "./types";
import { formatNumber } from "./format";

// Thresholds representing "99/99" for each metric. Arbitrary but generous:
// meant so a very active profile gets close to the ceiling without
// saturating everything at 99. Easy to tune here.
const THRESHOLDS = {
  pace: 1_500, // commits in the last 12 months
  finishing: 200, // total stars
  passing: 150, // total pull requests
  vision: 100, // total code reviews
  stamina: 60, // longest streak of consecutive active days
  dribbling: 8, // count of distinct languages used
};

const MAX_SCORE = 99;
const MIN_SCORE = 5;

function scoreFor(value: number, threshold: number): number {
  const raw = Math.round((value / threshold) * MAX_SCORE);
  return Math.min(MAX_SCORE, Math.max(MIN_SCORE, raw));
}

export interface RatingsInput {
  commitsLast12Months: number;
  starsTotal: number;
  pullRequestsTotal: number;
  reviewsTotal: number;
  longestStreakDays: number;
  languageCount: number;
}

export function computeRatings(input: RatingsInput): RatingMetric[] {
  return [
    {
      key: "pace",
      label: "Pace",
      rawLabel: `${formatNumber(input.commitsLast12Months)} commits (12 months)`,
      score: scoreFor(input.commitsLast12Months, THRESHOLDS.pace),
    },
    {
      key: "finishing",
      label: "Finishing",
      rawLabel: `${formatNumber(input.starsTotal)} total stars`,
      score: scoreFor(input.starsTotal, THRESHOLDS.finishing),
    },
    {
      key: "passing",
      label: "Passing",
      rawLabel: `${formatNumber(input.pullRequestsTotal)} pull requests`,
      score: scoreFor(input.pullRequestsTotal, THRESHOLDS.passing),
    },
    {
      key: "vision",
      label: "Vision",
      rawLabel: `${formatNumber(input.reviewsTotal)} code reviews`,
      score: scoreFor(input.reviewsTotal, THRESHOLDS.vision),
    },
    {
      key: "stamina",
      label: "Stamina",
      rawLabel: `${formatNumber(input.longestStreakDays)}-day streak`,
      score: scoreFor(input.longestStreakDays, THRESHOLDS.stamina),
    },
    {
      key: "dribbling",
      label: "Dribbling",
      rawLabel: `${formatNumber(input.languageCount)} languages`,
      score: scoreFor(input.languageCount, THRESHOLDS.dribbling),
    },
  ];
}
