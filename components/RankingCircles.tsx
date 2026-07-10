"use client";

import { useEffect, useRef, useState } from "react";
import { CountUp } from "./CountUp";

interface RankingItem {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
}

function Circle({ item, index, visible }: { item: RankingItem; index: number; visible: boolean }) {
  return (
    <div
      className="flex flex-col items-center gap-2 text-center transition-all duration-500"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        transitionDelay: `${index * 100}ms`,
      }}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-tm-blue-bright/50 bg-surface-elevated">
        <CountUp
          value={item.value}
          prefix={item.prefix}
          suffix={item.suffix}
          className="font-display text-lg font-bold tabular-nums text-tm-blue-bright"
        />
      </div>
      <p className="max-w-[8rem] text-[11px] leading-tight text-muted">{item.label}</p>
    </div>
  );
}

export function RankingCircles({ items }: { items: RankingItem[] }) {
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
    <div ref={containerRef} className="flex flex-wrap justify-center gap-6 sm:justify-start">
      {items.map((item, i) => (
        <Circle key={item.label} item={item} index={i} visible={visible} />
      ))}
    </div>
  );
}
