"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { gsap } from "gsap";

export function ProfileReveal({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const header = container.querySelector('[data-reveal="header"]');
    const share = container.querySelector('[data-reveal="share"]');
    const chart = container.querySelector('[data-reveal="chart"]');
    const scouting = container.querySelector('[data-reveal="scouting"]');
    const table = container.querySelector('[data-reveal="table"]');
    const sidebarItems = container.querySelectorAll("[data-reveal-item]");
    const bars = container.querySelectorAll<HTMLElement>("[data-reveal-bar]");

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      gsap.set([header, share, chart, scouting, table, ...sidebarItems], { opacity: 1, y: 0 });
      bars.forEach((bar) => {
        bar.style.width = `${bar.dataset.score}%`;
      });
      return;
    }

    const targets = [header, share, chart, scouting, table, ...sidebarItems].filter(Boolean);
    gsap.set(targets, { opacity: 0, y: 20 });
    gsap.set(bars, { width: 0 });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.to(header, { opacity: 1, y: 0, duration: 0.5 })
      .to(share, { opacity: 1, y: 0, duration: 0.4 }, "-=0.3")
      .to(sidebarItems, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08 }, "-=0.3")
      .to(chart, { opacity: 1, y: 0, duration: 0.45 }, "-=0.25")
      .to(scouting, { opacity: 1, y: 0, duration: 0.4 }, "-=0.2")
      .to(
        bars,
        {
          width: (i, el) => `${(el as HTMLElement).dataset.score}%`,
          duration: 0.6,
          stagger: 0.05,
        },
        "-=0.15"
      )
      .to(table, { opacity: 1, y: 0, duration: 0.4 }, "-=0.35");

    return () => {
      tl.kill();
    };
  }, []);

  return <div ref={containerRef}>{children}</div>;
}
