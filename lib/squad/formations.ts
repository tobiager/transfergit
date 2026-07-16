import type { PositionSlot } from "./types";

export type FormationName = "433" | "442" | "352" | "4231";

export const DEFAULT_FORMATION: FormationName = "433";

// Cartesian pitch coordinates, 0-100 on both axes. x: 0 = left touchline,
// 100 = right touchline. y: 0 = own goal line, 100 = opponent's goal line.
//
// Slot order matters: it's the commit-ranking priority used by roles.ts —
// index 0 gets the most commits (centre-forward), the last slot (always the
// goalkeeper) gets the fewest.
//
// COORDINATES ARE GRID-BASED, NOT FREEHAND — SquadPitch.tsx renders each
// player as a real chip (avatar + text), so both axes need real clearance:
//   - Y: each formation has a fixed number of horizontal "lines" (GK, back
//     line, midfield, attack), each at least ~18 y-units from its neighbor
//     line so chips stacked vertically don't overlap.
//   - X: players in the SAME line need real horizontal room too — a line
//     of 4-5 players spread across the full 0-100 width, not squeezed into
//     the middle, or their chips collide sideways. 433/442/352 follow the
//     classic reference diagrams for this reason: an evenly-spread back
//     line, an evenly-spread midfield line close to the full width, and a
//     tight pair/trio of forwards centered near the top.
// If you add a formation or move a slot, keep it on an existing line (or
// space a new line ~18 y-units from its neighbors) and keep same-line
// players spread across most of the 0-100 x-range rather than clustered.
// If chips ever look cramped, the other two knobs are in SquadPitch.tsx:
// INSET_X/INSET_Y (how close to the edges chips are allowed to sit) and
// the chip's own size in PitchPlayer.tsx / BenchPlayer.tsx.
export const FORMATIONS: Record<FormationName, PositionSlot[]> = {
  "433": [
    // Bands: GK 4 · back four 22 (x: 4/34/66/96) · pivot 43 · CM 60 (x: 22/50/78) · front three 90-94
    { id: "ST", label: "Centre-Forward", x: 50, y: 94 },
    { id: "LW", label: "Left Winger", x: 20, y: 88 },
    { id: "RW", label: "Right Winger", x: 80, y: 88 },
    { id: "CM_R", label: "Right Central Midfielder", x: 78, y: 60 },
    { id: "CM_L", label: "Left Central Midfielder", x: 22, y: 60 },
    { id: "CDM", label: "Defensive Midfielder", x: 50, y: 43 },
    { id: "RB", label: "Right-Back", x: 96, y: 22 },
    { id: "LB", label: "Left-Back", x: 4, y: 22 },
    { id: "CB_R", label: "Right Centre-Back", x: 66, y: 22 },
    { id: "CB_L", label: "Left Centre-Back", x: 34, y: 22 },
    { id: "GK", label: "Goalkeeper", x: 50, y: 4 },
  ],
  "442": [
    // Bands: GK 4 · back four 22 (x: 4/34/66/96) · midfield four 55 (x: 4/34/66/96) · front two 90-94
    { id: "ST_R", label: "Right Striker", x: 60, y: 94 },
    { id: "ST_L", label: "Left Striker", x: 40, y: 90 },
    { id: "RM", label: "Right Midfielder", x: 96, y: 55 },
    { id: "LM", label: "Left Midfielder", x: 4, y: 55 },
    { id: "CM_R", label: "Right Central Midfielder", x: 66, y: 55 },
    { id: "CM_L", label: "Left Central Midfielder", x: 34, y: 55 },
    { id: "RB", label: "Right-Back", x: 96, y: 22 },
    { id: "LB", label: "Left-Back", x: 4, y: 22 },
    { id: "CB_R", label: "Right Centre-Back", x: 66, y: 22 },
    { id: "CB_L", label: "Left Centre-Back", x: 34, y: 22 },
    { id: "GK", label: "Goalkeeper", x: 50, y: 4 },
  ],
  "352": [
    // Bands: GK 4 · back three 22 (x: 30/50/70) · midfield five 55 (x: 4/26/50/74/96) · front two 90-94
    { id: "ST_R", label: "Right Striker", x: 58, y: 94 },
    { id: "ST_L", label: "Left Striker", x: 42, y: 90 },
    { id: "RWB", label: "Right Wing-Back", x: 96, y: 55 },
    { id: "LWB", label: "Left Wing-Back", x: 4, y: 55 },
    { id: "CM_R", label: "Right Central Midfielder", x: 74, y: 55 },
    { id: "CM_L", label: "Left Central Midfielder", x: 26, y: 55 },
    { id: "CDM", label: "Defensive Midfielder", x: 50, y: 55 },
    { id: "CB_R", label: "Right Centre-Back", x: 70, y: 22 },
    { id: "CB_C", label: "Centre-Back", x: 50, y: 22 },
    { id: "CB_L", label: "Left Centre-Back", x: 30, y: 22 },
    { id: "GK", label: "Goalkeeper", x: 50, y: 4 },
  ],
  "4231": [
    // Bands: GK 4 · back four ~21-25 · double pivot ~41-43 · CAM 61 · wide ~78-80 · ST 99
    { id: "ST", label: "Centre-Forward", x: 50, y: 99 },
    { id: "RW", label: "Right Winger", x: 84, y: 80 },
    { id: "LW", label: "Left Winger", x: 16, y: 78 },
    { id: "CAM", label: "Attacking Midfielder", x: 50, y: 61 },
    { id: "CDM_R", label: "Right Defensive Midfielder", x: 60, y: 43 },
    { id: "CDM_L", label: "Left Defensive Midfielder", x: 40, y: 41 },
    { id: "RB", label: "Right-Back", x: 90, y: 25 },
    { id: "LB", label: "Left-Back", x: 10, y: 23 },
    { id: "CB_R", label: "Right Centre-Back", x: 64, y: 21 },
    { id: "CB_L", label: "Left Centre-Back", x: 36, y: 21 },
    { id: "GK", label: "Goalkeeper", x: 50, y: 4 },
  ],
};

