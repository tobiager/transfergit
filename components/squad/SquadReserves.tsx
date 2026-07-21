import type { ReservePlayer } from "@/lib/squad";
import { ReserveAvatar } from "./ReserveAvatar";

// Tier 2 (roster positions 31-100): never valued, so no per-player card —
// a compact wall of 36px avatars, each with the same hover/tap popover as
// pitch chips (ReserveAvatar). Fits the match-center sidebar and the mobile
// Squad tab.
export function SquadReserves({ reserves }: { reserves: ReservePlayer[] }) {
  if (reserves.length === 0) return null;

  return (
    <section data-reveal>
      <h2 className="mb-2 font-mono text-xs uppercase tracking-[0.3em] text-muted">Reserves · {reserves.length}</h2>
      <div className="flex flex-wrap gap-2">
        {reserves.map((player) => (
          <ReserveAvatar key={player.login} player={player} />
        ))}
      </div>
    </section>
  );
}
