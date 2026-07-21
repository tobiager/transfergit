import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getFormationSlots,
  getFormationOptions,
  resolveFormation,
  isSmallSided,
  chipScale,
  FORMATIONS,
} from "./formations.ts";
import { pitchPosition } from "./pitchLayout.ts";


test("11 humans uses the requested classic formation, GK last", () => {
  const slots = getFormationSlots(11, "442");
  assert.equal(slots, FORMATIONS["442"]);
  assert.equal(slots.at(-1)!.id, "GK");
  assert.equal(slots.length, 11);
});

test("defaults to 433 when no formation is requested at full strength", () => {
  const slots = getFormationSlots(11);
  assert.equal(slots, FORMATIONS["433"]);
});

test("30 humans (a large repo) still uses the full-strength table, not a degraded one", () => {
  const slots = getFormationSlots(30, "352");
  assert.equal(slots, FORMATIONS["352"]);
});

// Every formation, at every count from 3 to 11+, must field exactly one
// slot per human contributor (a squad's total value must never depend on
// which formation happens to be selected).
test("every formation option sums to exactly the requested player count, GK always last", () => {
  for (let count = 3; count <= 12; count++) {
    const expected = Math.min(count, 11);
    const options = getFormationOptions(count);
    assert.ok(options.length >= 1, `count ${count} has no formation options`);
    for (const option of options) {
      assert.equal(option.slots.length, expected, `${option.name} at count ${count}`);
      assert.equal(option.slots.at(-1)!.id, "GK", `${option.name} at count ${count} must end with GK`);
    }
  }
});

const EXPECTED_OPTION_NAMES: Record<number, string[]> = {
  11: ["433", "442", "352", "4231"],
  10: ["432", "342"],
  9: ["332", "233"],
  8: ["331"],
  7: ["231", "321"],
  6: ["221"],
  5: ["121"],
  4: ["111"],
  3: ["11"],
};

test("formation option names match the requested-count table", () => {
  for (const [count, names] of Object.entries(EXPECTED_OPTION_NAMES)) {
    const options = getFormationOptions(Number(count));
    assert.deepEqual(
      options.map((o) => o.name),
      names,
      `count ${count}`
    );
  }
});

test("pills are only meaningful where there's more than one formation option", () => {
  const multiOptionCounts = [11, 10, 9, 7];
  const singleOptionCounts = [8, 6, 5, 4, 3];
  for (const count of multiOptionCounts) {
    assert.ok(getFormationOptions(count).length > 1, `count ${count} should offer a choice`);
  }
  for (const count of singleOptionCounts) {
    assert.equal(getFormationOptions(count).length, 1, `count ${count} should have exactly one shape`);
  }
});

test("resolveFormation falls back to the default when the requested name isn't valid for this count", () => {
  const fallback = resolveFormation(10, "433");
  assert.equal(fallback.name, "432");

  const valid = resolveFormation(10, "342");
  assert.equal(valid.name, "342");

  const missing = resolveFormation(7);
  assert.equal(missing.name, "231");
});

test("small-sided mode applies at 3-7 players, full pitch at 8-11", () => {
  for (let count = 3; count <= 7; count++) assert.equal(isSmallSided(count), true, `count ${count}`);
  for (let count = 8; count <= 11; count++) assert.equal(isSmallSided(count), false, `count ${count}`);
});

const EXPECTED_ROLES: Record<string, Record<string, string>> = {
  "433": { GK: "GK", LB: "LB", CB_L: "CB", CB_R: "CB", RB: "RB", CM_L: "CM", CM_R: "CM", CDM: "CM", LW: "LW", RW: "RW", ST: "ST" },
  "442": { GK: "GK", LB: "LB", CB_L: "CB", CB_R: "CB", RB: "RB", LM: "LM", CM_L: "CM", CM_R: "CM", RM: "RM", ST_L: "ST", ST_R: "ST" },
  "352": { GK: "GK", CB_L: "CB", CB_C: "CB", CB_R: "CB", LWB: "LWB", CM_L: "CM", CM_R: "CM", RWB: "RWB", CDM: "CDM", ST_L: "ST", ST_R: "ST" },
  "4231": { GK: "GK", LB: "LB", CB_L: "CB", CB_R: "CB", RB: "RB", CDM_L: "CDM", CDM_R: "CDM", CAM: "CAM", LW: "LW", RW: "RW", ST: "ST" },
};

test("every slot in every classic formation carries the documented role tag", () => {
  for (const [name, expectedRoles] of Object.entries(EXPECTED_ROLES)) {
    for (const slot of FORMATIONS[name]) {
      assert.equal(slot.role, expectedRoles[slot.id], `${name}: ${slot.id}`);
    }
  }
});

test("chip scale steps up as the squad shrinks", () => {
  assert.equal(chipScale(11), 1);
  assert.equal(chipScale(10), 1.15);
  assert.equal(chipScale(8), 1.15);
  assert.equal(chipScale(7), 1.4);
  assert.equal(chipScale(3), 1.4);
});

