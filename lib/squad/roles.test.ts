import { test } from "node:test";
import assert from "node:assert/strict";
import { assignRoles, CommitsRoleStrategy } from "./roles.ts";
import { getFormationSlots } from "./formations.ts";
import type { SquadPlayer } from "./types.ts";

function player(login: string, commits: number, marketValue: number): SquadPlayer {
  return {
    login,
    avatarUrl: "",
    commits,
    followers: 0,
    starsTotal: 0,
    mainLanguage: null,
    countryName: null,
    countryIso2: null,
    marketValue,
    marketValueFormatted: `€${marketValue}`,
  };
}

test("top committer gets the striker slot, lowest committer gets goalkeeper", () => {
  const players = [player("carol", 30, 100), player("alice", 100, 500), player("bob", 60, 200)];
  const slots = getFormationSlots(3);
  const { starters } = assignRoles(players, slots, "someone-else");

  assert.equal(starters[0].login, "alice");
  assert.equal(starters[0].position.id, "FWD1");
  assert.equal(starters.at(-1)!.login, "carol");
  assert.equal(starters.at(-1)!.position.id, "GK");
});

test("commit ties are broken deterministically by login", () => {
  const players = [player("zoe", 50, 10), player("amy", 50, 10), player("mia", 50, 10)];
  const ranked = new CommitsRoleStrategy().rank(players);
  assert.deepEqual(
    ranked.map((p) => p.login),
    ["amy", "mia", "zoe"]
  );
});

test("MVP is the highest market value across the whole squad, not just starters", () => {
  const players = [
    player("striker", 100, 200),
    player("bench-whale", 10, 900),
    player("mid", 50, 300),
  ];
  // Fewer slots than players so bench-whale (lowest commits) is benched.
  const slots = getFormationSlots(3).slice(0, 2);
  const { mvp, bench } = assignRoles(players, slots, "someone-else");

  assert.equal(mvp.login, "bench-whale");
  assert.ok(bench.some((p) => p.login === "bench-whale"));
});

test("captain is the repo owner when they're a contributor, else the top committer", () => {
  const players = [player("owner-login", 10, 50), player("top", 100, 50), player("mid", 40, 50)];
  const slots = getFormationSlots(3);

  const withOwner = assignRoles(players, slots, "owner-login");
  assert.equal(withOwner.captain.login, "owner-login");

  const withoutOwner = assignRoles(players, slots, "someone-not-here");
  assert.equal(withoutOwner.captain.login, "top");
});
