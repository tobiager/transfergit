import type { MarketValuePoint } from "@/lib/types";

interface SparklinePaths {
  line: string;
  area: string;
}

// Recharts no corre dentro de Satori (no soporta el DOM real que necesita),
// así que la evolución de valor se dibuja a mano como un path SVG simple.
export function buildSparklinePaths(
  history: MarketValuePoint[],
  width: number,
  height: number
): SparklinePaths {
  if (history.length === 0) {
    return { line: "", area: "" };
  }

  const values = history.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = history.map((point, i) => {
    const x = (i / Math.max(history.length - 1, 1)) * width;
    const y = height - ((point.value - min) / range) * height;
    return [x, y] as const;
  });

  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  const [firstX] = points[0];
  const [lastX] = points[points.length - 1];
  const area = `${line} L${lastX.toFixed(1)},${height} L${firstX.toFixed(1)},${height} Z`;

  return { line, area };
}
