// "Scout report" de una línea, al estilo GitFut: una frase generada por
// reglas a partir de las estadísticas del jugador. El orden importa: se
// evalúan de arriba a abajo y gana la primera regla que matchea.

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
    phrase: "En estado de gracia: encadena titularidades sin parar.",
  },
  {
    condition: (i) => i.commitsLastYear > 1000,
    phrase: "Motor del mediocampo: no se pierde un entrenamiento.",
  },
  {
    condition: (i) => i.starsTotal > 50 && i.followersTotal < 30,
    phrase: "Joya de club chico: rinde más de lo que marca su cotización.",
  },
  {
    condition: (i) => i.accountAgeYears < 1,
    phrase: "Promesa de las inferiores: recién debuta pero ya promete.",
  },
  {
    condition: (i) => i.reposOver10Stars >= 3,
    phrase: "Figura mediática: sus proyectos llenan el estadio.",
  },
  {
    condition: (i) => i.languageCount >= 6,
    phrase: "Todoterreno táctico: juega en cualquier posición que le pidan.",
  },
  {
    condition: (i) => i.followersTotal > 500,
    phrase: "Ídolo de la tribuna: la hinchada lo sigue a todos lados.",
  },
  {
    condition: (i) => i.longestStreakDays < 7 && i.commitsLastYear < 50,
    phrase: "Jugador de rotación: entra desde el banco cuando hace falta.",
  },
];

const FALLBACK_PHRASE = "Profesional silencioso: cumple partido a partido.";

export function buildScoutReport(input: ScoutReportInput): string {
  const rule = RULES.find((r) => r.condition(input));
  return rule?.phrase ?? FALLBACK_PHRASE;
}
