"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Dot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MarketValuePoint } from "@/lib/types";
import { formatCompactValue, formatMarketValue } from "@/lib/format";

interface ChartPoint {
  year: number;
  value: number;
  change: number | null;
}

function buildChartData(history: MarketValuePoint[]): ChartPoint[] {
  return history.map((point, i) => {
    const prev = history[i - 1];
    const change = prev && prev.value > 0 ? ((point.value - prev.value) / prev.value) * 100 : null;
    return { year: point.year, value: Math.round(point.value), change };
  });
}

function RecordDot(props: { cx?: number; cy?: number; payload?: ChartPoint; recordYear: number }) {
  const { cx, cy, payload, recordYear } = props;
  if (cx == null || cy == null || !payload) return null;

  if (payload.year !== recordYear) {
    return <Dot cx={cx} cy={cy} r={3} fill="#3ea6ff" stroke="none" />;
  }

  return (
    <g>
      <circle
        className="record-pulse-ring"
        cx={cx}
        cy={cy}
        r={8}
        fill="none"
        stroke="#ffc400"
        strokeWidth={2}
      />
      <circle cx={cx} cy={cy} r={3.5} fill="#ffc400" />
      <text x={cx} y={cy - 14} textAnchor="middle" fontSize={11} fontWeight={700} fill="#ffc400">
        Récord
      </text>
    </g>
  );
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  const changeLabel =
    point.change === null
      ? ""
      : ` · ${point.change >= 0 ? "+" : ""}${point.change.toFixed(0)}% interanual`;

  return (
    <div className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm shadow-lg">
      <span className="font-semibold">{point.year}</span> ·{" "}
      <span className="text-tm-blue-bright">{formatMarketValue(point.value)}</span>
      <span className="text-muted">{changeLabel}</span>
    </div>
  );
}

export function MarketValueChart({
  history,
  recordYear,
}: {
  history: MarketValuePoint[];
  recordYear: number;
}) {
  const data = buildChartData(history);
  // Arranca sin animar (coincide con el SSR) y se activa tras montar si el
  // usuario no pidió prefers-reduced-motion, evitando un mismatch de hidratación.
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza con matchMedia, sin efecto adverso: solo activa la animación tras montar.
      setAnimate(true);
    }
  }, []);

  return (
    <div className="h-64 w-full md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 24, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3ea6ff" stopOpacity={0.55} />
              <stop offset="60%" stopColor="#3ea6ff" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#3ea6ff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#232c3d" vertical={false} />
          <XAxis
            dataKey="year"
            stroke="#8a94a6"
            tick={{ fill: "#8a94a6", fontSize: 12 }}
            axisLine={{ stroke: "#232c3d" }}
            tickLine={false}
          />
          <YAxis
            stroke="#8a94a6"
            tick={{ fill: "#8a94a6", fontSize: 11 }}
            tickFormatter={(v: number) => formatCompactValue(v)}
            width={64}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#3ea6ff"
            strokeWidth={2}
            fill="url(#valueGradient)"
            isAnimationActive={animate}
            animationDuration={900}
            dot={<RecordDot recordYear={recordYear} />}
            activeDot={{ r: 5, fill: "#3ea6ff", stroke: "#0a0e14", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
