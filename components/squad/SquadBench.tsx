import type { SquadPlayer } from "@/lib/squad";
import { BenchPlayer } from "./BenchPlayer";

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
    <section data-reveal className="mt-8">
      <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-muted">Bench · {bench.length}</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {bench.map((player) => (
          <div key={player.login} data-reveal-row>
            <BenchPlayer
              player={player}
              isCaptain={player.login === captainLogin}
              isMvp={player.login === mvpLogin}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
