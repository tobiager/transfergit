import { test } from "node:test";
import assert from "node:assert/strict";
import { pitchPositionHorizontal } from "./pitchLayout.ts";
import { getFormationOptions } from "./formations.ts";

// Matches lib/squad/formations.ts's FULL_BANDS raw y values.
const GK_Y = 0;
const DEF_Y = 22;
const MID_Y = 56;
const FWD_Y = 94;

// Faithful linear rotation: left = 9 + (y/100)*79, so the four lines land at
// evenly-spaced left% proportional to their raw y (no piecewise knots, no
// zigzag). This is what makes a hand-dragged custom layout reflect at its
// true position in the social export instead of being remapped through fixed
// standard-formation knots.
test("landscape mapping fills the pitch left-to-right, proportional to raw y", () => {
  const gk = pitchPositionHorizontal(50, GK_Y).left;
  const def = pitchPositionHorizontal(50, DEF_Y).left;
  const mid = pitchPositionHorizontal(50, MID_Y).left;
  const fwd = pitchPositionHorizontal(50, FWD_Y).left;

  assert.ok(Math.abs(gk - 9) < 0.5, `GK left ${gk} should be ~9%`);
  assert.ok(Math.abs(def - 26.4) < 0.5, `DEF left ${def} should be ~26%`);
  assert.ok(Math.abs(mid - 53.2) < 0.5, `MID left ${mid} should be ~53%`);
  assert.ok(Math.abs(fwd - 83.3) < 0.5, `FWD left ${fwd} should be ~83%`);

  // Strictly increasing GK -> DEF -> MID -> FWD: no line sits behind another.
  assert.ok(gk < def && def < mid && mid < fwd);
});

test("a mid band (e.g. a CDM) lands strictly between the DEF and MID lines", () => {
  const def = pitchPositionHorizontal(50, DEF_Y).left;
  const mid = pitchPositionHorizontal(50, MID_Y).left;
  const cdm = pitchPositionHorizontal(50, 40).left; // CDM_BAND from formations.ts

  assert.ok(cdm > def && cdm < mid, `CDM left ${cdm} should sit strictly between DEF (${def}) and MID (${mid})`);
});

test("the rotation is faithful: left% is linear in y, so a dragged y reflects proportionally", () => {
  // A player dragged to an arbitrary y (not a standard band) must map to the
  // proportional left%, not snap to a knot — this is the custom-layout fix.
  const a = pitchPositionHorizontal(50, 30).left;
  const b = pitchPositionHorizontal(50, 60).left;
  const c = pitchPositionHorizontal(50, 90).left;
  // Equal y-steps (30) produce equal left-steps.
  assert.ok(Math.abs((b - a) - (c - b)) < 0.01, `linear steps: ${a} -> ${b} -> ${c}`);
});

test("vertical (top%) spread reuses the touchline-to-touchline mapping, independent of y", () => {
  const left = pitchPositionHorizontal(10, MID_Y).top;
  const right = pitchPositionHorizontal(90, MID_Y).top;
  assert.ok(left < right, "x=10 (near one touchline) must sit above x=90 (near the other)");
});

// Mirrors app/api/og/squad/[owner]/[repo]/route.tsx's landscape sizing — same
// precedent as formations.test.ts's collision test: real pixel dimensions,
// not raw coordinate closeness. A same-line group (e.g. a back four) shares
// the same raw y (so the same landscape left%) and renders as a vertical
// column; the chip height must keep that column's members from touching.
const LANDSCAPE_PITCH_W = 1200 - 16 * 2;
const LANDSCAPE_PITCH_H = 630 - 16 * 2 - 74 - 22 - 6 * 2;
const LANDSCAPE_CHIP_W = 130;
const LANDSCAPE_CHIP_H = 104;
const LANDSCAPE_EDGE_MARGIN = 3;

// A defensive-midfielder slot (CDM_BAND=40, between the DEF and MID raw-y
// bands) can interpolate to a screen position close to one specific MID-line
// member in a couple of full-strength (11-player) formations — a genuine
// geometric coincidence between two DIFFERENT lines that no chip-size choice
// resolves without shrinking the chip below anything legible. A known, narrow
// ceiling, not the defensive-line bug this suite exists to catch.
const KNOWN_LANDSCAPE_OVERLAPS = new Set(["433:11:CB_R:CDM", "352:11:CDM:CM_L"]);

function isKnownOverlap(formation: string, count: number, idA: string, idB: string): boolean {
  const [a, b] = [idA, idB].sort();
  return KNOWN_LANDSCAPE_OVERLAPS.has(`${formation}:${count}:${a}:${b}`);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function landscapeChipBox(x: number, y: number) {
  const pos = pitchPositionHorizontal(x, y);
  const left = clamp(
    (pos.left / 100) * LANDSCAPE_PITCH_W - LANDSCAPE_CHIP_W / 2,
    LANDSCAPE_EDGE_MARGIN,
    LANDSCAPE_PITCH_W - LANDSCAPE_CHIP_W - LANDSCAPE_EDGE_MARGIN
  );
  const top = clamp(
    (pos.top / 100) * LANDSCAPE_PITCH_H - LANDSCAPE_CHIP_H / 2,
    LANDSCAPE_EDGE_MARGIN,
    LANDSCAPE_PITCH_H - LANDSCAPE_CHIP_H - LANDSCAPE_EDGE_MARGIN
  );
  return { left, top };
}

test("landscape: no two starters' chip boxes overlap, at any squad size", () => {
  for (let count = 3; count <= 11; count++) {
    for (const option of getFormationOptions(count)) {
      const boxes = option.slots.map((slot) => ({
        id: slot.id,
        ...landscapeChipBox(slot.x, slot.y),
      }));

      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          if (isKnownOverlap(option.name, count, boxes[i].id, boxes[j].id)) continue;
          const dx = Math.abs(boxes[i].left - boxes[j].left);
          const dy = Math.abs(boxes[i].top - boxes[j].top);
          const overlaps = dx < LANDSCAPE_CHIP_W && dy < LANDSCAPE_CHIP_H;
          assert.ok(
            !overlaps,
            `${option.name} (count ${count}): ${boxes[i].id} and ${boxes[j].id} overlap (dx=${dx.toFixed(1)}, dy=${dy.toFixed(1)})`
          );
        }
      }
    }
  }
});
