"use client";

import { useRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";

const MAX_TILT_DEG = 4;

export function TiltCard({
  children,
  className,
  style,
  ...rest
}: { children: ReactNode; className?: string } & HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 2 * MAX_TILT_DEG;
    const rotateX = -(py - 0.5) * 2 * MAX_TILT_DEG;
    el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }

  function handleMouseLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      {...rest}
      style={{
        ...style,
        transition: "transform 0.15s ease-out",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}
