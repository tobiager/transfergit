import type { CSSProperties } from "react";
import { FORMATIONS, DEFAULT_FORMATION } from "@/lib/squad/formations";
import { pitchPosition } from "@/lib/squad/pitchLayout";
import { SquadShell } from "./SquadShell";

function ShimmerChip() {
  return (
    <div className="flex w-14 flex-col items-center gap-1 px-1 py-1 sm:w-24">
      <div className="h-10 w-10 animate-pulse rounded-full bg-surface sm:h-[72px] sm:w-[72px]" />
      <div className="h-2 w-10 animate-pulse rounded bg-surface sm:w-14" />
    </div>
  );
}

// Same 433 default-formation coordinates the real pitch resolves to for an
// 11-player squad — so the skeleton-to-real swap doesn't jump. Mirrors
// SquadPitch's container classes (incl. pitch-fit) so it occupies the exact
// same box in the match-center shell.
function SquadPitchSkeleton() {
  return (
    <div
      className="pitch-fit relative mx-auto aspect-[68/118] w-full max-w-[36rem] rounded-xl border border-border bg-pitch-elevated"
      style={{ "--pitch-ar": "0.5763" } as CSSProperties}
    >
      {FORMATIONS[DEFAULT_FORMATION].map((slot) => {
        const pos = pitchPosition(slot.x, slot.y);
        return (
          <div
            key={slot.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
          >
            <ShimmerChip />
          </div>
        );
      })}
    </div>
  );
}

function ShimmerBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-surface ${className}`} />;
}

// Instant shell shown while getRepoSquad resolves (see the Suspense
// boundary in page.tsx) — owner/repo are already known from the URL, so the
// header title renders for real; everything that needs fetched data is a
// shimmer placeholder inside the exact same SquadShell the real body uses,
// so the swap never shifts layout.
export function SquadSkeleton({ owner, repo }: { owner: string; repo: string }) {
  return (
    <SquadShell
      sidebarTop={
        <div className="flex flex-col gap-3">
          <header className="rounded-xl tm-card px-5 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-value-green">Repo Squad</p>
              <div className="h-4 w-10 animate-pulse rounded-full bg-surface" />
            </div>
            <h1 className="mt-1 line-clamp-2 break-words font-display text-xl uppercase leading-[1.05] tracking-tight">
              {owner}/{repo}
            </h1>
            <div className="mt-2 flex flex-col gap-1">
              <div className="h-8 w-28 animate-pulse rounded bg-surface" />
              <div className="h-4 w-32 animate-pulse rounded bg-surface" />
            </div>
          </header>
          <ShimmerBlock className="h-16" />
        </div>
      }
      sidebar={
        <div className="flex flex-col gap-4">
          <ShimmerBlock className="h-64" />
          <ShimmerBlock className="h-24" />
        </div>
      }
      toolbar={
        <div className="flex flex-wrap justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-7 w-16 animate-pulse rounded-full bg-surface" />
          ))}
        </div>
      }
      pitch={<SquadPitchSkeleton />}
      exportPanel={<ShimmerBlock className="h-[480px]" />}
    />
  );
}
