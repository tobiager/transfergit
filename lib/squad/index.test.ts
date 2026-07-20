import { test } from "node:test";
import assert from "node:assert/strict";
import { getRepoSquad } from "./index.ts";
import { computeMarketValue } from "../valuation.ts";
import { calculateAgeYears } from "../format.ts";

const ORIGINAL_TOKEN = process.env.GITHUB_TOKEN;
const CURRENT_YEAR = new Date().getFullYear();
const CREATED_AT = `${CURRENT_YEAR}-01-01T00:00:00Z`;

interface Fixture {
  login: string;
  repoCommits: number; // commits in this squad's repo (REST contributors endpoint)
  followers: number;
  stars: number;
}

function jsonResponse(body: unknown, status = 200): Response {
  return { ok: status < 400, status, headers: new Headers(), json: async () => body, text: async () => "" } as unknown as Response;
}

// The light squad valuation batch (lib/github.ts's fetchLightSquadProfiles)
// is ONE aliased GraphQL request per up-to-10 logins — this mock resolves
// each `loginN` variable against the fixture map and replies with matching
// `uN` aliases, optionally 500ing whole chunks that contain a failing login.
function mockGithub(fixtures: Fixture[], failingLogins: Set<string> = new Set()) {
  const byLogin = new Map(fixtures.map((f) => [f.login, f]));

  (globalThis as { fetch: typeof fetch }).fetch = (async (url: string, init?: RequestInit) => {
    if (typeof url === "string" && url.includes("/contributors")) {
      const body = fixtures.map((f) => ({
        login: f.login,
        avatar_url: `https://avatars/${f.login}`,
        contributions: f.repoCommits,
        type: "User",
      }));
      return jsonResponse(body);
    }

    if (typeof url === "string" && url.includes("/graphql")) {
      const { variables } = JSON.parse(init!.body as string) as { variables: Record<string, string> };
      if (Object.values(variables).some((login) => failingLogins.has(login))) {
        return jsonResponse({}, 500);
      }
      const data: Record<string, unknown> = { rateLimit: { cost: 1, remaining: 4999 } };
      for (const [key, login] of Object.entries(variables)) {
        const idx = key.replace("login", "");
        const fixture = byLogin.get(login)!;
        data[`u${idx}`] = {
          login,
          followers: { totalCount: fixture.followers },
          createdAt: CREATED_AT,
          location: null,
          repositories: { nodes: [{ stargazerCount: fixture.stars, primaryLanguage: { name: "TypeScript" } }] },
        };
      }
      return jsonResponse({ data });
    }

    throw new Error(`unexpected fetch: ${url}`);
  }) as typeof fetch;
}

test("getRepoSquad values each player from the light batch valuation and sums the total", async (t) => {
  t.after(() => {
    process.env.GITHUB_TOKEN = ORIGINAL_TOKEN;
  });
  process.env.GITHUB_TOKEN = "test-token";

  const fixtures: Fixture[] = [
    { login: "alice", repoCommits: 100, followers: 10, stars: 5 },
    { login: "bob", repoCommits: 60, followers: 2, stars: 1 },
    { login: "carol", repoCommits: 20, followers: 0, stars: 0 },
  ];
  mockGithub(fixtures);

  const squad = await getRepoSquad("acme", "widgets");

  // Same computeMarketValue formula lib/squad/valuation.ts uses — squad
  // valuation has no per-year contribution history, so commits/PRs/last-12mo
  // are always 0 (the same reduced formula computeValuationTimeline falls
  // back to when a profile has no year data at all).
  const accountAgeYears = calculateAgeYears(CREATED_AT);
  const expectedTotal = fixtures.reduce(
    (sum, f) =>
      sum +
      computeMarketValue({
        commitsTotal: 0,
        starsTotal: f.stars,
        followers: f.followers,
        prsTotal: 0,
        reposOver10Stars: 0,
        commitsLast12Months: 0,
        accountAgeYears,
      }),
    0
  );

  assert.equal(squad.totalValue, expectedTotal);
  assert.equal(squad.starters.length + squad.bench.length, 3);
  assert.equal(squad.captain.login, "alice");
});

