"use client";

import { useState } from "react";
import type { Tier } from "@/lib/achievements";

const TIER_COLOR: Record<Tier, string> = {
  squad: "#8a94a6",
  international: "#d7dbe4",
  "ballon-dor": "#ffc400",
};

// Trophy PNGs live in /public/trophies/{id}.png (512x512, transparent) and
// are added out-of-band. Until one exists for a given id, fall back to a
// generic silhouette colored by tier.
export function TrophyIcon({ id, tier, size = 40 }: { id: string; tier: Tier; size?: number }) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return <TrophySilhouette color={TIER_COLOR[tier]} size={size} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- needs a plain onError fallback; next/image swallows 404s differently across environments.
    <img
      src={`/trophies/${id}.png`}
      alt=""
      width={size}
      height={size}
      onError={() => setErrored(true)}
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
}

function TrophySilhouette({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M6 3h12v2h2a1 1 0 0 1 1 1v1a4 4 0 0 1-4 4h-.09A6 6 0 0 1 13 14.9V18h3v2H8v-2h3v-3.1A6 6 0 0 1 7.09 11H7a4 4 0 0 1-4-4V6a1 1 0 0 1 1-1h2V3zm0 4H5v1a2 2 0 0 0 2 2V7zm12 0v3a2 2 0 0 0 2-2V7h-2z" />
    </svg>
  );
}
