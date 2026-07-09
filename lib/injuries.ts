import type { ContributionDay, Injury } from "./types";
import { formatDate } from "./format";

const MIN_GAP_DAYS = 14;

const INJURY_NAMES = [
  "Burnout agudo",
  "Rotura del ligamento del deploy",
  "Sobrecarga de reuniones",
  "Lesión por rebase",
  "Fatiga de code review",
];

// Detecta gaps de 14+ días consecutivos sin ninguna contribución en el
// último año, y los presenta como "lesiones" del jugador.
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

export interface StreakInfo {
  longest: number;
  current: number;
}

// Racha más larga de días consecutivos con al menos una contribución en el
// último año, y la racha vigente (contando hacia atrás desde el día más
// reciente con datos).
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