test("the squad total is identical across formations and equals the cached full sum, never a per-route partial", async (t) => {
  t.after(() => {
    process.env.GITHUB_TOKEN = ORIGINAL_TOKEN;
  });
  process.env.GITHUB_TOKEN = "test-token";

  // 11 contributors; 5 of them fail their valuation entirely (their chunk
  // always 500s, never recovers) → pending "—", excluded from the total.
  // This is the Problem A scenario: the live page requests no formation,
  // the exports request "433"/"442"/… — all must read the same total,
  // computed once, not each re-summing whatever survived its own cold render.
  const failing = new Set(["u2", "u4", "u6", "u8", "u10"]);
  const fixtures: Fixture[] = Array.from({ length: 11 }, (_, i) => ({
    login: `u${i}`,
    repoCommits: 100 - i,
    followers: (i + 1) * 3,
    stars: i,
  }));
  mockGithub(fixtures, failing);

  const asPage = await getRepoSquad("acme", "widgets"); // no formation (live page)
  const as433 = await getRepoSquad("acme", "widgets", "433"); // export default
  const as442 = await getRepoSquad("acme", "widgets", "442"); // another export pill

  // The total is formation-invariant and travels in the object.
  assert.equal(asPage.totalValue, as433.totalValue, "page and 433 export must agree on the total");
  assert.equal(as433.totalValue, as442.totalValue, "different formations must not change the total");
  assert.equal(asPage.totalValueFormatted, as433.totalValueFormatted);

  // And it equals the sum of only the non-pending valuations — never a €0
  // for the failures, never a partial that excludes a survivor.
  const nonPending = [asPage.captain, ...asPage.starters, ...asPage.bench].filter(
    (p, i, arr) => arr.findIndex((q) => q.login === p.login) === i && !p.valuationPending
  );
  const expected = nonPending.reduce((sum, p) => sum + (p.marketValue ?? 0), 0);
  assert.equal(asPage.totalValue, expected);
  assert.ok(asPage.pendingValuations.length > 0, "the failing logins are pending, excluded from the total");
});

test("only the top 30 contributors are valued — positions 31+ are unvalued reserves at zero extra cost", async (t) => {
  t.after(() => {
    process.env.GITHUB_TOKEN = ORIGINAL_TOKEN;
  });
  process.env.GITHUB_TOKEN = "test-token";

  const fixtures: Fixture[] = Array.from({ length: 35 }, (_, i) => ({
    login: `user${i}`,
    repoCommits: 100 - i,
    followers: 1,
    stars: 1,
  }));
  mockGithub(fixtures);
  const mockedFetch = globalThis.fetch;
  const graphqlLogins = new Set<string>();
  (globalThis as { fetch: typeof fetch }).fetch = (async (url: string, init?: RequestInit) => {
    if (typeof url === "string" && url.includes("/graphql")) {
      const { variables } = JSON.parse(init!.body as string) as { variables: Record<string, string> };
      for (const login of Object.values(variables)) graphqlLogins.add(login);
    }
    return mockedFetch(url, init);
  }) as typeof fetch;

  const squad = await getRepoSquad("acme", "widgets");

  assert.equal(squad.starters.length + squad.bench.length, 30, "tier 1 is capped at 30");
  assert.equal(squad.reserves.length, 5, "positions 31-35 become reserves");
  assert.deepEqual(
    squad.reserves.map((r) => r.login),
    fixtures.slice(30).map((f) => f.login)
  );
  for (const reserve of squad.reserves) {
    assert.ok(!graphqlLogins.has(reserve.login), `reserve ${reserve.login} must never hit the GraphQL API`);
    assert.ok(!("marketValue" in reserve), "reserves carry no valuation fields, just login/avatarUrl/commits");
  }
});
