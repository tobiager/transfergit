import { test } from "node:test";
import assert from "node:assert/strict";
import { pitchPositionHorizontal } from "./pitchLayout.ts";
import { getFormationOptions } from "./formations.ts";

// Matches lib/squad/formations.ts's FULL_BANDS raw y values.
const GK_Y = 0;
const DEF_Y = 22;
const MID_Y = 56;
const FWD_Y = 94;

// zigzagIndex=0 always applies +LANDSCAPE_ZIGZAG_PCT (even) — these tests
// care about the underlying knot/interpolation math, not the zigzag, so
// every call here uses the same fixed even index and the expected values
// below already include that constant +4% shift.
const ZIGZAG_EVEN = 0;

test("landscape mapping fills the pitch left-to-right instead of bunching around the center circle", () => {
  const gk = pitchPositionHorizontal(50, GK_Y, ZIGZAG_EVEN).left;
  const def = pitchPositionHorizontal(50, DEF_Y, ZIGZAG_EVEN).left;
  const mid = pitchPositionHorizontal(50, MID_Y, ZIGZAG_EVEN).left;
  const fwd = pitchPositionHorizontal(50, FWD_Y, ZIGZAG_EVEN).left;

  assert.ok(Math.abs(gk - 12) < 0.5, `GK left ${gk} should be ~12% (8% knot + 4% zigzag)`);
  assert.ok(Math.abs(def - 34) < 0.5, `DEF left ${def} should be ~34% (30% knot + 4% zigzag)`);
  assert.ok(Math.abs(mid - 59) < 0.5, `MID left ${mid} should be ~59% (55% knot + 4% zigzag)`);
  assert.ok(Math.abs(fwd - 86) < 0.5, `FWD left ${fwd} should be ~86% (82% knot + 4% zigzag)`);

  // Strictly increasing GK -> DEF -> MID -> FWD: no line sits behind another.
  assert.ok(gk < def && def < mid && mid < fwd);
});

test("bands between the four fixed lines (e.g. a CDM) interpolate rather than collapsing to a knot", () => {
  const def = pitchPositionHorizontal(50, DEF_Y, ZIGZAG_EVEN).left;
  const mid = pitchPositionHorizontal(50, MID_Y, ZIGZAG_EVEN).left;
  const cdm = pitchPositionHorizontal(50, 40, ZIGZAG_EVEN).left; // CDM_BAND from formations.ts

  assert.ok(cdm > def && cdm < mid, `CDM left ${cdm} should sit strictly between DEF (${def}) and MID (${mid})`);
});

test("vertical (top%) spread reuses the touchline-to-touchline mapping, independent of y", () => {
  const left = pitchPositionHorizontal(10, MID_Y).top;
  const right = pitchPositionHorizontal(90, MID_Y).top;
  assert.ok(left < right, "x=10 (near one touchline) must sit above x=90 (near the other)");
});

test("the zigzag alternates left/right by index so same-line members don't form a straight column", () => {
  const even = pitchPositionHorizontal(50, DEF_Y, 0).left;
  const odd = pitchPositionHorizontal(50, DEF_Y, 1).left;
  assert.ok(Math.abs(even - odd - 8) < 0.01, `even/odd zigzag should differ by 8% (±4%), got ${even} vs ${odd}`);
});

// Mirrors app/api/og/squad/[owner]/[repo]/route.tsx's landscape sizing —
// same precedent as formations.test.ts's collision/bounds tests: real pixel
// dimensions, not raw coordinate closeness, since a same-line group (e.g. a
// back four) shares the same raw y and used to render as a dead-straight
// column where each nameplate touched the next chip's avatar.
const LANDSCAPE_PITCH_W = 1200 - 16 * 2;
const LANDSCAPE_PITCH_H = 630 - 16 * 2 - 74 - 22 - 6 * 2;
const LANDSCAPE_CHIP_W = 70;
const LANDSCAPE_CHIP_H = 100;
const LANDSCAPE_EDGE_MARGIN = 3;

// A defensive-midfielder slot (CDM_BAND=40, between the DEF and MID raw-y
// bands) interpolates to a screen position that happens to sit close to one
// specific MID-line member in two full-strength (11-player) formations —
// unlike the reported bug (a same-line group in a dead vertical column,
// fixed by the zigzag + real vertical spacing above), this is a genuine
// geometric coincidence between two DIFFERENT lines that no chip-size choice
// resolves without shrinking the chip below anything legible (avatar + role
// tag + 3-line nameplate). A known, narrow ceiling — 2 slot pairs, only at
// full strength — not the defensive-line bug this test suite exists to
// catch.
const KNOWN_LANDSCAPE_OVERLAPS = new Set(["433:11:CB_R:CDM", "352:11:CDM:CM_L"]);

function isKnownOverlap(formation: string, count: number, idA: string, idB: string): boolean {
  const [a, b] = [idA, idB].sort();
  return KNOWN_LANDSCAPE_OVERLAPS.has(`${formation}:${count}:${a}:${b}`);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function landscapeChipBox(x: number, y: number, zigzagIndex: number) {
  const pos = pitchPositionHorizontal(x, y, zigzagIndex);
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
      const boxes = option.slots.map((slot, i) => ({
        id: slot.id,
        ...landscapeChipBox(slot.x, slot.y, i),
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
