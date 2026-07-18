import type { ReservePlayer } from "@/lib/squad";
import { pluralize } from "@/lib/format";

// Tier 2 (roster positions 31-100): never valued, so no market value line —
// just avatar + commits, with the username as a native tooltip. A compact
// wall instead of the bench's larger chips, since there's no per-player
// stat beyond commits worth the extra space.
function ReserveAvatar({ player }: { player: ReservePlayer }) {
  return (
    <span
      title={`@${player.login} · ${pluralize(player.commits, "commit")}`}
      className="flex w-14 shrink-0 flex-col items-center gap-1 rounded-lg px-1 py-1 snap-start sm:w-16"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- direct CDN
          fetch, lazy-loaded outside the viewport, see PlayerChip.tsx */}
      <img
        src={player.avatarUrl}
        alt=""
        loading="lazy"
        decoding="async"
        className="h-10 w-10 rounded-full ring-1 ring-white/10"
      />
      <span className="truncate text-[8px] leading-tight text-muted sm:text-[9px]">{pluralize(player.commits, "commit")}</span>
    </span>
  );
}

export function SquadReserves({ reserves }: { reserves: ReservePlayer[] }) {
  if (reserves.length === 0) return null;

  return (
    <section data-reveal>
      <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-muted">Reserves · {reserves.length}</h2>
      {/* Mobile: horizontal scroll-snap strip, same pattern as the bench.
          lg+: a compact wrapping wall instead of a fixed grid — there's no
          per-row structure to preserve since these chips carry no position. */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 lg:pb-0">
        {reserves.map((player) => (
          <div key={player.login} data-reveal-row>
            <ReserveAvatar player={player} />
          </div>
        ))}
      </div>
    </section>
  );
}
