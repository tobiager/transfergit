import type { RatingMetric } from "./types";
import { formatNumber } from "./format";

// Umbrales que representan "99/99" para cada métrica. Son arbitrarios pero
// generosos: están pensados para que un perfil muy activo llegue cerca del
// techo sin saturarlo todo en 99. Fácil de ajustar acá.
const THRESHOLDS = {
  pace: 1_500, // commits en los últimos 12 meses
  finishing: 200, // stars totales
  passing: 150, // pull requests totales
  vision: 100, // code reviews totales
  stamina: 60, // racha más larga de días consecutivos con actividad
  dribbling: 8, // cantidad de lenguajes distintos usados
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
      label: "Ritmo",
      rawLabel: `${formatNumber(input.commitsLast12Months)} commits (12 meses)`,
      score: scoreFor(input.commitsLast12Months, THRESHOLDS.pace),
    },
    {
      key: "finishing",
      label: "Definición",
      rawLabel: `${formatNumber(input.starsTotal)} stars totales`,
      score: scoreFor(input.starsTotal, THRESHOLDS.finishing),
    },
    {
      key: "passing",
      label: "Pase",
      rawLabel: `${formatNumber(input.pullRequestsTotal)} pull requests`,
      score: scoreFor(input.pullRequestsTotal, THRESHOLDS.passing),
    },
    {
      key: "vision",
      label: "Visión",
      rawLabel: `${formatNumber(input.reviewsTotal)} code reviews`,
      score: scoreFor(input.reviewsTotal, THRESHOLDS.vision),
    },
    {
      key: "stamina",
      label: "Resistencia",
      rawLabel: `${formatNumber(input.longestStreakDays)} días de racha`,
      score: scoreFor(input.longestStreakDays, THRESHOLDS.stamina),
    },
    {
      key: "dribbling",
      label: "Regate",
      rawLabel: `${formatNumber(input.languageCount)} lenguajes`,
      score: scoreFor(input.languageCount, THRESHOLDS.dribbling),
    },
  ];
}
