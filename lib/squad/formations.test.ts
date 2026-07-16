import { test } from "node:test";
import assert from "node:assert/strict";
import { getFormationSlots, FORMATIONS } from "./formations.ts";

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

test("degrades to 4-2-3 (one fewer midfielder) at 10 humans", () => {
  const slots = getFormationSlots(10);
  assert.equal(slots.length, 10);
  assert.equal(slots.filter((s) => s.id.startsWith("MID")).length, 2);
  assert.equal(slots.filter((s) => s.id.startsWith("DEF")).length, 4);
  assert.equal(slots.filter((s) => s.id.startsWith("FWD")).length, 3);
  assert.equal(slots.at(-1)!.id, "GK");
});

test("degrades to the 3-player minimum (1 defender, 1 forward, GK)", () => {
  const slots = getFormationSlots(3);
  assert.equal(slots.length, 3);
  assert.equal(slots.filter((s) => s.id.startsWith("DEF")).length, 1);
  assert.equal(slots.filter((s) => s.id.startsWith("MID")).length, 0);
  assert.equal(slots.filter((s) => s.id.startsWith("FWD")).length, 1);
  assert.equal(slots.at(-1)!.id, "GK");
});

test("clamps below 3 to the same slots as 3 (caller is expected to reject <3 earlier)", () => {
  assert.deepEqual(getFormationSlots(1), getFormationSlots(3));
});
