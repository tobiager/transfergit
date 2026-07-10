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
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-3 -z-10 rounded-2xl bg-value-green/20 blur-2xl"
      />
      <div className="rounded-lg border border-white/[0.08] bg-gradient-to-br from-tm-blue to-tm-blue-deep px-6 py-4 shadow-[0_2px_6px_rgba(0,0,0,0.5),0_18px_36px_-16px_rgba(0,0,0,0.65)]">
        {/* This box is always a saturated blue gradient regardless of theme, so
            its text uses fixed white/opacity tones rather than the
            --tm-blue-bright token (which is tuned per-theme for links on
            page-background surfaces and goes low-contrast here in light mode). */}
        <p className="font-table text-xs font-semibold uppercase tracking-wider text-white/70">
          {label ?? "Market Value"}
        </p>
        <div className="flex items-baseline gap-2">
          <p className="whitespace-nowrap font-display text-3xl leading-none text-white tabular-nums sm:text-4xl">
            {formatMarketValue(display)}
          </p>
          {trend && trend.direction !== "flat" && (
            <span
              className={`inline-flex items-center gap-1 whitespace-nowrap text-sm font-bold ${
                trend.direction === "up" ? "text-value-green" : "text-value-red"
              }`}
            >
              <TrendArrow direction={trend.direction} size={10} />
              {Math.abs(trend.pct).toFixed(0)}%
            </span>
          )}
        </div>

        {recordValue && (
          <p className="mt-1 text-[11px] text-white/70">
            Record: <span className="font-semibold text-white">{recordValue.formatted}</span> (
            {recordValue.year})
          </p>
        )}

        {sparkline && (
          <svg
            viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`}
            className="mt-2 h-8 w-full"
            preserveAspectRatio="none"
            aria-hidden
          >
            <defs>
              <linearGradient id="mvbox-spark-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={sparkline.area} fill="url(#mvbox-spark-gradient)" />
            <path d={sparkline.line} fill="none" stroke="#ffffff" strokeWidth={1.5} strokeOpacity={0.85} />
          </svg>
        )}

        <div className="mt-2 flex items-center justify-between gap-3">
          {updatedAt && <p className="text-[11px] text-white/60">Last update: {updatedAt}</p>}
          <button
            type="button"
            onClick={openModal}
            className="text-[11px] font-medium text-white/80 underline-offset-2 hover:underline"
          >
            how is this calculated? ↗
          </button>
        </div>
      </div>
    </div>
  );
}
