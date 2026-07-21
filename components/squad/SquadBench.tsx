import type { SquadPlayer } from "@/lib/squad";
import { PlayerChip } from "./PlayerChip";

// Compact one-column list for the match-center sidebar (and the mobile
// "Squad" tab): one row per player — avatar, username, value + commits on
// a single line. Click still opens the player popover.
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
      <h2 className="mb-2 font-mono text-xs uppercase tracking-[0.3em] text-muted">Bench · {bench.length}</h2>
      <div className="flex flex-col gap-1.5">
        {bench.map((player) => (
          <PlayerChip
            key={player.login}
            player={player}
            variant="row"
            isCaptain={player.login === captainLogin}
            isMvp={player.login === mvpLogin}
          />
        ))}
      </div>
    </section>
  );
}
