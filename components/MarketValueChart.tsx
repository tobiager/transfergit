"use client";

import { useEffect, useRef, useState } from "react";
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

function RecordDot(props: {
  cx?: number;
  cy?: number;
  payload?: ChartPoint;
  recordYear: number;
  recordTextAnchor: "start" | "middle" | "end";
  lastYear: number;
  clubAvatarUrl: string | null;
}) {
  const { cx, cy, payload, recordYear, recordTextAnchor, lastYear, clubAvatarUrl } = props;
  if (cx == null || cy == null || !payload) return null;

  // The current club's badge marks the latest point on the curve, like
  // Transfermarkt overlaying club crests on the value evolution graph.
  if (payload.year === lastYear && clubAvatarUrl && payload.year !== recordYear) {
    const r = 8;
    return (
      <g>
        <clipPath id="chart-club-avatar-clip">
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
        <circle cx={cx} cy={cy} r={r + 1.5} fill="var(--pitch)" stroke="var(--tm-blue-bright)" strokeWidth={1.5} />
        <image
          href={clubAvatarUrl}
          x={cx - r}
          y={cy - r}
          width={r * 2}
          height={r * 2}
          clipPath="url(#chart-club-avatar-clip)"
        />
      </g>
    );
  }

  if (payload.year !== recordYear) {
    return <Dot cx={cx} cy={cy} r={3} fill="var(--tm-blue-bright)" stroke="none" />;
  }

  const labelX = recordTextAnchor === "start" ? cx - 8 : recordTextAnchor === "end" ? cx + 8 : cx;

  return (
    <g>
      <circle
        className="record-pulse-ring"
        cx={cx}
        cy={cy}
        r={8}
        fill="none"
        stroke="var(--gold)"
        strokeWidth={2}
      />
      <circle cx={cx} cy={cy} r={3.5} fill="var(--gold)" />
      <text
        x={labelX}
        y={cy - 14}
        textAnchor={recordTextAnchor}
        fontSize={11}
        fontWeight={700}
        fill="var(--gold)"
      >
        Record
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
      : ` · ${point.change >= 0 ? "+" : ""}${point.change.toFixed(0)}% YoY`;

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
  currentClubAvatar,
}: {
  history: MarketValuePoint[];
  recordYear: number;
  currentClubAvatar?: string | null;
}) {
  const data = buildChartData(history);
  const lastYear = data[data.length - 1]?.year ?? recordYear;
  const recordIndex = data.findIndex((point) => point.year === recordYear);
  const recordTextAnchor: "start" | "middle" | "end" =
    recordIndex === 0 ? "start" : recordIndex === data.length - 1 ? "end" : "middle";
  // Starts without animating (matches SSR) and activates once the chart
  // scrolls into view, so the line draws in when the user reaches it rather
  // than immediately on page load.
  const [animate, setAnimate] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs with matchMedia; skips the draw-in animation entirely.
      setAnimate(false);
      return;
    }
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimate(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="h-64 w-full md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 24, right: 24, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--tm-blue-bright)" stopOpacity={0.55} />
              <stop offset="60%" stopColor="var(--tm-blue-bright)" stopOpacity={0.12} />
              <stop offset="100%" stopColor="var(--tm-blue-bright)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="year"
            stroke="var(--muted)"
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            stroke="var(--muted)"
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            tickFormatter={(v: number) => formatCompactValue(v)}
            width={64}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--tm-blue-bright)"
            strokeWidth={2}
            fill="url(#valueGradient)"
            isAnimationActive={animate}
            animationDuration={900}
            dot={
              <RecordDot
                recordYear={recordYear}
                recordTextAnchor={recordTextAnchor}
                lastYear={lastYear}
                clubAvatarUrl={currentClubAvatar ?? null}
              />
            }
            activeDot={{ r: 5, fill: "var(--tm-blue-bright)", stroke: "var(--pitch)", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
