"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

// Animates a number from 0 to `value` once its container enters the
// viewport. Shared by the ranking circles and the trophy cabinet's
// unlocked-count badge.
export function CountUp({
  value,
  className,
  prefix = "",
  suffix = "",
}: {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs with matchMedia; jumps straight to the final value without animating.
      setDisplay(value);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const counter = { val: 0 };
        gsap.to(counter, {
          val: value,
          duration: 0.9,
          ease: "power3.out",
          onUpdate: () => setDisplay(Math.round(counter.val)),
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
