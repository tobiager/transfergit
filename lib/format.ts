// Transfermarkt-style currency formatting in English: "€850k" / "€2.50m" / "€1.20bn"

const NUMBER_FORMAT = new Intl.NumberFormat("en-US");
const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function roundMarketValue(value: number): number {
  const step = value < 1_000_000 ? 25_000 : value < 1_000_000_000 ? 100_000 : 10_000_000;
  return Math.round(value / step) * step;
}

export function formatMarketValue(rawValue: number): string {
  const rounded = roundMarketValue(Math.max(0, rawValue));

  if (rounded < 1_000_000) {
    return `€${rounded / 1000}k`;
  }

  if (rounded < 1_000_000_000) {
    return `€${(rounded / 1_000_000).toFixed(2)}m`;
  }

  return `€${(rounded / 1_000_000_000).toFixed(2)}bn`;
}

// Single-line compact format for chart axes: "€700k", "€1.4m", "€1.5bn".
export function formatCompactValue(value: number): string {
  if (value < 1_000_000) {
    return `€${Math.round(value / 1000)}k`;
  }
  if (value < 1_000_000_000) {
    return `€${(value / 1_000_000).toFixed(1)}m`;
  }
  return `€${(value / 1_000_000_000).toFixed(1)}bn`;
}

export function formatNumber(value: number): string {
  return NUMBER_FORMAT.format(value);
}

// Compact form for tight spaces (stat circles): "850", "12K", "3.4M".
export function formatCompactNumber(value: number): string {
  if (value < 1000) return String(value);
  if (value < 1_000_000) return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0)}K`;
  return `${(value / 1_000_000).toFixed(1)}M`;
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

// Compares the last two points of the value evolution to decide whether to
// show the green (or red) trend arrow next to the market value.
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

// Deterministic 5-digit "FILE N°" shown next to the handle — stable per
// login (same profile always gets the same number), not a real record id.
export function seededFileNumber(login: string): string {
  let hash = 0;
  for (let i = 0; i < login.length; i++) {
    hash = (hash * 31 + login.charCodeAt(i)) >>> 0;
  }
  return String(hash % 100_000).padStart(5, "0");
}

export function pluralize(count: number, singular: string, plural: string = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
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
