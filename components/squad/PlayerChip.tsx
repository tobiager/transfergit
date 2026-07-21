"use client";

import { FloatingPortal } from "@floating-ui/react";
import type { SquadPlayer, Starter } from "@/lib/squad";
import { fitUsername } from "@/lib/squad/textFit";
import { pluralize } from "@/lib/format";
import { usePlayerPopover } from "./usePlayerPopover";
import { PlayerPopoverCard } from "./PlayerPopoverCard";
import { PlayerBadges } from "./PlayerBadges";

// Text-fit widths per variant/breakpoint, in px — the chip's actual content
// width once avatar/padding/gaps are subtracted. Pitch chips are a fixed
// Tailwind width (w-14 mobile / sm:w-24 desktop); row chips live in the
// match-center sidebar column (now up to ~420px wide) and the mobile Squad
// tab, so desktop gets extra room to show more of a long login before it
// middle-ellipses. Computed once here so fitUsername can run at render time
// (server or client — it's pure math, no measurement) instead of needing a
// post-mount layout pass.
const FIT_WIDTHS = {
  pitch: { mobile: 48, desktop: 88 },
  row: { mobile: 130, desktop: 200 },
} as const;

type ChipVariant = keyof typeof FIT_WIDTHS;

function UsernameText({
  login,
  variant,
  className,
}: {
  login: string;
  variant: ChipVariant;
  className: string;
}) {
  const widths = FIT_WIDTHS[variant];
  const mobile = fitUsername(login, widths.mobile);
  const desktop = fitUsername(login, widths.desktop);

  return (
    <>
      <span className={`sm:hidden ${className}`} style={{ fontSize: mobile.fontSizePx }}>
        {mobile.text}
      </span>
      <span className={`hidden sm:inline ${className}`} style={{ fontSize: desktop.fontSizePx }}>
        {desktop.text}
      </span>
    </>
  );
}

// Username + market value + commits, always all three, always fully
// readable — the fontSize is pre-computed per breakpoint (see
// UsernameText) so the username never wraps or truncates mid-word; it
// only shrinks, and past USERNAME_MAX_FONT_PX/floor it middle-ellipses.
// The opaque, blurred backing keeps this readable over the pitch's grass
// lines/center circle.
function PlayerNameplate({ player }: { player: SquadPlayer }) {
  const pendingTitle = player.valuationPending ? "valuation pending" : undefined;

  return (
    <span className="flex flex-col items-center rounded-md bg-black/70 px-1.5 py-1 text-center backdrop-blur-sm">
      <UsernameText login={player.login} variant="pitch" className="font-mono leading-tight text-foreground" />
      <span
        title={pendingTitle}
        className="font-display text-[9px] leading-tight text-value-green sm:text-xs"
      >
        {player.marketValueFormatted}
      </span>
      <span className="text-[8px] leading-tight text-muted sm:text-[10px]">{pluralize(player.commits, "commit")}</span>
    </span>
  );
}

export function PlayerChip({
  player,
  isCaptain,
  isMvp,
  variant,
  scale = 1,
}: {
  player: SquadPlayer | Starter;
  isCaptain: boolean;
  isMvp: boolean;
  variant: ChipVariant;
  scale?: number;
}) {
  const { refs, floatingStyles, isOpen, getReferenceProps, getFloatingProps } = usePlayerPopover();
  const role = "position" in player ? player.position.role : null;

  // "row": one-line sidebar entry — avatar, username, value + commits on
  // the same line. No nameplate, no role tag.
  if (variant === "row") {
    return (
      <>
        <button
          type="button"
          ref={(node) => refs.setReference(node)}
          {...getReferenceProps()}
          className="flex w-full items-center gap-2 rounded-lg border border-border bg-surface px-2 py-1.5 text-left transition hover:border-value-green/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-tm-blue-bright"
        >
          <span className="relative shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element -- direct CDN fetch, see below */}
            <img src={player.avatarUrl} alt="" draggable={false} loading="lazy" decoding="async" className={`h-8 w-8 rounded-full ring-2 ${isMvp ? "ring-gold" : "ring-white/10"}`} />
            <PlayerBadges isCaptain={isCaptain} isMvp={isMvp} />
          </span>
          <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <UsernameText login={player.login} variant="row" className="truncate font-mono leading-tight text-foreground" />
            <span
              className="shrink-0 whitespace-nowrap text-right"
              title={player.valuationPending ? "GitHub API is busy — this valuation will fill in automatically" : undefined}
            >
              <span className={`font-display text-[11px] ${player.valuationPending ? "animate-pulse text-muted" : "text-value-green"}`}>
                {player.valuationPending ? "syncing…" : player.marketValueFormatted}
              </span>
              <span className="ml-1.5 text-[9px] text-muted">{pluralize(player.commits, "commit")}</span>
            </span>
          </span>
        </button>

        {isOpen && (
          <FloatingPortal>
            <div
              ref={(node) => refs.setFloating(node)}
              style={floatingStyles}
              {...getFloatingProps()}
              className="z-50 w-60 select-text rounded-lg tm-popover p-4 text-left"
            >
              <PlayerPopoverCard player={player} />
            </div>
          </FloatingPortal>
        )}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        ref={(node) => refs.setReference(node)}
        {...getReferenceProps()}
        // --chip-fit only resolves ≠1 inside a match-center-sized pitch
        // (see .pitch-fit in globals.css); everywhere else this is the
        // designed per-squad-size scale alone.
        style={{ transform: `scale(calc(${scale} * var(--chip-fit, 1)))` }}
        className="flex w-14 flex-col items-center gap-1 rounded-lg px-1 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-tm-blue-bright sm:w-24"
      >
        {role && (
          <span className="rounded-full border border-border bg-surface/90 px-1.5 py-px font-mono text-[8px] uppercase tracking-wider text-muted">
            {role}
          </span>
        )}

        <span className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- direct
              CDN fetch, lazy-loaded outside the viewport; next/image would
              proxy through /_next/image and add server-side latency. */}
          <img
            src={player.avatarUrl}
            alt=""
            draggable={false}
            loading="lazy"
            decoding="async"
            className={`h-10 w-10 rounded-full ring-2 sm:h-[72px] sm:w-[72px] ${isMvp ? "ring-gold" : "ring-white/20"}`}
          />
          <PlayerBadges isCaptain={isCaptain} isMvp={isMvp} />
        </span>

        <PlayerNameplate player={player} />
      </button>

      {isOpen && (
        <FloatingPortal>
          <div
            ref={(node) => refs.setFloating(node)}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-50 w-60 select-text rounded-lg tm-popover p-4 text-left"
          >
            <PlayerPopoverCard player={player} />
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
