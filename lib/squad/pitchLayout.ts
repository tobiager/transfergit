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
//
// Full and small-sided pitches get separate insets: small-sided chips render
// up to 1.4x scale (see formations.ts's chipScale) on a court that's wide
// but short, so the same flat margin that's enough for the full 11-a-side
// pitch isn't enough there — see formations.test.ts's bounds test, which
// checks both against each pitch's own real container/chip footprint.
export const PITCH_INSET_X = 8;
export const PITCH_INSET_Y = 9;
export const PITCH_INSET_X_SMALL = 9;
export const PITCH_INSET_Y_SMALL = 9;

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// Converts a formation slot's raw (x, y) — 0-100, y=0 own goal / y=100
// attack — into visual (left, top) percentages of the pitch container, 0-100
// with top=0 at the container's top edge (i.e. already flipped + inset).
// `small` selects the small-sided court's wider insets — pass the same
// isSmallSided(starterCount) check the caller already needs for its own
// pitch-lines/aspect-ratio choice.
export function pitchPosition(x: number, y: number, small = false): { left: number; top: number } {
  const insetX = small ? PITCH_INSET_X_SMALL : PITCH_INSET_X;
  const insetY = small ? PITCH_INSET_Y_SMALL : PITCH_INSET_Y;
  return {
    left: toVisualPercent(x, insetX, PITCH_NUDGE_X),
    top: toVisualPercent(100 - y, insetY, PITCH_NUDGE_Y),
  };
}

// Inverse of pitchPosition: a visual (left%, top%) point — e.g. a drag
// pointer's position over the pitch container — back into raw formation
// (x, y), 0-100, so a dragged chip's position can be stored/encoded in the
// exact same coordinate space the formation tables already use. Always
// clamped to the safe area first by the caller (see clampToSafeArea) — this
// alone doesn't guard against out-of-range input.
export function pitchPositionInverse(leftPct: number, topPct: number, small = false): { x: number; y: number } {
  const insetX = small ? PITCH_INSET_X_SMALL : PITCH_INSET_X;
  const insetY = small ? PITCH_INSET_Y_SMALL : PITCH_INSET_Y;
  const x = ((leftPct - PITCH_NUDGE_X - insetX) / (100 - 2 * insetX)) * 100;
  const rawY = ((topPct - PITCH_NUDGE_Y - insetY) / (100 - 2 * insetY)) * 100;
  return { x: clamp(x, 0, 100), y: clamp(100 - rawY, 0, 100) };
}

// The visual (left%, top%) box no chip's anchor should ever leave — the
// insets above already reserve room for a chip's own footprint (avatar +
// nameplate + role tag) around its center anchor, so clamping into this same
// box is what keeps a dragged chip fully on the grass. Used both by drag
// (SquadPitch.tsx, pixel-space pointer tracking) and available for anything
// else that place a chip from arbitrary/user-controlled coordinates.
export function clampToSafeArea(leftPct: number, topPct: number, small = false): { left: number; top: number } {
  const insetX = small ? PITCH_INSET_X_SMALL : PITCH_INSET_X;
  const insetY = small ? PITCH_INSET_Y_SMALL : PITCH_INSET_Y;
  return {
    left: clamp(leftPct, insetX + PITCH_NUDGE_X, 100 - insetX + PITCH_NUDGE_X),
    top: clamp(topPct, insetY + PITCH_NUDGE_Y, 100 - insetY + PITCH_NUDGE_Y),
  };
}

// Broadcast-style landscape orientation for the social export: goalkeeper on
// the left, attack on the right, like a pitch seen on TV. This is a FAITHFUL
// 90° rotation of the vertical pitch, so whatever arrangement is on screen —
// a standard formation OR a hand-dragged custom layout — reflects at its true
// relative position:
//   - `left` (the attack axis) is a straight LINEAR map of y: a player twice
//     as far up the pitch sits twice as far to the right. The old
//     piecewise-knot remap only matched the four standard formation bands and
//     distorted any custom drag (a player dragged to y=70 didn't land where
//     the pitch put them). The linear map spans a comfortable range so the XI
//     still fills the pitch left-to-right without crushing a line against the
//     center circle.
//   - `top` (the touchline axis) reuses the exact x → visual% mapping the
//     vertical pitch already uses for its own left%.
// No per-line zigzag: same-line members share y (so share `left`) but differ
// in x (so differ in `top`) — the export's own chip height keeps that
// vertical column separated, and staggering it would re-introduce the very
// distortion this faithful rotation removes.
const LANDSCAPE_LEFT_MIN = 9; // GK end (y = 0)
const LANDSCAPE_LEFT_SPAN = 79; // → y = 100 lands at 88%

export function pitchPositionHorizontal(x: number, y: number): { left: number; top: number } {
  return {
    left: LANDSCAPE_LEFT_MIN + (clamp(y, 0, 100) / 100) * LANDSCAPE_LEFT_SPAN,
    top: toVisualPercent(x, PITCH_INSET_X, PITCH_NUDGE_X),
  };
}
