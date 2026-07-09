"use client";

import { useEffect, useState } from "react";
import { gsap } from "gsap";
import { formatMarketValue } from "@/lib/format";
import type { MarketValueTrend } from "@/lib/format";
import { useValuationModal } from "./ValuationModalContext";

export function MarketValueBox({
  value,
  updatedAt,
  label,
  trend,
}: {
  value: number;
  updatedAt?: string;
  label?: string;
  trend?: MarketValueTrend | null;
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

  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-3 -z-10 rounded-2xl bg-value-green/20 blur-2xl"
      />
      <div className="rounded-lg border border-white/[0.08] bg-gradient-to-br from-tm-blue to-tm-blue-deep px-6 py-4 shadow-[0_2px_6px_rgba(0,0,0,0.5),0_18px_36px_-16px_rgba(0,0,0,0.65)]">
        <p className="font-table text-xs font-semibold uppercase tracking-wider text-tm-blue-bright/80">
          {label ?? "Market Value"}
        </p>
        <div className="flex items-baseline gap-2">
          <p className="whitespace-nowrap font-display text-3xl leading-none text-white tabular-nums sm:text-4xl">
            {formatMarketValue(display)}
          </p>
          {trend && trend.direction !== "flat" && (
            <span
              className={`whitespace-nowrap text-sm font-bold ${
                trend.direction === "up" ? "text-value-green" : "text-value-red"
              }`}
            >
              {trend.direction === "up" ? "▲" : "▼"} {Math.abs(trend.pct).toFixed(0)}%
            </span>
          )}
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-3">
          {updatedAt && (
            <p className="text-[11px] text-tm-blue-bright/70">Last update: {updatedAt}</p>
          )}
          <button
            type="button"
            onClick={openModal}
            className="text-[11px] font-medium text-tm-blue-bright/90 underline-offset-2 hover:underline"
          >
            how is this calculated? ↗
          </button>
        </div>
      </div>
    </div>
  );
}
