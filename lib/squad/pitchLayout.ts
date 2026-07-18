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

// Broadcast-style landscape orientation: goalkeeper on the left, attack on
// the right, like a pitch seen on TV. Vertical position reuses the same
// touchline-to-touchline mapping pitchPosition() uses for its own left%
// (x drives it either way — this is just relabeled top% here).
//
// Horizontal position is NOT a simple 1:1 transpose of y: the four y-bands
// (lib/squad/formations.ts's FULL_BANDS: gk=0, def=22, mid=56, fwd=94)
// aren't evenly spaced in raw units, so a linear "left = f(y)" formula
// either crushes the defensive line against the center circle or leaves
// the attacking third empty (both were real bugs here). Instead this is a
// piecewise-linear fit through each band's raw y and its target left% —
// GK ~8%, DEF ~30%, MID ~55%, FWD ~82% — so the XI actually fills the
// pitch left-to-right instead of leaving the left half empty. CDM_BAND (40)
// and CAM_BAND (76) fall between existing knots and interpolate sensibly
// without needing their own entry.
const LANDSCAPE_X_KNOTS: readonly [rawY: number, leftPercent: number][] = [
  [0, 8],
  [22, 30],
  [56, 55],
  [94, 82],
];

function interpolateLandscapeLeft(y: number): number {
  const knots = LANDSCAPE_X_KNOTS;
  // Pick the segment [i, i+1] to interpolate within — clamped to the first
  // or last segment when y falls outside the knots' own range (extrapolate
  // along that segment's slope rather than clipping flat).
  let i = 0;
  while (i < knots.length - 2 && y > knots[i + 1][0]) i++;
  const [y0, v0] = knots[i];
  const [y1, v1] = knots[i + 1];
  const t = (y - y0) / (y1 - y0);
  return v0 + t * (v1 - v0);
}

// Every member of the same line (e.g. a back four) shares the same raw y,
// so without this they'd land in a dead-straight vertical column on the
// landscape canvas — tight enough that consecutive nameplates touch. A
// subtle alternating left/right nudge (±4%) staggers them just enough that
// adjacent chips sit on a diagonal instead of directly above/below each
// other, on top of (not instead of) the real vertical spacing fix in the
// export route's own chip sizing. `zigzagIndex` is each starter's index in
// the formation's own slot order (see FORMATIONS/buildDegradedSlots in
// formations.ts) — same-line members are always contiguous there, so
// alternating by index naturally alternates within each line.
const LANDSCAPE_ZIGZAG_PCT = 4;

export function pitchPositionHorizontal(x: number, y: number, zigzagIndex = 0): { left: number; top: number } {
  const zigzag = zigzagIndex % 2 === 0 ? LANDSCAPE_ZIGZAG_PCT : -LANDSCAPE_ZIGZAG_PCT;
  return {
    left: clamp(interpolateLandscapeLeft(y) + zigzag, 0, 100),
    top: toVisualPercent(x, PITCH_INSET_X, PITCH_NUDGE_X),
  };
}
