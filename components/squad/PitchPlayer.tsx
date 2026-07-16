"use client";

import Image from "next/image";
import { FloatingPortal } from "@floating-ui/react";
import type { Starter } from "@/lib/squad";
import { usePlayerPopover } from "./usePlayerPopover";
import { PlayerPopoverCard } from "./PlayerPopoverCard";
import { PlayerBadges } from "./PlayerBadges";

export function PitchPlayer({
  player,
  isCaptain,
  isMvp,
}: {
  player: Starter;
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
        className="flex w-14 flex-col items-center gap-0.5 rounded-lg px-1 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-tm-blue-bright sm:w-24"
      >
        <span className="relative">
          <Image
            src={player.avatarUrl}
            alt=""
            width={56}
            height={56}
            className={`h-9 w-9 rounded-full ring-2 sm:h-14 sm:w-14 ${isMvp ? "ring-gold" : "ring-white/20"}`}
          />
          <PlayerBadges isCaptain={isCaptain} isMvp={isMvp} />
        </span>
        <span className="w-full break-words text-center font-mono text-[9px] leading-tight text-foreground sm:text-xs">
          {player.login}
        </span>
        <span className="font-display text-[9px] leading-tight text-value-green sm:text-xs">
          {player.marketValueFormatted}
        </span>
        <span className="text-[8px] leading-tight text-muted sm:text-[10px]">{player.commits} commits</span>
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
