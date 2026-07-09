import type { GithubRepo, PlayerPosition } from "./types";

// Language → tactical category mapping. Everything weighted by repo stars.
type Category = "frontend" | "backend" | "devops" | "dataml" | "mobile";

const CATEGORY_LABEL: Record<Category, string> = {
  frontend: "Right Winger",
  backend: "Central Midfielder",
  devops: "Goalkeeper",
  dataml: "Defensive Midfielder",
  mobile: "Full-Back",
};

const FULLSTACK_LABEL = "Attacking Midfielder";

const FRONTEND_LANGS = new Set([
  "JavaScript",
  "TypeScript",
  "HTML",
  "CSS",
  "Vue",
  "Svelte",
]);

const BACKEND_LANGS = new Set([
  "Java",
  "Go",
  "Python",
  "C#",
  "PHP",
  "Rust",
  "Ruby",
  "C",
  "C++",
  "Elixir",
]);

const DEVOPS_LANGS = new Set(["Shell", "Dockerfile", "HCL", "YAML", "Makefile"]);

const MOBILE_LANGS = new Set(["Swift", "Kotlin", "Dart", "Objective-C"]);

const DATAML_LANGS = new Set(["Jupyter Notebook", "R"]);

// Markup/notebook languages: count toward the tactical category (e.g. HTML
// adds to "frontend"), but should never win as the "main language"
// (Preferred stack / preferred foot) because they don't reflect a real
// stack decision.
const EXCLUDED_FROM_TOP_LANGUAGE = new Set(["HTML", "CSS", "SCSS", "Jupyter Notebook"]);

// "Typed" languages → right foot (joke: compiler rigor = dominant foot).
// Dynamic languages → left foot. It's a joke, not a serious technical claim.
const TYPED_LANGS = new Set([
  "TypeScript",
  "Java",
  "C#",
  "Go",
  "Rust",
  "Kotlin",
  "Swift",
  "C",
  "C++",
]);

function categorize(language: string): Category | null {
  if (DATAML_LANGS.has(language)) return "dataml";
  if (DEVOPS_LANGS.has(language)) return "devops";
  if (MOBILE_LANGS.has(language)) return "mobile";
  if (FRONTEND_LANGS.has(language)) return "frontend";
  if (BACKEND_LANGS.has(language)) return "backend";
  return null;
}

export interface LanguageWeight {
  language: string;
  weight: number;
}

export interface PositionResult {
  position: PlayerPosition;
  topLanguage: string;
}

export function computePosition(repos: GithubRepo[]): PositionResult {
  const languageWeights = new Map<string, number>();
  const categoryWeights: Record<Category, number> = {
    frontend: 0,
    backend: 0,
    devops: 0,
    dataml: 0,
    mobile: 0,
  };

  for (const repo of repos) {
    if (!repo.language) continue;
    // +1 so repos without stars also count toward the language distribution.
    const weight = repo.stars + 1;

    languageWeights.set(repo.language, (languageWeights.get(repo.language) ?? 0) + weight);

    const category = categorize(repo.language);
    if (category) categoryWeights[category] += weight;
  }

  const totalWeight = Object.values(categoryWeights).reduce((a, b) => a + b, 0);

  const sortedCategories = (Object.entries(categoryWeights) as [Category, number][])
    .filter(([, w]) => w > 0)
    .sort((a, b) => b[1] - a[1]);

  const sortedLanguages = [...languageWeights.entries()]
    .filter(([lang]) => !EXCLUDED_FROM_TOP_LANGUAGE.has(lang))
    .sort((a, b) => b[1] - a[1]);
  const topLanguage = sortedLanguages[0]?.[0] ?? "TypeScript";

  let main: string;
  let secondary: string;

  if (sortedCategories.length === 0) {
    main = CATEGORY_LABEL.frontend;
    secondary = FULLSTACK_LABEL;
  } else {
    const [topCategory, topWeight] = sortedCategories[0];
    const second = sortedCategories[1];

    // Fullstack: frontend and backend are the two dominant categories and
    // are close (neither takes more than 65% of the total weight).
    const isFrontendBackendMix =
      (topCategory === "frontend" || topCategory === "backend") &&
      second &&
      (second[0] === "frontend" || second[0] === "backend") &&
      topWeight / totalWeight < 0.65;

    if (isFrontendBackendMix) {
      main = FULLSTACK_LABEL;
      secondary = CATEGORY_LABEL[topCategory];
    } else {
      main = CATEGORY_LABEL[topCategory];
      secondary = second ? CATEGORY_LABEL[second[0]] : FULLSTACK_LABEL;
    }
  }

  const foot = TYPED_LANGS.has(topLanguage) ? "Right" : "Left";

  return { position: { main, secondary, foot }, topLanguage };
}

// Count of distinct "real" languages used (excludes markup/notebook), used
// for the "Dribbling" metric and the scout report.
export function countDistinctLanguages(repos: GithubRepo[]): number {
  const languages = new Set(
    repos
      .map((r) => r.language)
      .filter((lang): lang is string => !!lang && !EXCLUDED_FROM_TOP_LANGUAGE.has(lang))
  );
  return languages.size;
}

// Dominant language (by stars) among repos created in a given year. Used to
// reconstruct "dominant language changes" season by season in the transfer
// history.
export function dominantLanguageForRepos(repos: GithubRepo[]): string | null {
  const weights = new Map<string, number>();
  for (const repo of repos) {
    if (!repo.language || EXCLUDED_FROM_TOP_LANGUAGE.has(repo.language)) continue;
    weights.set(repo.language, (weights.get(repo.language) ?? 0) + repo.stars + 1);
  }
  const sorted = [...weights.entries()].sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? null;
}
