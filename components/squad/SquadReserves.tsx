import type { ReservePlayer } from "@/lib/squad";
import { pluralize } from "@/lib/format";

// Tier 2 (roster positions 31-100): never valued, so no per-player card —
// a compact wall of 36px avatars with a native tooltip carrying username
// and commit count. Fits the match-center sidebar and the mobile Squad tab.
export function SquadReserves({ reserves }: { reserves: ReservePlayer[] }) {
  if (reserves.length === 0) return null;

  return (
    <section data-reveal>
      <h2 className="mb-2 font-mono text-xs uppercase tracking-[0.3em] text-muted">Reserves · {reserves.length}</h2>
      <div className="flex flex-wrap gap-2">
        {reserves.map((player) => (
          /* eslint-disable-next-line @next/next/no-img-element -- direct CDN
             fetch, lazy-loaded outside the viewport, see PlayerChip.tsx */
          <img
            key={player.login}
            src={player.avatarUrl}
            alt={`@${player.login}`}
            title={`@${player.login} · ${pluralize(player.commits, "commit")}`}
            loading="lazy"
            decoding="async"
            className="h-9 w-9 rounded-full ring-1 ring-white/10"
          />
        ))}
      </div>
    </section>
  );
}
