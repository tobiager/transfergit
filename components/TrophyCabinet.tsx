"use client";

import { useEffect, useRef, useState } from "react";
import { evaluateAchievements, type AchievementResult } from "@/lib/achievements";
import type { Player } from "@/lib/types";
import { TrophyIcon } from "./TrophyIcon";

export function TrophyCabinet({ player }: { player: Player }) {
  const results = evaluateAchievements(player);
  const unlockedCount = results.filter((r) => r.unlocked).length;
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
    <div data-reveal-item className="overflow-hidden rounded-xl tm-card">
      <div className="flex items-baseline justify-between bg-tm-blue-deep px-4 py-2">
        <h2 className="font-table text-lg font-bold uppercase tracking-wide text-white">
          Trophy Cabinet
        </h2>
        <span className="font-table text-sm font-semibold text-tm-blue-bright">
          {unlockedCount}/{results.length} unlocked
        </span>
      </div>

      <div
        ref={containerRef}
        className="grid grid-cols-3 gap-3 p-4 sm:grid-cols-4 lg:grid-cols-6"
      >
        {results.map((result, i) => (
          <TrophyTile key={result.achievement.id} result={result} index={i} visible={visible} />
        ))}
      </div>
    </div>
  );
}

function TrophyTile({
  result,
  index,
  visible,
}: {
  result: AchievementResult;
  index: number;
  visible: boolean;
}) {
  const { achievement, unlocked, progress, dateHint } = result;
  const glow = unlocked && achievement.tier === "ballon-dor";

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
      <div className={unlocked ? "" : "opacity-40 grayscale"}>
        <TrophyIcon id={achievement.id} tier={achievement.tier} />
      </div>

      {!unlocked && (
        <span aria-hidden className="absolute right-2 top-2 text-xs text-muted">
          🔒
        </span>
      )}

      <span className={`text-[11px] font-medium leading-tight ${unlocked ? "" : "text-muted"}`}>
        {achievement.name}
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
        <p className="font-semibold text-foreground">{achievement.name}</p>
        <p className="mt-0.5 text-muted">{achievement.description}</p>
        <p className="mt-1 text-[10px] uppercase tracking-wide text-tm-blue-bright">
          {achievement.category}
        </p>
      </div>
    </button>
  );
}
