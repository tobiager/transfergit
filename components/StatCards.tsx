"use client";

import { useEffect, useRef, useState } from "react";
import { formatCompactNumber } from "@/lib/format";
import { CountUp } from "./CountUp";

export interface StatCardData {
  label: string;
  sublabel?: string;
  value: number;
  compact?: boolean;
  /** 0-99, shown inside the ring and count-up animated. Omit when ringLetter is set. */
  ringPercent?: number;
  /** Static override for the ring's content (e.g. "R"/"L" for preferred foot) — replaces the percentile and hides the external value. */
  ringLetter?: string;
  progress: number;
  color: string;
}

const RADIUS = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function StatCard({ item, index, visible }: { item: StatCardData; index: number; visible: boolean }) {
  const offset = CIRCUMFERENCE - (Math.min(Math.max(item.progress, 0), 100) / 100) * CIRCUMFERENCE;

  return (
    <div
      className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-all duration-500"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        transitionDelay: `${index * 100}ms`,
      }}
    >
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
        <svg viewBox="0 0 48 48" className="absolute inset-0 h-full w-full -rotate-90">
          <circle cx="24" cy="24" r={RADIUS} fill="none" stroke="var(--border)" strokeWidth="4" />
          <circle
            cx="24"
            cy="24"
            r={RADIUS}
            fill="none"
            stroke={item.color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={visible ? offset : CIRCUMFERENCE}
            style={{ transition: "stroke-dashoffset 0.9s ease-out" }}
          />
        </svg>
        {item.ringLetter ? (
          <span className="font-display text-sm font-bold" style={{ color: item.color }}>
            {item.ringLetter}
          </span>
        ) : (
          <CountUp
            value={item.ringPercent ?? 0}
            className="font-display text-xs font-bold tabular-nums"
            style={{ color: item.color }}
          />
        )}
      </div>
      <div className="min-w-0">
        {!item.ringLetter && (
          <CountUp
            value={item.value}
            formatter={item.compact ? formatCompactNumber : undefined}
            className="block font-display text-xl font-bold tabular-nums leading-none"
          />
        )}
        <p className="mt-1 truncate text-sm font-medium leading-tight text-foreground">{item.label}</p>
        {item.sublabel && <p className="truncate text-xs leading-tight text-muted">{item.sublabel}</p>}
      </div>
    </div>
  );
}

export function StatCards({ items }: { items: StatCardData[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item, i) => (
        <StatCard key={item.label} item={item} index={i} visible={visible} />
      ))}
    </div>
  );
}
