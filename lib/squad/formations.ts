import type { PositionSlot } from "./types";

export type FormationName = string;

export const DEFAULT_FORMATION: FormationName = "433";

// Full-strength squad (11+ human contributors) fields all 11 outfield lines
// on a full vertical pitch. Below that, the XI shrinks to match the repo's
// human contributor count and drops onto a compressed half-pitch below
// SMALL_SIDED_MAX — see isSmallSided().
export const SMALL_SIDED_MAX = 7;

export function isSmallSided(starterCount: number): boolean {
  return starterCount <= SMALL_SIDED_MAX;
}

// Cartesian pitch coordinates, 0-100 on both axes. x: 0 = left touchline,
// 100 = right touchline. y: 0 = own goal line, 100 = opponent's goal line.
//
// Y is banded into four fixed lines, spread across nearly the full 0-100
// range (visually ~90% GK / ~72% DEF / ~45% MID / ~18% FWD down the pitch
// container — see pitchLayout.ts's toVisualPercent for the y -> visual%
// mapping) so every formation — classic or degraded — reads as evenly
// spaced instead of bunching in the middle with dead air near the
// opponent's box. FULL_BANDS covers the full vertical pitch (8-11
// players); SMALL_BANDS covers the compressed small-sided half-pitch (3-7
// players). CDM_BAND/CAM_BAND are extra bands slotted into the gaps for
// the classic formations' defensive/attacking midfielders — see
// components/squad/formations.test.ts's pixel-distance collision test,
// which every formation in this file must satisfy: no two slots closer
// than 1.5x a chip's width in real rendered pixels.
const FULL_BANDS = { gk: 0, def: 22, mid: 56, fwd: 94 };
const CDM_BAND = 40;
const CAM_BAND = 76;
// Small-sided chips render at up to 1.4x scale (see chipScale()) on a court
// that's wide but short — so the gk->fwd spread leans on nearly the entire
// y-range (bigger gaps, especially fwd<->mid, the two most crowded lines)
// rather than SMALL_BANDS mirroring FULL_BANDS' proportions.
const SMALL_BANDS = { gk: 0, def: 33, mid: 66, fwd: 100 };

const GK: PositionSlot = { id: "GK", label: "Goalkeeper", role: "GK", x: 50, y: FULL_BANDS.gk };

