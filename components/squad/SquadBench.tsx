import type { SquadPlayer } from "@/lib/squad";
import { PlayerChip } from "./PlayerChip";

export function SquadBench({
  bench,
  captainLogin,
  mvpLogin,
}: {
  bench: SquadPlayer[];
  captainLogin: string;
  mvpLogin: string;
}) {
  if (bench.length === 0) return null;

  return (
    <section data-reveal>
      <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-muted">Bench · {bench.length}</h2>
      {/* Mobile: horizontal scroll-snap strip. lg+: a plain 2-column grid. */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-2 lg:overflow-visible lg:px-0 lg:pb-0">
        {bench.map((player) => (
          <div key={player.login} data-reveal-row className="w-36 shrink-0 snap-start lg:w-auto">
            <PlayerChip
              player={player}
              variant="bench"
              isCaptain={player.login === captainLogin}
              isMvp={player.login === mvpLogin}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
