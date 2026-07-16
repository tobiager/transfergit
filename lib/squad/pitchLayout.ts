// Pure coordinate math shared by the live pitch (components/squad/SquadPitch.tsx)
// and the exported OG image (app/api/og/squad/[owner]/[repo]/route.tsx), so both
// always place a given formation slot in the exact same spot. No React, no
// server-only — safe to import from a client component, a server component,
// or a route handler.

// Player chips have real width/height, so placing them flush against the
// 0/100 edges of the pitch clips them outside the drawn grass. Insetting the
// usable range keeps every chip's full footprint inside the pitch regardless
// of formation. Tune these first if chips ever clip an edge — smaller inset
// = chips spread closer to the touchlines/goal lines.
export const PITCH_INSET_X = 6;
export const PITCH_INSET_Y = 8;

// Small constant shift applied to every chip after the inset math, purely an
// optical correction (chips visually read a hair low/right of their true
// anchor because their content — avatar + text — hangs below-right of the
// coordinate point). Bump these (more negative = further left/up) if that
// ever looks off again.
export const PITCH_NUDGE_X = -2;
export const PITCH_NUDGE_Y = -2;

function toVisualPercent(value: number, inset: number, nudge: number): number {
  return inset + (value / 100) * (100 - 2 * inset) + nudge;
}

// Converts a formation slot's raw (x, y) — 0-100, y=0 own goal / y=100
// attack — into visual (left, top) percentages of the pitch container, 0-100
// with top=0 at the container's top edge (i.e. already flipped + inset).
export function pitchPosition(x: number, y: number): { left: number; top: number } {
  return {
    left: toVisualPercent(x, PITCH_INSET_X, PITCH_NUDGE_X),
    top: toVisualPercent(100 - y, PITCH_INSET_Y, PITCH_NUDGE_Y),
  };
}