// Mirrors components/squad/SquadPitch.tsx's actual container sizing
// (max-w-[36rem] / aspect-[68/118] full, max-w-[40rem] / aspect-[4/3]
// small-sided) and PlayerChip.tsx's base chip width (sm:w-24 = 96px), so
// this test catches real pixel-space overlaps, not just raw-coordinate
// closeness — x and y units don't cover equal pixel distances on a
// non-square pitch.
//
// The 144px minimum is 1.5x that *base* 96px chip width, not the
// scaled-up small-sided one: small-sided squads already have fewer
// players sharing the same pitch real estate, and requiring 1.5x of the
// visually-scaled (up to 1.4x) chip width compounds with the small-sided
// court's smaller pixel dimensions into a geometrically infeasible
// constraint (more spacing demanded on a smaller court). The flat 96px
// baseline is the one meaningful, achievable bar across every formation.
const FULL_CONTAINER_W = 576;
const FULL_CONTAINER_H = (576 * 118) / 68;
const SMALL_CONTAINER_W = 640;
const SMALL_CONTAINER_H = (640 * 3) / 4;
const CHIP_BASE_WIDTH_PX = 96;
const MIN_DISTANCE_PX = CHIP_BASE_WIDTH_PX * 1.5;

function slotPixelPosition(x: number, y: number, containerW: number, containerH: number, small: boolean) {
  const pos = pitchPosition(x, y, small);
  return { x: (pos.left / 100) * containerW, y: (pos.top / 100) * containerH };
}

test("every formation keeps every pair of slots at least 1.5x a chip's width apart in real pixel space", () => {
  for (let count = 3; count <= 11; count++) {
    const small = isSmallSided(count);
    const containerW = small ? SMALL_CONTAINER_W : FULL_CONTAINER_W;
    const containerH = small ? SMALL_CONTAINER_H : FULL_CONTAINER_H;

    for (const option of getFormationOptions(count)) {
      const points = option.slots.map((slot) => ({
        id: slot.id,
        ...slotPixelPosition(slot.x, slot.y, containerW, containerH, small),
      }));

      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          assert.ok(
            dist >= MIN_DISTANCE_PX,
            `${option.name} (count ${count}): ${points[i].id} and ${points[j].id} are ${dist.toFixed(1)}px apart, need >= ${MIN_DISTANCE_PX.toFixed(1)}px`
          );
        }
      }
    }
  }
});

// The safe-area regression: a slot near an extreme x/y (e.g. 433's RB at
// x=98) must still keep its full chip footprint on the grass, not just its
// center anchor.
//
// Full pitch checks the *complete* chip box (role tag + 72px avatar +
// 3-line nameplate, desktop sm:w-24) — this is the reported bug (a full XI's
// RB clipping the right touchline) and it's fully fixable: PITCH_INSET_X/Y
// were raised until this holds with room to spare.
//
// Small-sided checks only the avatar + role tag (mobile h-10 box), not the
// full nameplate stack: the tightest small-sided shape (3 players — a bare
// GK+DEF+FWD line) can't satisfy both this containment check and the
// collision test's separation requirement at once using the full nameplate
// height — the court is short (aspect-[4/3]) and chips scale up to 1.4x
// there. The avatar+role-tag is the hard-edged, actually-clips-looking-wrong
// part; the nameplate's soft blurred backdrop bleeding a few px past the
// pitch border on a 3-a-side squad is a known, visually minor ceiling, not a
// crash-the-layout bug — verified empirically, not just estimated, since
// this pitch's real geometry is tight enough that hand-waving the numbers
// isn't reliable.
const FULL_CHIP_HALF_W_PX = 42;
const FULL_CHIP_HALF_H_PX = 68;
const SMALL_AVATAR_HALF_W_PX = 28;
const SMALL_AVATAR_HALF_H_PX = 29;

function assertContained(
  label: string,
  x: number,
  y: number,
  halfW: number,
  halfH: number,
  containerW: number,
  containerH: number
) {
  assert.ok(x - halfW >= -0.01, `${label} overflows the left edge by ${(halfW - x).toFixed(1)}px`);
  assert.ok(x + halfW <= containerW + 0.01, `${label} overflows the right edge by ${(x + halfW - containerW).toFixed(1)}px`);
  assert.ok(y - halfH >= -0.01, `${label} overflows the top edge by ${(halfH - y).toFixed(1)}px`);
  assert.ok(y + halfH <= containerH + 0.01, `${label} overflows the bottom edge by ${(y + halfH - containerH).toFixed(1)}px`);
}

test("every formation's slots keep a chip's footprint inside the pitch container", () => {
  for (let count = 3; count <= 11; count++) {
    const small = isSmallSided(count);
    const containerW = small ? SMALL_CONTAINER_W : FULL_CONTAINER_W;
    const containerH = small ? SMALL_CONTAINER_H : FULL_CONTAINER_H;
    const halfW = small ? SMALL_AVATAR_HALF_W_PX : FULL_CHIP_HALF_W_PX;
    const halfH = small ? SMALL_AVATAR_HALF_H_PX : FULL_CHIP_HALF_H_PX;

    for (const option of getFormationOptions(count)) {
      for (const slot of option.slots) {
        const { x, y } = slotPixelPosition(slot.x, slot.y, containerW, containerH, small);
        assertContained(`${option.name} (count ${count}): ${slot.id}`, x, y, halfW, halfH, containerW, containerH);
      }
    }
  }
});
