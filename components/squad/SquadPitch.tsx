"use client";

import { useCallback, useRef, useState } from "react";
import type { Starter } from "@/lib/squad";
import { pitchPosition, pitchPositionInverse, clampToSafeArea } from "@/lib/squad/pitchLayout";
import { isSmallSided, chipScale } from "@/lib/squad/formations";
import { PlayerChip } from "./PlayerChip";

// Real pitch proportions (68m wide x 105m long), drawn vertically:
// attack faces up, the goalkeeper's box sits at the bottom.
function FullPitchLines() {
  return (
    <svg viewBox="0 0 68 105" className="absolute inset-0 h-full w-full" aria-hidden preserveAspectRatio="none">
      <g fill="none" stroke="var(--grid-line)" strokeWidth="0.4">
        <rect x="1" y="1" width="66" height="103" rx="2" />
        <line x1="1" y1="52.5" x2="67" y2="52.5" />
        <circle cx="34" cy="52.5" r="9.15" />
        <circle cx="34" cy="52.5" r="0.4" fill="var(--grid-line)" />
        {/* Bottom penalty area — goalkeeper's end */}
        <rect x="13.85" y="88.5" width="40.3" height="16.5" />
        <rect x="24.85" y="99" width="18.3" height="6" />
        {/* Top penalty area — attacking end */}
        <rect x="13.85" y="0" width="40.3" height="16.5" />
        <rect x="24.85" y="0" width="18.3" height="6" />
      </g>
    </svg>
  );
}

// Small-sided (futsal-style) half-pitch: one penalty box at the bottom, the
// halfway line near the top instead of a second box — a 3-7 player squad
// fields on this half instead of looking lost on a full 11-a-side pitch.
function SmallPitchLines() {
  return (
    <svg viewBox="0 0 68 51" className="absolute inset-0 h-full w-full" aria-hidden preserveAspectRatio="none">
      <g fill="none" stroke="var(--grid-line)" strokeWidth="0.4">
        <rect x="1" y="1" width="66" height="49" rx="2" />
        <line x1="1" y1="3" x2="67" y2="3" />
        <path d="M 20 3 A 14 14 0 0 0 48 3" />
        {/* Penalty area — goalkeeper's end */}
        <rect x="13.85" y="34.5" width="40.3" height="16.5" />
        <rect x="24.85" y="45" width="18.3" height="6" />
      </g>
    </svg>
  );
}

// Touch needs a deliberate hold before a drag activates, so a normal
// vertical swipe over the pitch still scrolls the page — only a press that
// lingers past this window (without wandering off) commits to a drag.
const TOUCH_HOLD_MS = 300;
// Below this many px of movement, a pointerdown/up pair is a tap (open the
// popover) or, on touch, a scroll — not a drag. Applies before a drag is
// active, for every pointer type: a mouse click on a chip must not flip the
// formation to Custom just because pointerdown/up fired.
const MOVE_THRESHOLD_PX = 6;