// Slot order matters: it's the commit-ranking priority used by roles.ts —
// index 0 gets the most commits (centre-forward), the last slot (always the
// goalkeeper) gets the fewest.
//
// Role-tag mapping per formation (what the position pill shows — see
// components/squad/PlayerChip.tsx). 433 deliberately labels all three
// central midfielders (including its lone defensive one) "CM", keeping the
// tag vocabulary small; formations with a genuinely distinct
// attacking/defensive midfield role (CAM in 4231, CDM in 352/4231) get
// their own tag instead, since those are what a viewer actually needs
// disambiguated:
//   433:  GK, LB, CB, CB, RB, CM, CM, CM, LW, RW, ST
//   442:  GK, LB, CB, CB, RB, LM, CM, CM, RM, ST, ST
//   352:  GK, CB, CB, CB, LWB, CM, CM, RWB, CDM, ST, ST
//   4231: GK, LB, CB, CB, RB, CDM, CDM, CAM, LW, RW, ST
export const FORMATIONS: Record<string, PositionSlot[]> = {
  "433": [
    { id: "ST", label: "Centre-Forward", role: "ST", x: 50, y: FULL_BANDS.fwd + 4 },
    { id: "LW", label: "Left Winger", role: "LW", x: 15, y: FULL_BANDS.fwd },
    { id: "RW", label: "Right Winger", role: "RW", x: 85, y: FULL_BANDS.fwd },
    { id: "CM_R", label: "Right Central Midfielder", role: "CM", x: 75, y: FULL_BANDS.mid },
    { id: "CM_L", label: "Left Central Midfielder", role: "CM", x: 25, y: FULL_BANDS.mid },
    { id: "CDM", label: "Defensive Midfielder", role: "CM", x: 50, y: CDM_BAND },
    { id: "RB", label: "Right-Back", role: "RB", x: 98, y: FULL_BANDS.def },
    { id: "LB", label: "Left-Back", role: "LB", x: 2, y: FULL_BANDS.def },
    { id: "CB_R", label: "Right Centre-Back", role: "CB", x: 66, y: FULL_BANDS.def },
    { id: "CB_L", label: "Left Centre-Back", role: "CB", x: 34, y: FULL_BANDS.def },
    GK,
  ],
  "442": [
    { id: "ST_R", label: "Right Striker", role: "ST", x: 70, y: FULL_BANDS.fwd },
    { id: "ST_L", label: "Left Striker", role: "ST", x: 30, y: FULL_BANDS.fwd },
    { id: "RM", label: "Right Midfielder", role: "RM", x: 96, y: FULL_BANDS.mid },
    { id: "LM", label: "Left Midfielder", role: "LM", x: 4, y: FULL_BANDS.mid },
    { id: "CM_R", label: "Right Central Midfielder", role: "CM", x: 66, y: FULL_BANDS.mid },
    { id: "CM_L", label: "Left Central Midfielder", role: "CM", x: 34, y: FULL_BANDS.mid },
    { id: "RB", label: "Right-Back", role: "RB", x: 96, y: FULL_BANDS.def },
    { id: "LB", label: "Left-Back", role: "LB", x: 4, y: FULL_BANDS.def },
    { id: "CB_R", label: "Right Centre-Back", role: "CB", x: 66, y: FULL_BANDS.def },
    { id: "CB_L", label: "Left Centre-Back", role: "CB", x: 34, y: FULL_BANDS.def },
    GK,
  ],
  "352": [
    { id: "ST_R", label: "Right Striker", role: "ST", x: 68, y: FULL_BANDS.fwd },
    { id: "ST_L", label: "Left Striker", role: "ST", x: 32, y: FULL_BANDS.fwd },
    { id: "RWB", label: "Right Wing-Back", role: "RWB", x: 96, y: FULL_BANDS.mid },
    { id: "LWB", label: "Left Wing-Back", role: "LWB", x: 4, y: FULL_BANDS.mid },
    { id: "CM_R", label: "Right Central Midfielder", role: "CM", x: 66, y: FULL_BANDS.mid },
    { id: "CM_L", label: "Left Central Midfielder", role: "CM", x: 34, y: FULL_BANDS.mid },
    { id: "CDM", label: "Defensive Midfielder", role: "CDM", x: 50, y: CDM_BAND },
    { id: "CB_R", label: "Right Centre-Back", role: "CB", x: 85, y: FULL_BANDS.def },
    { id: "CB_C", label: "Centre-Back", role: "CB", x: 50, y: FULL_BANDS.def },
    { id: "CB_L", label: "Left Centre-Back", role: "CB", x: 15, y: FULL_BANDS.def },
    GK,
  ],
  "4231": [
    { id: "ST", label: "Centre-Forward", role: "ST", x: 50, y: FULL_BANDS.fwd + 4 },
    { id: "RW", label: "Right Winger", role: "RW", x: 85, y: FULL_BANDS.fwd },
    { id: "LW", label: "Left Winger", role: "LW", x: 15, y: FULL_BANDS.fwd },
    { id: "CAM", label: "Attacking Midfielder", role: "CAM", x: 50, y: CAM_BAND },
    { id: "CDM_R", label: "Right Defensive Midfielder", role: "CDM", x: 70, y: CDM_BAND },
    { id: "CDM_L", label: "Left Defensive Midfielder", role: "CDM", x: 30, y: CDM_BAND },
    { id: "RB", label: "Right-Back", role: "RB", x: 98, y: FULL_BANDS.def },
    { id: "LB", label: "Left-Back", role: "LB", x: 2, y: FULL_BANDS.def },
    { id: "CB_R", label: "Right Centre-Back", role: "CB", x: 66, y: FULL_BANDS.def },
    { id: "CB_L", label: "Left Centre-Back", role: "CB", x: 34, y: FULL_BANDS.def },
    GK,
  ],
};

interface DegradedShape {
  name: string;
  def: number;
  mid: number;
  fwd: number;
}

