import { test } from "node:test";
import assert from "node:assert/strict";
import { fitUsername, USERNAME_MAX_FONT_PX, USERNAME_MIN_FONT_PX } from "./textFit.ts";

test("a short username keeps the max font size unchanged", () => {
  const result = fitUsername("bob", 100);
  assert.equal(result.text, "bob");
  assert.equal(result.fontSizePx, USERNAME_MAX_FONT_PX);
});

test("a longer username shrinks the font size, never wraps or truncates, down to the floor", () => {
  const result = fitUsername("sindresorhus", 80);
  assert.equal(result.text, "sindresorhus", "text must stay whole while shrinking still fits");
  assert.ok(result.fontSizePx < USERNAME_MAX_FONT_PX);
  assert.ok(result.fontSizePx >= USERNAME_MIN_FONT_PX);
});

test("a username that still overflows at the font floor gets a middle-ellipsis, keeping both ends", () => {
  const result = fitUsername("365daysofprogramming", 40);
  assert.equal(result.fontSizePx, USERNAME_MIN_FONT_PX, "must not shrink below the floor");
  assert.ok(result.text.includes("…"), "must ellipsize once the floor can't fit it");
  assert.ok(result.text.startsWith("365"), "keeps the start of the name");
  assert.ok(result.text.endsWith("g") || result.text.endsWith("ing"), "keeps the end of the name");
  assert.ok(!result.text.includes(" "), "never wraps to a second line's worth of content");
});

test("never returns a font size below the floor", () => {
  for (const width of [10, 20, 30, 50, 80, 200]) {
    const result = fitUsername("aVeryLongGithubUsernameIndeed", width);
    assert.ok(result.fontSizePx >= USERNAME_MIN_FONT_PX);
  }
});
