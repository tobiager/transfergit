"use client";

import { useEffect, useRef, useState } from "react";
import type { Tier } from "@/lib/achievements";
import { TrophyIcon } from "./TrophyIcon";

// Overview cabinet only ever receives the top 5 unlocked trophies (see
// lib/achievements.ts topTrophies) — no locked/progress states here, those
// live in the "View all trophies" modal.
export interface TrophyTileData {
  id: string;
  name: string;
  tier: Tier;
  dateHint: string | null;
  occurrences: Array<{ year: number; detail?: string }>;
  iconSrc: string;
}

export function TrophyCabinetGrid({ results }: { results: TrophyTileData[] }) {
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
    <div ref={containerRef} className="grid grid-cols-3 gap-3 p-4 sm:grid-cols-4 lg:grid-cols-5">
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
  result: TrophyTileData;
  index: number;
  visible: boolean;
}) {
  const { name, tier, dateHint, occurrences, iconSrc } = result;
  const glow = tier === "ballon-dor";
  const repeatCount = occurrences.length;

  return (
    <div
      className="relative flex flex-col items-center gap-2 rounded-lg p-3 text-center transition-transform duration-300 hover:-translate-y-0.5"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transitionDelay: `${index * 40}ms`,
      }}
    >
      <div
        className={`relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-gold bg-gold/10 transition-transform duration-200 hover:scale-110 ${
          glow ? "trophy-glow-gold" : ""
        }`}
      >
        <TrophyIcon src={iconSrc} size={28} />
        {repeatCount > 1 && (
          <span className="absolute -right-1 -top-1 rounded-full bg-pitch px-1.5 py-0.5 font-mono text-[10px] font-bold text-gold ring-1 ring-gold">
            ×{repeatCount}
          </span>
        )}
      </div>

      <span className="text-[11px] font-medium leading-tight">{name}</span>

      {dateHint && <span className="text-[10px] text-value-green/80">{dateHint}</span>}
    </div>
  );
}