export function SquadPitch({
  starters,
  captainLogin,
  mvpLogin,
  onDragStart,
  onDragEnd,
}: {
  starters: Starter[];
  captainLogin: string;
  mvpLogin: string;
  // Fired once, the moment a drag actually activates (not on every
  // pointerdown) — the caller uses this to flip the active formation pill
  // to Custom. Omitted entirely disables dragging (e.g. static exports).
  onDragStart?: () => void;
  // Fired when a drag ends with the slot's new raw (x, y) — 0-100, same
  // space the formation tables use — already safe-area clamped.
  onDragEnd?: (slotId: string, x: number, y: number) => void;
}) {
  const smallSided = isSmallSided(starters.length);
  const scale = chipScale(starters.length);
  const draggable = Boolean(onDragStart && onDragEnd);

  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingSlotId, setDraggingSlotId] = useState<string | null>(null);

  // All drag bookkeeping lives in refs, not state — pointermove can fire at
  // 60fps+ and none of this needs to trigger a re-render; only the eventual
  // draggingSlotId (for the tween-off/scale class) does.
  const holdTimerRef = useRef<number | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const activeSlotRef = useRef<string | null>(null);
  const suppressClickRef = useRef(false);

  const clearHoldTimer = useCallback(() => {
    if (holdTimerRef.current != null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const applyPosition = useCallback(
    (slotId: string, clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return null;
      const rect = container.getBoundingClientRect();
      const rawLeft = ((clientX - rect.left) / rect.width) * 100;
      const rawTop = ((clientY - rect.top) / rect.height) * 100;
      const { left, top } = clampToSafeArea(rawLeft, rawTop, smallSided);
      const el = container.querySelector<HTMLElement>(`[data-slot-id="${slotId}"]`);
      if (el) {
        el.style.left = `${left}%`;
        el.style.top = `${top}%`;
      }
      return { left, top };
    },
    [smallSided]
  );

  const activateDrag = useCallback(
    (slotId: string) => {
      activeSlotRef.current = slotId;
      setDraggingSlotId(slotId);
      onDragStart?.();
    },
    [onDragStart]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, slotId: string) => {
      if (!draggable) return;
      startPointRef.current = { x: e.clientX, y: e.clientY };
      if (e.pointerType === "touch") {
        clearHoldTimer();
        holdTimerRef.current = window.setTimeout(() => {
          holdTimerRef.current = null;
          (e.target as Element).setPointerCapture?.(e.pointerId);
          activateDrag(slotId);
        }, TOUCH_HOLD_MS);
      }
      // Mouse/pen: no capture yet — a plain click must still reach
      // PlayerChip's own button. Drag activates on the first real move.
    },
    [draggable, clearHoldTimer, activateDrag]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, slotId: string) => {
      if (!draggable) return;

      if (activeSlotRef.current === slotId) {
        e.preventDefault();
        applyPosition(slotId, e.clientX, e.clientY);
        return;
      }

      const start = startPointRef.current;
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.hypot(dx, dy) < MOVE_THRESHOLD_PX) return;

      if (e.pointerType === "touch") {
        // Moved before the hold completed — this is a scroll, not a drag.
        clearHoldTimer();
        startPointRef.current = null;
        return;
      }

      // Mouse/pen: the move itself is the drag start.
      clearHoldTimer();
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      activateDrag(slotId);
      applyPosition(slotId, e.clientX, e.clientY);
    },
    [draggable, applyPosition, clearHoldTimer, activateDrag]
  );

  const endInteraction = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, slotId: string) => {
      clearHoldTimer();
      startPointRef.current = null;
      if (activeSlotRef.current !== slotId) return;

      activeSlotRef.current = null;
      setDraggingSlotId(null);
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);

      const result = applyPosition(slotId, e.clientX, e.clientY);
      if (result) {
        const { x, y } = pitchPositionInverse(result.left, result.top, smallSided);
        onDragEnd?.(slotId, x, y);
      }
    },
    [applyPosition, clearHoldTimer, onDragEnd, smallSided]
  );

  const handleClickCapture = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (suppressClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  return (
    <div
      ref={containerRef}
      data-reveal
      className={`relative mx-auto w-full rounded-xl border border-border bg-pitch-elevated ${
        smallSided ? "aspect-[4/3] max-w-[40rem]" : "aspect-[68/118] max-w-[36rem]"
      }`}
    >
      {smallSided ? <SmallPitchLines /> : <FullPitchLines />}

      {starters.map((player) => {
        const pos = pitchPosition(player.position.x, player.position.y, smallSided);
        const slotId = player.position.id;
        const isDragging = draggingSlotId === slotId;
        return (
          <div
            key={player.login}
            data-slot-id={slotId}
            data-reveal-row
            className={`absolute -translate-x-1/2 -translate-y-1/2 ${
              isDragging ? "z-10 touch-none scale-105 drop-shadow-lg" : "transition-all duration-500 ease-out"
            }`}
            style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
            onPointerDown={draggable ? (e) => handlePointerDown(e, slotId) : undefined}
            onPointerMove={draggable ? (e) => handlePointerMove(e, slotId) : undefined}
            onPointerUp={draggable ? (e) => endInteraction(e, slotId) : undefined}
            onPointerCancel={draggable ? (e) => endInteraction(e, slotId) : undefined}
            onClickCapture={draggable ? handleClickCapture : undefined}
          >
            <PlayerChip
              player={player}
              variant="pitch"
              isCaptain={player.login === captainLogin}
              isMvp={player.login === mvpLogin}
              scale={scale}
            />
          </div>
        );
      })}
    </div>
  );
}
