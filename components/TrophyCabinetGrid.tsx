"use client";

import { useEffect, useRef, useState } from "react";
import type { AchievementProgress, Tier } from "@/lib/achievements";
import { TrophyIcon } from "./TrophyIcon";

export interface TrophyRow {
  id: string;
  name: string;
  description: string;
  category: string;
  tier: Tier;
  unlocked: boolean;
  progress: AchievementProgress | null;
  dateHint: string | null;
  iconSrc: string;
}

export function TrophyCabinetGrid({ results }: { results: TrophyRow[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs with matchMedia after mount; skips straight to the visible state without animating.
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="grid grid-cols-3 gap-3 p-4 sm:grid-cols-4 lg:grid-cols-6">
      {results.map((result, i) => (
        <TrophyTile key={result.id} result={result} index={i} visible={visible} />
      ))}
    </div>
  );
}

function TrophyTile({
  result,
  index,
  visible,
}: {
  result: TrophyRow;
  index: number;
  visible: boolean;
}) {
  const { name, description, category, tier, unlocked, progress, dateHint, iconSrc } = result;
  const glow = unlocked && tier === "ballon-dor";

  return (
    <button
      type="button"
      className={`group/trophy relative flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-all duration-300 ${
        unlocked
          ? "border-tm-blue-bright/30 bg-surface-elevated"
          : "border-border bg-surface-elevated/40"
      } ${glow ? "trophy-glow-gold" : ""}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transitionDelay: `${index * 40}ms`,
      }}
    >
      <div
        className={`transition-transform duration-200 group-hover/trophy:scale-110 ${
          unlocked ? "" : "opacity-40 grayscale"
        }`}
      >
        <TrophyIcon src={iconSrc} />
      </div>

      {!unlocked && (
        <span aria-hidden className="absolute right-2 top-2 text-xs text-muted">
          🔒
        </span>
      )}

      <span className={`text-[11px] font-medium leading-tight ${unlocked ? "" : "text-muted"}`}>
        {name}
      </span>

      {unlocked && dateHint && (
        <span className="text-[10px] text-tm-blue-bright/80">{dateHint}</span>
      )}

      {!unlocked && progress && (
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
          <div
            className="h-full rounded-full bg-tm-blue-bright/70"
            style={{ width: `${Math.min((progress.current / progress.target) * 100, 100)}%` }}
          />
        </div>
      )}

      <div
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-48 -translate-x-1/2 rounded-md border border-border bg-pitch-elevated px-3 py-2 text-left text-xs opacity-0 shadow-lg transition-opacity duration-150 group-hover/trophy:opacity-100 group-focus/trophy:opacity-100"
      >
        <p className="font-semibold text-foreground">{name}</p>
        <p className="mt-0.5 text-muted">{description}</p>
        <p className="mt-1 text-[10px] uppercase tracking-wide text-tm-blue-bright">{category}</p>
      </div>
    </button>
  );
}
