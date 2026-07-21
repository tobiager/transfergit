"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Home-page reveal wrapper: an immediate hero timeline on mount (headline
// lines, subtitle, search, showcase — same pattern as the old
// LandingReveal), plus a tgFadeUp-style scroll reveal for every
// [data-tg-reveal] section below the fold, reusing ProfileReveal's
// ScrollTrigger approach so both pages animate consistently.
export function HomeReveal({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const headlineLines = container.querySelectorAll<HTMLElement>("[data-reveal-line]");
    const subtitle = container.querySelector("[data-reveal='subtitle']");
    const input = container.querySelector("[data-reveal='input']");
    const helper = container.querySelector("[data-reveal='helper']");
    const showcase = container.querySelector("[data-reveal='showcase']");
    const sections = container.querySelectorAll<HTMLElement>("[data-tg-reveal]");

    if (reduceMotion) {
      gsap.set([...headlineLines, subtitle, input, helper, showcase], {
        opacity: 1,
        y: 0,
        clipPath: "inset(0 0 0% 0)",
      });
      gsap.set(sections, { opacity: 1, y: 0 });
      return;
    }

    gsap.set(headlineLines, { clipPath: "inset(0 0 100% 0)" });
    gsap.set([subtitle, input, helper, showcase], { opacity: 0, y: 20 });

    const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
    heroTl
      .to(headlineLines, { clipPath: "inset(0 0 0% 0)", duration: 0.5, stagger: 0.12 })
      .to(subtitle, { opacity: 1, y: 0, duration: 0.4 }, "-=0.25")
      .to(input, { opacity: 1, y: 0, duration: 0.4 }, "-=0.25")
      .to(helper, { opacity: 1, y: 0, duration: 0.35 }, "-=0.2")
      .to(showcase, { opacity: 1, y: 0, duration: 0.5 }, "-=0.3");

    gsap.registerPlugin(ScrollTrigger);
    const triggers: ScrollTrigger[] = [];

    sections.forEach((section) => {
      gsap.set(section, { opacity: 0, y: 14 });
      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top 85%",
        once: true,
        onEnter: () => gsap.to(section, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }),
      });
      triggers.push(trigger);
    });

    const refreshId = requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      heroTl.kill();
      cancelAnimationFrame(refreshId);
      triggers.forEach((t) => t.kill());
    };
  }, []);

  return <div ref={containerRef}>{children}</div>;
}
