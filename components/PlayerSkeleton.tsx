"use client";

import { useEffect, useState } from "react";

// Most profiles resolve well under this from cache — only a genuinely cold,
// many-season fetch keeps the skeleton up long enough for this to appear,
// so a fast render never flashes it.
const SLOW_LOAD_THRESHOLD_MS = 3000;

function ScoutingStatusLine() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), SLOW_LOAD_THRESHOLD_MS);
    return () => clearTimeout(id);
  }, []);

  if (!visible) return null;

  return (
    <div className="flex items-center justify-center gap-2 pb-2 text-sm text-muted">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-value-green" />
      <span className="animate-pulse">Scouting seasons of history…</span>
    </div>
  );
}

export function PlayerSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <ScoutingStatusLine />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <div className="h-48 p-6">
            <div className="flex gap-6">
              <div className="shimmer h-28 w-28 rounded-lg md:h-36 md:w-36" />
              <div className="flex-1 space-y-3">
                <div className="shimmer h-4 w-32 rounded" />
                <div className="shimmer h-8 w-56 rounded" />
                <div className="shimmer h-4 w-24 rounded" />
              </div>
            </div>
          </div>
          <div className="shimmer h-80 rounded-xl border border-border" />
          <div className="shimmer h-64 rounded-xl border border-border" />
        </div>
        <div className="space-y-6">
          <div className="shimmer h-64 rounded-xl border border-border" />
          <div className="shimmer h-48 rounded-xl border border-border" />
          <div className="shimmer h-48 rounded-xl border border-border" />
        </div>
      </div>
    </div>
  );
}
