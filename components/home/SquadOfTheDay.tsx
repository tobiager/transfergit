import Image from "next/image";
import { unstable_cache } from "next/cache.js";
import { getRepoSquad } from "@/lib/squad/index.ts";
import type { Squad, Starter } from "@/lib/squad/types.ts";
import { FEATURED_REPOS, pickFeaturedRepo } from "@/lib/squad/featuredRepos.ts";
import { pitchPosition, pitchPositionHorizontal } from "@/lib/squad/pitchLayout.ts";
import { formationLabel } from "@/lib/squad/formations.ts";
import { ScoutCta } from "./ScoutCta";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function matchday(date: Date): string {
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

interface Resolved {
  owner: string;
  repo: string;
  squad: Squad;
}

// This section only ever shows a squad with every starter valued — a
// "—" market value reads as broken, not "still loading" (there's nowhere
// for it to finish loading on a static page). If today's pick isn't fully
// warm yet, fall back to the most recent curated repo that IS complete;
// the daily GitHub Action (.github/workflows/warm-squad-of-the-day.yml)
// exists precisely to make that fallback rare in practice.
async function resolveSquadOfTheDay(): Promise<Resolved | null> {
  const today = pickFeaturedRepo();
  const candidates = [today, ...FEATURED_REPOS.filter((r) => r.owner !== today.owner || r.repo !== today.repo)];
  for (const { owner, repo } of candidates) {
    const squad = await getRepoSquad(owner, repo).catch(() => null);
    if (squad && squad.pendingValuations.length === 0) {
      return { owner, repo, squad };
    }
  }
  return null;
}

// Keyed by calendar day so the resolution (which repo, complete or not)
// never gets stuck serving a stale day past midnight, while still being
// cheap for every visitor within the same day — getRepoSquad's own 6h
// per-repo cache underneath makes each candidate check fast once warm.
async function getCachedSquadOfTheDay(): Promise<Resolved | null> {
  const dateKey = new Date().toISOString().slice(0, 10);
  const cached = unstable_cache(resolveSquadOfTheDay, ["home-squad-of-the-day", dateKey], {
    revalidate: 86400,
    tags: ["home-squad-of-the-day"],
  });
  try {
    return await cached();
  } catch (err) {
    if (err instanceof Error && err.message.includes("incrementalCache")) {
      return resolveSquadOfTheDay();
    }
    throw err;
  }
}

function StarterChip({ starter, left, top }: { starter: Starter; left: number; top: number }) {
  return (
    <div
      className="absolute flex w-[78px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 sm:w-[110px]"
      style={{ left: `${left}%`, top: `${top}%` }}
    >
      <div className="relative h-9 w-9 sm:h-[46px] sm:w-[46px]">
        <Image
          src={starter.avatarUrl}
          alt={starter.login}
          width={46}
          height={46}
          className="h-full w-full rounded-full border-2 border-[var(--tg-accent-dim)] bg-[var(--tg-surface-elevated)] [box-shadow:0_0_14px_rgba(0,230,118,0.35)]"
        />
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-[var(--tg-border)] bg-[#101815] px-1.5 py-px font-mono text-[7px] font-bold uppercase tracking-wide text-[var(--tg-muted-dim)] sm:text-[8px]">
          {starter.position.role}
        </span>
      </div>
      <span className="max-w-full truncate font-mono text-[8.5px] text-[var(--tg-fg-soft)] sm:text-[10.5px]">{starter.login}</span>
      <span className="-mt-0.5 font-mono text-[8.5px] font-bold text-[var(--tg-accent)] sm:text-[10px]">{starter.marketValueFormatted}</span>
    </div>
  );
}

export async function SquadOfTheDay() {
  const resolved = await getCachedSquadOfTheDay();
  if (!resolved) return null;
  const { owner, repo, squad } = resolved;

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--tg-border)] bg-gradient-to-br from-[var(--tg-surface)] to-[#0a100d]">
      <div className="flex flex-col gap-3 border-b border-[var(--tg-border-soft)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex flex-wrap items-center gap-3.5">
          <span className="rounded bg-[var(--tg-accent)] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-[#04120a]">
            Matchday · {matchday(new Date())}
          </span>
          <h2 className="font-oswald text-xl font-semibold uppercase tracking-wide text-[var(--tg-fg)] sm:text-2xl lg:text-3xl">
            Squad of the day
          </h2>
        </div>
        <div className="flex items-baseline gap-4">
          <span className="font-mono text-sm text-[var(--tg-muted)]">
            {owner}/{repo}
          </span>
          <span className="font-oswald text-xl font-bold text-[var(--tg-accent)] [text-shadow:0_0_18px_rgba(47,255,0,0.3)] sm:text-3xl">
            {squad.totalValueFormatted}
          </span>
        </div>
      </div>

      {/* Desktop: landscape/broadcast pitch — GK left, attack right, same
          pitchPositionHorizontal mapping the squad OG export uses. */}
      <div className="relative mx-8 my-6 hidden h-[430px] rounded-lg border border-[rgba(0,230,118,0.16)] bg-gradient-to-b from-[rgba(0,230,118,0.03)] to-[rgba(0,230,118,0.01)] lg:block">
        <div className="absolute left-1/2 top-0 h-full w-[1.5px] -translate-x-1/2 bg-[rgba(0,230,118,0.16)]" aria-hidden />
        <div className="absolute left-1/2 top-1/2 h-[120px] w-[120px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-[rgba(0,230,118,0.16)]" aria-hidden />
        <div className="absolute left-0 top-1/2 h-[200px] w-[110px] -translate-y-1/2 border-[1.5px] border-l-0 border-[rgba(0,230,118,0.16)]" aria-hidden />
        <div className="absolute right-0 top-1/2 h-[200px] w-[110px] -translate-y-1/2 border-[1.5px] border-r-0 border-[rgba(0,230,118,0.16)]" aria-hidden />
        {squad.starters.map((starter) => {
          const { left, top } = pitchPositionHorizontal(starter.position.x, starter.position.y);
          return <StarterChip key={starter.login} starter={starter} left={left} top={top} />;
        })}
      </div>

      {/* Mobile: portrait pitch — GK bottom, attack top, the regular
          top-down formation mapping /squad's own pitch uses. */}
      <div className="relative mx-4 my-6 h-[340px] rounded-lg border border-[rgba(0,230,118,0.16)] bg-gradient-to-b from-[rgba(0,230,118,0.03)] to-[rgba(0,230,118,0.01)] lg:hidden">
        <div className="absolute left-0 top-1/2 w-full h-[1.5px] -translate-y-1/2 bg-[rgba(0,230,118,0.16)]" aria-hidden />
        <div className="absolute left-1/2 top-1/2 h-[90px] w-[90px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-[rgba(0,230,118,0.16)]" aria-hidden />
        <div className="absolute left-1/2 top-0 h-[60px] w-[150px] -translate-x-1/2 border-[1.5px] border-t-0 border-[rgba(0,230,118,0.16)]" aria-hidden />
        <div className="absolute left-1/2 bottom-0 h-[60px] w-[150px] -translate-x-1/2 border-[1.5px] border-b-0 border-[rgba(0,230,118,0.16)]" aria-hidden />
        {squad.starters.map((starter) => {
          const { left, top } = pitchPosition(starter.position.x, starter.position.y);
          return <StarterChip key={starter.login} starter={starter} left={left} top={top} />;
        })}
      </div>

      <div className="flex flex-col gap-3 px-5 pb-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <span className="font-mono text-xs uppercase text-[var(--tg-muted-faint)]">
          {formationLabel(squad.formation)} · {squad.starters.length} starters of {squad.starters.length + squad.bench.length + squad.reserves.length}{" "}
          contributors
        </span>
        <ScoutCta />
      </div>
    </div>
  );
}

export function SquadOfTheDaySkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--tg-border)] bg-[var(--tg-surface)]">
      <div className="h-[100px] border-b border-[var(--tg-border-soft)]" />
      <div className="shimmer mx-4 my-6 h-[340px] rounded-lg sm:mx-8 sm:h-[430px]" />
      <div className="h-16" />
    </div>
  );
}
