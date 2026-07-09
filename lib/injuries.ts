import type { ContributionDay, Injury } from "./types";
import { formatDate } from "./format";

const MIN_GAP_DAYS = 14;

const INJURY_NAMES = [
  "Acute burnout",
  "Torn deploy ligament",
  "Meeting overload",
  "Rebase injury",
  "Code review fatigue",
];

// Detects gaps of 14+ consecutive days with no contributions in the last
// year, and presents them as the player's "injuries".
export function detectInjuries(calendar: ContributionDay[]): Injury[] {
  const days = [...calendar].sort((a, b) => a.date.localeCompare(b.date));

  const injuries: Injury[] = [];
  let gapStart: string | null = null;
  let gapLength = 0;

  const closeGap = (endExclusiveIndex: number) => {
    if (gapStart === null || gapLength < MIN_GAP_DAYS) return;
    const endDate = days[endExclusiveIndex - 1].date;
    const name = INJURY_NAMES[injuries.length % INJURY_NAMES.length];
    injuries.push({
      name,
      from: formatDate(gapStart),
      to: formatDate(endDate),
      daysOut: gapLength,
      matchesMissed: Math.round(gapLength / 7),
    });
  };

  days.forEach((day, index) => {
    if (day.count === 0) {
      if (gapStart === null) gapStart = day.date;
      gapLength++;
    } else {
      closeGap(index);
      gapStart = null;
      gapLength = 0;
    }
  });
  closeGap(days.length);

  return injuries;
}

// Longest run of consecutive zero-contribution days in the window, with no
// minimum threshold (unlike detectInjuries' 14-day cutoff). Used by the
// Acute Burnout achievement (30+ day gap).
export function computeMaxGapDays(calendar: ContributionDay[]): number {
  const days = [...calendar].sort((a, b) => a.date.localeCompare(b.date));

  let longest = 0;
  let running = 0;
  for (const day of days) {
    if (day.count === 0) {
      running++;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
  }
  return longest;
}

export interface StreakInfo {
  longest: number;
  current: number;
}

// Longest streak of consecutive days with at least one contribution in the
// last year, and the current streak (counting back from the most recent
// day with data).
export function computeStreaks(calendar: ContributionDay[]): StreakInfo {
  const days = [...calendar].sort((a, b) => a.date.localeCompare(b.date));

  let longest = 0;
  let running = 0;
  for (const day of days) {
    if (day.count > 0) {
      running++;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
  }

  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) current++;
    else break;
  }

  return { longest, current };
}
