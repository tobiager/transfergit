import { test } from "node:test";
import assert from "node:assert/strict";
import { pickFeaturedRepo, FEATURED_REPOS } from "./featuredRepos.ts";

test("pickFeaturedRepo is deterministic for the same UTC day", () => {
  const a = pickFeaturedRepo(new Date("2026-07-20T02:00:00Z"));
  const b = pickFeaturedRepo(new Date("2026-07-20T23:00:00Z"));
  assert.deepEqual(a, b);
});

test("pickFeaturedRepo always returns a pool member", () => {
  const picked = pickFeaturedRepo(new Date("2026-01-01T00:00:00Z"));
  assert.ok(FEATURED_REPOS.some((r) => r.owner === picked.owner && r.repo === picked.repo));
});

test("pickFeaturedRepo rotates on different days", () => {
  const day1 = pickFeaturedRepo(new Date("2026-03-01T00:00:00Z"));
  const day2 = pickFeaturedRepo(new Date("2026-03-02T00:00:00Z"));
  assert.notDeepEqual(day1, day2);
});