// Automatic downgrade when the repo has fewer than 11 human contributors.
// Shape is defenders-midfielders-forwards; the goalkeeper is always an
// extra +1 on top, EXCEPT at the very bottom (3 players) where there are
// only enough humans for a keeper + 2 outfield players.
//
//   humans -> D-M-F (+ GK, except *)
//   11 -> 4-3-3 (one of FORMATIONS, selectable, default "433")
//   10 -> 4-2-3   (drop a midfielder)
//    9 -> 3-2-3   (drop a defender)
//    8 -> 3-2-2   (drop a forward)
//    7 -> 2-3-1   (drop a defender, add a midfielder back)
//    6 -> 2-2-1   (drop a midfielder)
//    5 -> 2-1-1   (drop a midfielder)
//    4 -> 1-1-1   (drop a defender)
//    3*-> 1-0-1   (bare minimum: GK + one defender + one forward)
const DEGRADE_TABLE: Record<number, { def: number; mid: number; fwd: number }> = {
  10: { def: 4, mid: 2, fwd: 3 },
  9: { def: 3, mid: 2, fwd: 3 },
  8: { def: 3, mid: 2, fwd: 2 },
  7: { def: 2, mid: 3, fwd: 1 },
  6: { def: 2, mid: 2, fwd: 1 },
  5: { def: 2, mid: 1, fwd: 1 },
  4: { def: 1, mid: 1, fwd: 1 },
  3: { def: 1, mid: 0, fwd: 1 },
};

function label(prefix: string, index: number, total: number): string {
  return total === 1 ? prefix : `${prefix} ${index + 1}`;
}

// Spreads `count` slots evenly across the pitch width, nudging alternating
// slots forward/back slightly so the line isn't a perfectly straight grid.
function buildLine(idPrefix: string, labelPrefix: string, count: number, y: number): PositionSlot[] {
  if (count === 0) return [];
  return Array.from({ length: count }, (_, i) => {
    const x = count === 1 ? 50 : (100 / (count + 1)) * (i + 1);
    const yOffset = count > 1 && i % 2 === 1 ? 4 : 0;
    return { id: `${idPrefix}${i + 1}`, label: label(labelPrefix, i, count), x, y: y + yOffset };
  });
}

function buildDegradedFormation(def: number, mid: number, fwd: number): PositionSlot[] {
  const forwards = buildLine("FWD", "Forward", fwd, 88);
  const midfielders = buildLine("MID", "Midfielder", mid, 55);
  const defenders = buildLine("DEF", "Defender", def, 20);
  const gk: PositionSlot = { id: "GK", label: "Goalkeeper", x: 50, y: 5 };
  // Commit-priority order: attack first, defense last, GK always last.
  return [...forwards, ...midfielders, ...defenders, gk];
}

// Returns the ordered position slots for a squad of `humanCount` players
// (commit-priority order, GK last). Uses one of the classic formations at
// 11+, otherwise degrades per DEGRADE_TABLE down to a 3-player minimum.
export function getFormationSlots(
  humanCount: number,
  preferred: FormationName = DEFAULT_FORMATION
): PositionSlot[] {
  if (humanCount >= 11) return FORMATIONS[preferred];

  const clamped = Math.max(3, Math.min(10, humanCount));
  const shape = DEGRADE_TABLE[clamped];
  return buildDegradedFormation(shape.def, shape.mid, shape.fwd);
}
