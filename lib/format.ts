// Formato de moneda estilo Transfermarkt en es-AR: "475 mil €" / "2,40 mill. €"

const NUMBER_FORMAT = new Intl.NumberFormat("es-AR");
const DATE_FORMAT = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function roundMarketValue(value: number): number {
  const step = value < 1_000_000 ? 25_000 : 100_000;
  return Math.round(value / step) * step;
}

export function formatMarketValue(rawValue: number): string {
  const rounded = roundMarketValue(Math.max(0, rawValue));

  if (rounded < 1_000_000) {
    return `${rounded / 1000} mil €`;
  }

  const millions = rounded / 1_000_000;
  return `${millions.toFixed(2).replace(".", ",")} mill. €`;
}

// Formato compacto de un solo renglón para ejes de gráfico: "700K €", "1,4M €".
export function formatCompactValue(value: number): string {
  if (value < 1_000_000) {
    return `${Math.round(value / 1000)}K €`;
  }
  return `${(value / 1_000_000).toFixed(1).replace(".", ",")}M €`;
}

export function formatNumber(value: number): string {
  return NUMBER_FORMAT.format(value);
}

export function formatDate(isoDate: string): string {
  return DATE_FORMAT.format(new Date(isoDate));
}

export function formatDateTime(isoDate: string): string {
  return DATE_TIME_FORMAT.format(new Date(isoDate));
}

export interface MarketValueTrend {
  direction: "up" | "down" | "flat";
  pct: number;
}

// Compara los últimos dos puntos de la evolución de valor para saber si mostrar
// la flecha verde (o roja) de tendencia junto al valor de mercado.
export function computeMarketValueTrend(
  history: Array<{ value: number }>
): MarketValueTrend | null {
  if (history.length < 2) return null;
  const prev = history[history.length - 2].value;
  const current = history[history.length - 1].value;
  if (prev <= 0) return null;
  const pct = ((current - prev) / prev) * 100;
  return { direction: pct > 0.5 ? "up" : pct < -0.5 ? "down" : "flat", pct };
}

export function calculateAgeYears(fromIso: string, toDate: Date = new Date()): number {
  const from = new Date(fromIso);
  let age = toDate.getFullYear() - from.getFullYear();
  const monthDiff = toDate.getMonth() - from.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && toDate.getDate() < from.getDate())) {
    age--;
  }
  return age;
}
