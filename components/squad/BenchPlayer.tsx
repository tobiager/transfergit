"use client";

import Image from "next/image";
import { FloatingPortal } from "@floating-ui/react";
import type { SquadPlayer } from "@/lib/squad";
import { usePlayerPopover } from "./usePlayerPopover";
import { PlayerPopoverCard } from "./PlayerPopoverCard";
import { PlayerBadges } from "./PlayerBadges";

export function BenchPlayer({
  player,
  isCaptain,
  isMvp,
}: {
  player: SquadPlayer;
  isCaptain: boolean;
  isMvp: boolean;
}) {
  const { refs, floatingStyles, isOpen, getReferenceProps, getFloatingProps } = usePlayerPopover();

  return (
    <>
      <button
        type="button"
        ref={(node) => refs.setReference(node)}
        {...getReferenceProps()}
        className="flex w-full items-center gap-2 rounded-lg border border-border bg-surface px-2 py-2 text-left transition hover:border-value-green/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-tm-blue-bright"
      >
        <span className="relative shrink-0">
          <Image
            src={player.avatarUrl}
            alt=""
            width={32}
            height={32}
            className={`h-8 w-8 rounded-full ring-2 ${isMvp ? "ring-gold" : "ring-white/10"}`}
          />
          <PlayerBadges isCaptain={isCaptain} isMvp={isMvp} />
        </span>
        <span className="min-w-0">
          <span className="block break-words font-mono text-xs text-foreground">{player.login}</span>
          <span className="block font-display text-xs text-value-green">{player.marketValueFormatted}</span>
        </span>
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