// Formation table by human contributor count, always with a goalkeeper on
// top. Multiple named shapes are offered where there's a real tactical
// choice; single-shape counts get no formation pills (nothing to choose
// between).
//
//   count -> shape(s), def-mid-fwd (+ GK)
//   10 -> 432, 342
//    9 -> 332, 233   (requested 331/232 sum to 8, one short of the 8
//                      outfield slots at this count — adjusted to sum
//                      correctly while keeping each shape's character)
//    8 -> 331
//    7 -> 231, 321   (small-sided from here down)
//    6 -> 221
//    5 -> 121
//    4 -> 111
//    3 -> 11         (bare minimum: GK + one defender + one forward)
const DEGRADE_TABLE: Record<number, DegradedShape[]> = {
  10: [
    { name: "432", def: 4, mid: 3, fwd: 2 },
    { name: "342", def: 3, mid: 4, fwd: 2 },
  ],
  9: [
    { name: "332", def: 3, mid: 3, fwd: 2 },
    { name: "233", def: 2, mid: 3, fwd: 3 },
  ],
  8: [{ name: "331", def: 3, mid: 3, fwd: 1 }],
  7: [
    { name: "231", def: 2, mid: 3, fwd: 1 },
    { name: "321", def: 3, mid: 2, fwd: 1 },
  ],
  6: [{ name: "221", def: 2, mid: 2, fwd: 1 }],
  5: [{ name: "121", def: 1, mid: 2, fwd: 1 }],
  4: [{ name: "111", def: 1, mid: 1, fwd: 1 }],
  3: [{ name: "11", def: 1, mid: 0, fwd: 1 }],
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// Spreads `count` slots evenly across x=4..96 (near edge-to-edge —
// pitchPosition's own inset keeps every chip's footprint clear of the
// touchlines), nudging alternating slots forward/back slightly so the
// line isn't a perfectly straight grid. `xBias` shifts the whole line
// sideways (clamped back into 0..100) — only needed on the small-sided
// court, where two DIFFERENT lines of the same parity (e.g. a 2-man DEF
// and a 2-man MID) would otherwise spread across the exact same x
// positions and collide vertically, relying on a tight y-gap alone. The
// full pitch's y-bands are already far enough apart that its degraded
// shapes (8-10 players) don't need this — see buildDegradedSlots.
function buildLine(
  idPrefix: string,
  labelPrefix: string,
  role: string,
  count: number,
  y: number,
  xBias = 0
): PositionSlot[] {
  if (count === 0) return [];
  return Array.from({ length: count }, (_, i) => {
    const base = count === 1 ? 50 : 4 + (92 / (count - 1)) * i;
    const yOffset = count > 1 && i % 2 === 1 ? 4 : 0;
    return {
      id: `${idPrefix}${i + 1}`,
      label: label(labelPrefix, i, count),
      role,
      x: clamp(base + xBias, 0, 100),
      y: y + yOffset,
    };
  });
}

function label(prefix: string, index: number, total: number): string {
  return total === 1 ? prefix : `${prefix} ${index + 1}`;
}

function buildDegradedSlots(shape: DegradedShape, bands: typeof FULL_BANDS, small: boolean): PositionSlot[] {
  const bias = small ? 17 : 0;
  const forwards = buildLine("FWD", "Forward", "FWD", shape.fwd, bands.fwd);
  const midfielders = buildLine("MID", "Midfielder", "MID", shape.mid, bands.mid, -bias);
  const defenders = buildLine("DEF", "Defender", "DEF", shape.def, bands.def, bias);
  const gk: PositionSlot = { id: "GK", label: "Goalkeeper", role: "GK", x: 50, y: bands.gk };
  // Commit-priority order: attack first, defense last, GK always last.
  return [...forwards, ...midfielders, ...defenders, gk];
}

function clampCount(humanCount: number): number {
  return Math.max(3, Math.min(10, humanCount));
}

export interface FormationOption {
  name: string;
  slots: PositionSlot[];
}

// All selectable formations for a squad of `humanCount` players, in
// display order (first is the default). Length 1 means there's no real
// choice — callers should hide formation pills in that case.
// Plain-numeric object keys ("352", "433"...) get reordered numerically by
// the JS engine, not by insertion order — this list is the source of truth
// for display order (433 default first) instead of Object.keys(FORMATIONS).
const FULL_FORMATION_ORDER: string[] = ["433", "442", "352", "4231"];

export function getFormationOptions(humanCount: number): FormationOption[] {
  if (humanCount >= 11) {
    return FULL_FORMATION_ORDER.map((name) => ({ name, slots: FORMATIONS[name] }));
  }

  const clamped = clampCount(humanCount);
  const small = isSmallSided(clamped);
  const bands = small ? SMALL_BANDS : FULL_BANDS;
  return DEGRADE_TABLE[clamped].map((shape) => ({
    name: shape.name,
    slots: buildDegradedSlots(shape, bands, small),
  }));
}

// Resolves the requested formation name against what's actually available
// for this squad size, falling back to the default (first) option when the
// name is missing, invalid, or was only valid for a different squad size.
export function resolveFormation(humanCount: number, requested?: string): FormationOption {
  const options = getFormationOptions(humanCount);
  return options.find((o) => o.name === requested) ?? options[0];
}

// Chip scale for the live pitch: bigger squads need smaller chips to fit
// eleven-a-side; small squads get room to scale up so a 3-a-side repo
// doesn't look like three dots lost on a full pitch.
export function chipScale(starterCount: number): number {
  if (starterCount >= 11) return 1;
  if (starterCount >= 8) return 1.15;
  return 1.4;
}

// The one non-table formation name: a user-dragged layout (see
// lib/squad/customLayout.ts), distinguished from every real FORMATIONS/
// DEGRADE_TABLE entry (which are always bare digit sequences).
export const CUSTOM_FORMATION = "custom";

// "433" -> "4-3-3", "4231" -> "4-2-3-1" — every real formation name is a bare
// digit sequence (def/mid/[cam/]fwd, one digit each), so this is just
// readable punctuation for display, not a parse of anything structural.
export function formationLabel(name: string): string {
  if (name === CUSTOM_FORMATION) return "Custom";
  return name.split("").join("-");
}

// Kept for the one existing full-strength getFormationSlots(11, name) call
// site (getRepoSquad no longer needs this — it uses resolveFormation — but
// tests exercise it directly).
export function getFormationSlots(humanCount: number, preferred: FormationName = DEFAULT_FORMATION): PositionSlot[] {
  return resolveFormation(humanCount, preferred).slots;
}
