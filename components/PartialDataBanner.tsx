"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The retry cadence has to be >= the short TTL a partial/degraded profile is
// cached under server-side (lib/github.ts's RETRY_TTL_SECONDS, 10 minutes)
// — refreshing sooner just re-serves the same cached partial. A bit past
// that TTL gives the background re-attempt time to land.
const AUTO_REFRESH_MS = 11 * 60 * 1000;

// Shown whenever a profile rendered with real, but incomplete, data —
// missing contribution years or the fully-degraded REST fallback. Never
// hides what loaded; just says plainly that more is coming and keeps
// nudging the page to check back, so a visitor who leaves the tab open
// eventually sees the complete picture without a manual reload.
export function PartialDataBanner({ missingYears, degraded }: { missingYears: number[]; degraded: boolean }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [router]);

  const seasonWord = missingYears.length === 1 ? "season" : "seasons";
  const message = degraded
    ? "Scouting report incomplete — GitHub's full history API is temporarily unavailable. Showing what we could recover; refresh in a few minutes for the complete profile."
    : `Compiling full career history — ${missingYears.length} ${seasonWord} pending (${[...missingYears].sort((a, b) => a - b).join(", ")}).`;

  return (
    <div
      role="status"
      className="flex items-center gap-2 rounded-lg border border-gold/40 bg-gold/10 px-4 py-2.5 text-sm text-foreground"
    >
      <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-gold" />
      <span>{message}</span>
    </div>
  );
}
