import { test } from "node:test";
import assert from "node:assert/strict";
import { encodeLayout, decodeLayout, applyCustomLayout } from "./customLayout.ts";
import type { Squad, Starter } from "./types.ts";

test("encodeLayout/decodeLayout round-trips slot positions at 1 decimal place", () => {
  const layout = { GK: { x: 50, y: 0 }, RB: { x: 98.456, y: 22.1 } };
  const encoded = encodeLayout(layout);
  assert.equal(encoded, "GK:50.0,0.0;RB:98.5,22.1");
  assert.deepEqual(decodeLayout(encoded), { GK: { x: 50, y: 0 }, RB: { x: 98.5, y: 22.1 } });
});

test("decodeLayout clamps out-of-range values and skips malformed entries", () => {
  const decoded = decodeLayout("GK:150.0,-10.0;garbage;RB:50.0,not-a-number");
  assert.deepEqual(decoded, { GK: { x: 100, y: 0 } });
});

function starter(id: string, x: number, y: number): Starter {
  return {
    login: `player-${id}`,
    avatarUrl: "",
    commits: 1,
    followers: 0,
    starsTotal: 0,
    mainLanguage: null,
    countryName: null,
    countryIso2: null,
    marketValue: 0,
    marketValueFormatted: "€0",
    position: { id, label: id, role: id, x, y },
  };
}

test("applyCustomLayout only moves x/y for slots present in the layout, keeping role/id/label", () => {
  const squad = {
    formation: "433",
    starters: [starter("GK", 50, 0), starter("RB", 98, 22)],
  } as unknown as Squad;

  const result = applyCustomLayout(squad, { RB: { x: 80, y: 30 } });

  assert.equal(result.formation, "custom");
  assert.deepEqual(result.starters[0].position, { id: "GK", label: "GK", role: "GK", x: 50, y: 0 });
  assert.deepEqual(result.starters[1].position, { id: "RB", label: "RB", role: "RB", x: 80, y: 30 });
});
