// One-line "scout report" in the GitFut style: a rule-generated sentence
// from the player's stats. Order matters: rules are evaluated top to bottom
// and the first match wins.

export interface ScoutReportInput {
  commitsLastYear: number;
  starsTotal: number;
  followersTotal: number;
  currentStreakDays: number;
  accountAgeYears: number;
  languageCount: number;
  reposOver10Stars: number;
  longestStreakDays: number;
}

interface ScoutRule {
  condition: (input: ScoutReportInput) => boolean;
  phrase: string;
}

const RULES: ScoutRule[] = [
  {
    condition: (i) => i.currentStreakDays >= 30,
    phrase: "In red-hot form: strings together starts without stopping.",
  },
  {
    condition: (i) => i.commitsLastYear > 1000,
    phrase: "Engine of the midfield: never misses a training session.",
  },
  {
    condition: (i) => i.starsTotal > 50 && i.followersTotal < 30,
    phrase: "Small-club gem: outperforms his price tag.",
  },
  {
    condition: (i) => i.accountAgeYears < 1,
    phrase: "Academy prospect: just debuted but already shows promise.",
  },
  {
    condition: (i) => i.reposOver10Stars >= 3,
    phrase: "Media darling: his projects fill the stadium.",
  },
  {
    condition: (i) => i.languageCount >= 6,
    phrase: "Tactical utility player: plays anywhere he's asked.",
  },
  {
    condition: (i) => i.followersTotal > 500,
    phrase: "Fan favorite: the crowd follows him everywhere.",
  },
  {
    condition: (i) => i.longestStreakDays < 7 && i.commitsLastYear < 50,
    phrase: "Squad rotation player: comes off the bench when needed.",
  },
];

const FALLBACK_PHRASE = "Quiet professional: delivers match after match.";

export function buildScoutReport(input: ScoutReportInput): string {
  const rule = RULES.find((r) => r.condition(input));
  return rule?.phrase ?? FALLBACK_PHRASE;
}
