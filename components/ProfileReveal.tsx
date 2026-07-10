"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Per-section scroll reveals: each [data-reveal] / [data-reveal-item] block
// fades + rises 24px once it's 20% into the viewport (not on every scroll),
// staggering its own [data-reveal-row] children. Rating bars still fill to
// their score at the same moment. Animates only opacity/transform/width so
// nothing shifts layout.
export function ProfileReveal({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sections = container.querySelectorAll<HTMLElement>("[data-reveal], [data-reveal-item]");
    const bars = container.querySelectorAll<HTMLElement>("[data-reveal-bar]");

    if (reduceMotion) {
      gsap.set(sections, { opacity: 1, y: 0 });
      bars.forEach((bar) => {
        bar.style.width = `${bar.dataset.score}%`;
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    const triggers: ScrollTrigger[] = [];

    sections.forEach((section, i) => {
      const rows = section.querySelectorAll<HTMLElement>("[data-reveal-row]");
      const sectionBars = section.querySelectorAll<HTMLElement>("[data-reveal-bar]");
      const targets = rows.length > 0 ? rows : [section];

      gsap.set(section, { opacity: 0, y: 24 });
      // Rows only animate a y-offset (not opacity): some rows carry their
      // own intentional resting opacity (e.g. "on loan" season rows at 60%),
      // and an inline opacity:1 from the reveal tween would clobber that.
      if (rows.length > 0) gsap.set(rows, { y: 16 });
      gsap.set(sectionBars, { width: 0 });

      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top 80%",
        once: true,
        // The first couple of sections are visible on load — animate them
        // right away instead of waiting for a scroll event to fire.
        onEnter: () => {
          const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
          tl.to(section, { opacity: 1, y: 0, duration: 0.5 });
          if (rows.length > 0) {
            tl.to(targets, { y: 0, duration: 0.4, stagger: 0.06 }, "-=0.3");
          }
          if (sectionBars.length > 0) {
            tl.to(
              sectionBars,
              { width: (_i, el) => `${(el as HTMLElement).dataset.score}%`, duration: 0.6, stagger: 0.05 },
              "-=0.2"
            );
          }
        },
      });
      triggers.push(trigger);
      void i;
    });

    // Above-the-fold sections may already satisfy their trigger before
    // layout settles (fonts/images loading) — refresh once on next tick.
    const refreshId = requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      cancelAnimationFrame(refreshId);
      triggers.forEach((t) => t.kill());
    };
  }, []);

  return <div ref={containerRef}>{children}</div>;
}
