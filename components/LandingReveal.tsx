"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { gsap } from "gsap";

export function LandingReveal({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const headlineLines = container.querySelectorAll<HTMLElement>("[data-reveal-line]");
    const subtitle = container.querySelector("[data-reveal='subtitle']");
    const input = container.querySelector("[data-reveal='input']");
    const helper = container.querySelector("[data-reveal='helper']");
    const fanCards = container.querySelectorAll<HTMLElement>("[data-reveal-fan-card]");

    fanCards.forEach((card) => {
      gsap.set(card, { rotation: parseFloat(card.dataset.rotation ?? "0"), transformOrigin: "bottom center" });
    });

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      gsap.set([...headlineLines, subtitle, input, helper], {
        opacity: 1,
        y: 0,
        clipPath: "inset(0 0 0% 0)",
      });
      gsap.set(fanCards, { opacity: 1, y: 0 });
      return;
    }

    gsap.set(headlineLines, { clipPath: "inset(0 0 100% 0)" });
    gsap.set([subtitle, input, helper], { opacity: 0, y: 20 });
    gsap.set(fanCards, { opacity: 0, y: 50 });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.to(headlineLines, { clipPath: "inset(0 0 0% 0)", duration: 0.5, stagger: 0.12 })
      .to(subtitle, { opacity: 1, y: 0, duration: 0.4 }, "-=0.25")
      .to(input, { opacity: 1, y: 0, duration: 0.4 }, "-=0.25")
      .to(helper, { opacity: 1, y: 0, duration: 0.35 }, "-=0.2")
      .to(fanCards, { opacity: 1, y: 0, duration: 0.45, stagger: 0.08 }, "-=0.3");

    return () => {
      tl.kill();
    };
  }, []);

  return <div ref={containerRef}>{children}</div>;
}
