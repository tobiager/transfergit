import Link from "next/link";
import { Flag } from "@/components/Flag";
import type { SquadPlayer, ReservePlayer } from "@/lib/squad";
import { pluralize } from "@/lib/format";

// Popover content only — the floating-positioned wrapper (ref, style,
// portal) lives in the component that owns the useFloating() refs, so a ref
// never has to cross a component boundary.
//
// Reserves (Tier 2, roster positions 31-100) are never valued — no GitHub
// profile fetch at all (see lib/squad/types.ts, ReservePlayer) — so they
// carry only login/avatarUrl/commits, not followers/stars/country/language.
// "followers" in player narrows to the valued SquadPlayer shape.
export function PlayerPopoverCard({ player }: { player: SquadPlayer | ReservePlayer }) {
  const valued = "followers" in player;

  return (
    <>
      {/* select-all + cursor-text: one click selects the whole username so it
          can be copied straight from the popover — the pitch chip itself is a
          drag handle, so its nameplate can't be text-selected without dragging
          the player; this is the place to grab the name. */}
      <p className="cursor-text select-all font-mono text-sm font-semibold text-foreground">@{player.login}</p>

      {valued ? (
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          <div>
            <dt className="text-muted">Followers</dt>
            <dd className="font-semibold tabular-nums text-foreground">{player.followers}</dd>
          </div>
          <div>
            <dt className="text-muted">Total stars</dt>
            <dd className="font-semibold tabular-nums text-foreground">{player.starsTotal}</dd>
          </div>
          <div>
            <dt className="text-muted">Country</dt>
            <dd className="flex items-center gap-1.5 font-semibold text-foreground">
              <Flag code={player.countryIso2} size={14} />
              <span className="truncate">{player.countryName ?? "Unknown"}</span>
            </dd>
          </div>
          <div>
            <dt className="text-muted">Main language</dt>
            <dd className="truncate font-semibold text-foreground">{player.mainLanguage ?? "—"}</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-2 text-xs text-muted">{pluralize(player.commits, "commit")} · unvalued reserve</p>
      )}

      <div className="mt-3 flex items-center gap-3 border-t border-border pt-2 text-xs">
        <Link href={`/${player.login}`} className="text-value-green hover:underline">
          Transfergit card ↗
        </Link>
        <a
          href={`https://github.com/${player.login}`}
          target="_blank"
          rel="noreferrer"
          className="text-muted hover:text-foreground hover:underline"
        >
          GitHub ↗
        </a>
      </div>
    </>
  );
}
