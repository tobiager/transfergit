"use client";

import { useEffect, useState } from "react";
import { gsap } from "gsap";
import { formatMarketValue } from "@/lib/format";
import type { MarketValueTrend } from "@/lib/format";
import type { MarketValuePoint } from "@/lib/types";
import { buildSparklinePaths } from "@/app/api/og/_shared/sparkline";
import { useValuationModal } from "./ValuationModalContext";
import { TrendArrow } from "./TrendArrow";

const SPARK_WIDTH = 240;
const SPARK_HEIGHT = 40;

export function MarketValueBox({
  value,
  updatedAt,
  label,
  trend,
  history,
  recordValue,
}: {
  value: number;
  updatedAt?: string;
  label?: string;
  trend?: MarketValueTrend | null;
  history?: MarketValuePoint[];
  recordValue?: { formatted: string; year: number };
}) {
  const firstYear = history?.[0]?.year;
  const lastYear = history?.[history.length - 1]?.year;
  const [display, setDisplay] = useState(0);
  const { openModal } = useValuationModal();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs with matchMedia after mount; jumps straight to the final value without animating.
      setDisplay(value);
      return;
    }

    const counter = { val: 0 };
    const tween = gsap.to(counter, {
      val: value,
      duration: 1.1,
      ease: "power3.out",
      onUpdate: () => setDisplay(Math.round(counter.val)),
    });

    return () => {
      tween.kill();
    };
  }, [value]);

  const sparkline = history && history.length > 1 ? buildSparklinePaths(history, SPARK_WIDTH, SPARK_HEIGHT) : null;

  return (
    <div className="glow-green-border rounded-lg border bg-surface px-6 py-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
          {label ?? "Market Value"}
        </p>
        {trend && trend.direction !== "flat" && (
          <span
            className={`inline-flex items-center gap-1 whitespace-nowrap font-mono text-xs font-bold ${
              trend.direction === "up" ? "text-value-green" : "text-value-red"
            }`}
          >
            <TrendArrow direction={trend.direction} size={10} />
            {trend.direction === "up" ? "+" : "-"}
            {Math.abs(trend.pct).toFixed(1)}%
          </span>
        )}
      </div>

      <p className="mt-1 whitespace-nowrap font-display text-3xl leading-none text-value-green glow-green-text tabular-nums sm:text-4xl">
        {formatMarketValue(display)}
      </p>

      {recordValue && (
        <p className="mt-1 text-[11px] text-muted">
          Record: <span className="font-semibold text-foreground">{recordValue.formatted}</span> (
          {recordValue.year})
        </p>
      )}

      {sparkline && (
        <svg
          viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`}
          className="mt-3 h-8 w-full"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient id="mvbox-spark-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--value-green)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--value-green)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={sparkline.area} fill="url(#mvbox-spark-gradient)" />
          <path d={sparkline.line} fill="none" stroke="var(--value-green)" strokeWidth={1.5} />
        </svg>
      )}

      {firstYear && lastYear && (
        <div className="flex items-center justify-between font-mono text-[11px] text-muted">
          <span>{firstYear}</span>
          <span>{lastYear}</span>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between gap-3 border-t border-border pt-2">
        {updatedAt && <p className="text-[11px] text-muted">Last update: {updatedAt}</p>}
        <button
          type="button"
          onClick={openModal}
          className="text-[11px] font-medium text-muted underline-offset-2 hover:text-foreground hover:underline"
        >
          how is this calculated? ↗
        </button>
      </div>
    </div>
  );
}
