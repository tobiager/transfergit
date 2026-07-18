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
// Tailwind width (w-14 mobile / sm:w-24 desktop); bench chips are a fixed
// w-36 on the mobile scroll strip and an approximate 2-col grid cell width
// on desktop. Computed once here so fitUsername can run at render time
// (server or client — it's pure math, no measurement) instead of needing a
// post-mount layout pass.
const FIT_WIDTHS = {
  pitch: { mobile: 48, desktop: 88 },
  bench: { mobile: 88, desktop: 132 },
} as const;

function UsernameText({
  login,
  variant,
  className,
}: {
  login: string;
  variant: "pitch" | "bench";
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
// `nameplate` adds an opaque, blurred backing so this reads over the
// pitch's grass lines/center circle, not just a plain card background.
function PlayerNameplate({
  player,
  variant,
  nameplate,
}: {
  player: SquadPlayer;
  variant: "pitch" | "bench";
  nameplate: boolean;
}) {
  const pendingTitle = player.valuationPending ? "valuation pending" : undefined;

  return (
    <span
      className={`flex flex-col ${variant === "pitch" ? "items-center text-center" : "items-start text-left"} ${
        nameplate ? "rounded-md bg-black/70 px-1.5 py-1 backdrop-blur-sm" : ""
      }`}
    >
      <UsernameText login={player.login} variant={variant} className="font-mono leading-tight text-foreground" />
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
  variant: "pitch" | "bench";
  scale?: number;
}) {
  const { refs, floatingStyles, isOpen, getReferenceProps, getFloatingProps } = usePlayerPopover();
  const role = "position" in player ? player.position.role : null;

  return (
    <>
      <button
        type="button"
        ref={(node) => refs.setReference(node)}
        {...getReferenceProps()}
        style={variant === "pitch" && scale !== 1 ? { transform: `scale(${scale})` } : undefined}
        className={
          variant === "pitch"
            ? "flex w-14 flex-col items-center gap-1 rounded-lg px-1 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-tm-blue-bright sm:w-24"
            : "flex w-full items-center gap-2 rounded-lg border border-border bg-surface px-2 py-2 text-left transition hover:border-value-green/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-tm-blue-bright"
        }
      >
        {variant === "pitch" && role && (
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
            loading="lazy"
            decoding="async"
            className={
              variant === "pitch"
                ? `h-10 w-10 rounded-full ring-2 sm:h-[72px] sm:w-[72px] ${isMvp ? "ring-gold" : "ring-white/20"}`
                : `h-8 w-8 rounded-full ring-2 ${isMvp ? "ring-gold" : "ring-white/10"}`
            }
          />
          <PlayerBadges isCaptain={isCaptain} isMvp={isMvp} />
        </span>

        <PlayerNameplate player={player} variant={variant} nameplate={variant === "pitch"} />
      </button>

      {isOpen && (
        <FloatingPortal>
          <div
            ref={(node) => refs.setFloating(node)}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-50 w-60 rounded-lg tm-card p-4 text-left"
          >
            <PlayerPopoverCard player={player} />
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
