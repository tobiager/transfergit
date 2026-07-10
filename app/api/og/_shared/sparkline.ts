import type { MarketValuePoint } from "@/lib/types";

interface SparklinePaths {
  line: string;
  area: string;
}

export interface ChartPoint {
  x: number;
  y: number;
  year: number;
  value: number;
}

export interface ChartGeometry extends SparklinePaths {
  points: ChartPoint[];
  recordIndex: number;
}

// Recharts doesn't run inside Satori (it doesn't support the real DOM it
// needs), so the value evolution is drawn by hand as a plain SVG path.
export function buildChartGeometry(
  history: MarketValuePoint[],
  width: number,
  height: number,
  padding = 0
): ChartGeometry {
  if (history.length === 0) {
    return { line: "", area: "", points: [], recordIndex: -1 };
  }

  const values = history.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const innerHeight = height - padding * 2;

  const points: ChartPoint[] = history.map((point, i) => {
    const x = (i / Math.max(history.length - 1, 1)) * width;
    const y = padding + innerHeight - ((point.value - min) / range) * innerHeight;
    return { x, y, year: point.year, value: point.value };
  });

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  const first = points[0];
  const last = points[points.length - 1];
  const area = `${line} L${last.x.toFixed(1)},${height} L${first.x.toFixed(1)},${height} Z`;

  const recordIndex = values.indexOf(max);

  return { line, area, points, recordIndex };
}

// Small-sparkline helper (compact/social cards): just the line + area, no
// point markers.
export function buildSparklinePaths(history: MarketValuePoint[], width: number, height: number): SparklinePaths {
  const { line, area } = buildChartGeometry(history, width, height, 0);
  return { line, area };
}

export interface YAxisTick {
  y: number;
  value: number;
}

// Evenly spaced horizontal gridline positions for the full OG card's chart,
// matching the same min/max/padding math as buildChartGeometry so the ticks
// line up with the drawn curve.
export function buildYAxisTicks(
  history: MarketValuePoint[],
  height: number,
  padding = 0,
  tickCount = 4
): YAxisTick[] {
  if (history.length === 0) return [];

  const values = history.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const innerHeight = height - padding * 2;

  return Array.from({ length: tickCount + 1 }, (_, i) => {
    const value = min + (range * i) / tickCount;
    const y = padding + innerHeight - ((value - min) / range) * innerHeight;
    return { y, value };
  });
}
