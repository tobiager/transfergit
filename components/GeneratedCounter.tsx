"use client";

import { useEffect, useState } from "react";
import { gsap } from "gsap";
import { formatNumber } from "@/lib/format";

// No analytics/DB yet: this is a decorative counter, not a real metric.
const TOTAL_CARDS_GENERATED = 12_482;

export function GeneratedCounter() {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs with matchMedia after mount; jumps straight to the final value without animating.
      setDisplay(TOTAL_CARDS_GENERATED);
      return;
    }

    const counter = { val: 0 };
    const tween = gsap.to(counter, {
      val: TOTAL_CARDS_GENERATED,
      duration: 1,
      delay: 0.5,
      ease: "power3.out",
      onUpdate: () => setDisplay(Math.round(counter.val)),
    });

    return () => {
      tween.kill();
    };
  }, []);

  return <span className="font-display tabular-nums text-value-green">{formatNumber(display)}</span>;
}
