import Link from "next/link";
import type { SquadPlayer } from "@/lib/squad";
import { fitUsername } from "@/lib/squad/textFit";

// Fixed pixel width for the username's own space in the card, once avatar
// (48px) + gaps + market value column are subtracted — mirrors
// PlayerChip.tsx's FIT_WIDTHS pattern so a long login shrinks instead of
// truncating to "Die…".
const USERNAME_FIT_WIDTH_PX = { mobile: 90, desktop: 110 } as const;

function CardUsername({ login }: { login: string }) {
  const mobile = fitUsername(login, USERNAME_FIT_WIDTH_PX.mobile, 14, 11);
  const desktop = fitUsername(login, USERNAME_FIT_WIDTH_PX.desktop, 14, 11);

  return (
    <span className="mt-0.5 block truncate font-mono text-foreground">
      <span className="sm:hidden" style={{ fontSize: mobile.fontSizePx }}>
        {mobile.text}
      </span>
      <span className="hidden sm:inline" style={{ fontSize: desktop.fontSizePx }}>
        {desktop.text}
      </span>
    </span>
  );
}

function RoleBadge({ label, badgeClassName }: { label: string; badgeClassName: string }) {
  return (
    <span className={`shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide ${badgeClassName}`}>
      {label}
    </span>
  );
}

function HighlightCard({
  player,
  isMvp,
  badge,
  badgeClassName,
}: {
  player: SquadPlayer;
  isMvp: boolean;
  badge: string;
  badgeClassName: string;
}) {
  return (
    <Link
      href={`/${player.login}`}
      data-reveal-row
      className="flex items-center gap-3 rounded-xl tm-card px-4 py-3 transition hover:border-value-green/40"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- direct CDN
          fetch, see PlayerChip.tsx */}
      <img
        src={player.avatarUrl}
        alt=""
        loading="lazy"
        decoding="async"
        className={`h-12 w-12 shrink-0 rounded-full ring-2 ${isMvp ? "ring-gold" : "ring-white/20"}`}
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <RoleBadge label={badge} badgeClassName={badgeClassName} />
        </span>
        <CardUsername login={player.login} />
      </span>
      <span className="shrink-0 font-display text-sm text-value-green">{player.marketValueFormatted}</span>
    </Link>
  );
}

export function SquadCaptainMvpCards({ captain, mvp }: { captain: SquadPlayer; mvp: SquadPlayer }) {
  if (captain.login === mvp.login) {
    return (
      <div data-reveal>
        <HighlightCard
          player={captain}
          isMvp
          badge="Captain · MVP"
          badgeClassName="bg-gradient-to-r from-tm-blue-bright to-gold text-pitch"
        />
      </div>
    );
  }

  return (
    <div data-reveal className="grid grid-cols-1 gap-2">
      <HighlightCard player={captain} isMvp={false} badge="Captain" badgeClassName="bg-tm-blue-bright text-pitch" />
      <HighlightCard player={mvp} isMvp badge="MVP" badgeClassName="bg-gold text-pitch" />
    </div>
  );
}
