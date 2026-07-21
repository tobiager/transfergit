"use client";

import { FloatingPortal } from "@floating-ui/react";
import type { ReservePlayer } from "@/lib/squad";
import { usePlayerPopover } from "./usePlayerPopover";
import { PlayerPopoverCard } from "./PlayerPopoverCard";

// Same hover-on-desktop / tap-on-mobile popover as PlayerChip, just around a
// bare 36px avatar instead of a full nameplate chip — the reserves wall has
// no per-player valuation to show inline, only on hover/tap.
export function ReserveAvatar({ player }: { player: ReservePlayer }) {
  const { refs, floatingStyles, isOpen, getReferenceProps, getFloatingProps } = usePlayerPopover();

  return (
    <>
      <button
        type="button"
        ref={(node) => refs.setReference(node)}
        {...getReferenceProps()}
        className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-tm-blue-bright"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- direct CDN fetch, see PlayerChip.tsx */}
        <img
          src={player.avatarUrl}
          alt={`@${player.login}`}
          loading="lazy"
          decoding="async"
          className="h-9 w-9 rounded-full ring-1 ring-white/10"
        />
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
