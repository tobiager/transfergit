import type { GithubRepo, PlayerPosition } from "./types";

// Mapeo lenguaje → categoría táctica. Todo ponderado por stars de los repos.
type Category = "frontend" | "backend" | "devops" | "dataml" | "mobile";

const CATEGORY_LABEL: Record<Category, string> = {
  frontend: "Extremo derecho",
  backend: "Mediocentro",
  devops: "Arquero",
  dataml: "Pivote",
  mobile: "Lateral",
};

const FULLSTACK_LABEL = "Mediapunta";

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

// Lenguajes de marcado/notebook: cuentan para la categoría táctica (ej. HTML
// suma a "frontend"), pero nunca deberían ganar como "lenguaje principal"
// (Proveedor / pie hábil) porque no reflejan una decisión de stack real.
const EXCLUDED_FROM_TOP_LANGUAGE = new Set(["HTML", "CSS", "SCSS", "Jupyter Notebook"]);

// Lenguajes "tipados" → pie derecho (chiste: rigor del compilador = pierna
// hábil dominante). Lenguajes dinámicos → pie izquierdo. Es un chiste, no una
// afirmación técnica seria.
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
    // +1 para que repos sin stars también cuenten en la distribución de lenguajes.
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

    // Fullstack: frontend y backend son los dos rubros dominantes y están
    // parejos (ninguno se lleva más del 65% del total ponderado).
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

  const foot = TYPED_LANGS.has(topLanguage) ? "Derecho" : "Izquierdo";

  return { position: { main, secondary, foot }, topLanguage };
}

// Cantidad de lenguajes "reales" distintos usados (excluye marcado/notebook),
// usada para la métrica "Regate" y el scout report.
export function countDistinctLanguages(repos: GithubRepo[]): number {
  const languages = new Set(
    repos
      .map((r) => r.language)
      .filter((lang): lang is string => !!lang && !EXCLUDED_FROM_TOP_LANGUAGE.has(lang))
  );
  return languages.size;
}

// Lenguaje dominante (por stars) entre los repos creados en un año puntual.
// Se usa para reconstruir "cambios de lenguaje dominante" temporada a
// temporada en el historial de fichajes.
export function dominantLanguageForRepos(repos: GithubRepo[]): string | null {
  const weights = new Map<string, number>();
  for (const repo of repos) {
    if (!repo.language || EXCLUDED_FROM_TOP_LANGUAGE.has(repo.language)) continue;
    weights.set(repo.language, (weights.get(repo.language) ?? 0) + repo.stars + 1);
  }
  const sorted = [...weights.entries()].sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? null;
}
