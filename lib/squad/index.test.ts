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
  profileCommits: number; // cross-repo commits used by the profile valuation
}

function fullProfileGraphQL(f: Fixture) {
  return {
    data: {
      externalMergedPRs: { issueCount: 0, nodes: [] },
      closedIssues: { issueCount: 0 },
      user: {
        login: f.login,
        name: null,
        avatarUrl: `https://avatars/${f.login}`,
        bio: null,
        location: null,
        company: null,
        createdAt: CREATED_AT,
        websiteUrl: null,
        twitterUsername: null,
        followers: { totalCount: f.followers },
        following: { totalCount: 0 },
        repositories: {
          totalCount: 1,
          nodes: [
            {
              name: "repo",
              stargazerCount: f.stars,
              forkCount: 0,
              primaryLanguage: { name: "TypeScript" },
              createdAt: CREATED_AT,
              pushedAt: CREATED_AT,
            },
          ],
        },
        organizations: { nodes: [] },
        lastYear: { totalCommitContributions: f.profileCommits, contributionCalendar: { weeks: [] } },
        [`y${CURRENT_YEAR}`]: {
          totalCommitContributions: f.profileCommits,
          totalPullRequestContributions: 0,
          totalIssueContributions: 0,
          totalPullRequestReviewContributions: 0,
          contributionCalendar: { totalContributions: f.profileCommits },
        },
      },
    },
  };
}

function mockGithub(fixtures: Fixture[]) {
  const byLogin = new Map(fixtures.map((f) => [f.login, f]));

  (globalThis as { fetch: typeof fetch }).fetch = (async (url: string, init?: RequestInit) => {
    if (typeof url === "string" && url.includes("/contributors")) {
      const body = fixtures.map((f) => ({
        login: f.login,
        avatar_url: `https://avatars/${f.login}`,
        contributions: f.repoCommits,
        type: "User",
      }));
      return { ok: true, status: 200, json: async () => body, text: async () => "" } as Response;
    }

    if (typeof url === "string" && url.includes("/graphql")) {
      const { query, variables } = JSON.parse(init!.body as string) as {
        query: string;
        variables: { login: string };
      };
      const fixture = byLogin.get(variables.login)!;

      // fetchGithubProfile makes two round trips per user: a small
      // createdAt-only query, then the big profile query (identifiable by
      // its lastYearFrom variable / contributionsCollection fields).
      if (query.includes("lastYear")) {
        return { ok: true, status: 200, json: async () => fullProfileGraphQL(fixture), text: async () => "" } as Response;
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ data: { user: { createdAt: CREATED_AT } } }),
        text: async () => "",
      } as Response;
    }

    throw new Error(`unexpected fetch: ${url}`);
  }) as typeof fetch;
}

test("getRepoSquad values each player like their individual profile and sums the total", async (t) => {
  t.after(() => {
    process.env.GITHUB_TOKEN = ORIGINAL_TOKEN;
  });
  process.env.GITHUB_TOKEN = "test-token";

  const fixtures: Fixture[] = [
    { login: "alice", repoCommits: 100, followers: 10, stars: 5, profileCommits: 300 },
    { login: "bob", repoCommits: 60, followers: 2, stars: 1, profileCommits: 20 },
    { login: "carol", repoCommits: 20, followers: 0, stars: 0, profileCommits: 5 },
  ];
  mockGithub(fixtures);

  const squad = await getRepoSquad("acme", "widgets");

  // Same computeMarketValue formula + inputs that lib/player.ts uses to
  // value an individual profile — asserting against it (not a hand-copied
  // number) keeps this test honest if the formula ever changes.
  const accountAgeYears = calculateAgeYears(CREATED_AT);
  const expectedTotal = fixtures.reduce(
    (sum, f) =>
      sum +
      computeMarketValue({
        commitsTotal: f.profileCommits,
        starsTotal: f.stars,
        followers: f.followers,
        prsTotal: 0,
        reposOver10Stars: 0,
        commitsLast12Months: f.profileCommits,
        accountAgeYears,
      }),
    0
  );

  assert.equal(squad.totalValue, expectedTotal);
  assert.equal(squad.starters.length + squad.bench.length, 3);
  assert.equal(squad.captain.login, "alice");
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
    profileCommits: 1,
  }));
  mockGithub(fixtures);
  const mockedFetch = globalThis.fetch;
  const graphqlLogins = new Set<string>();
  (globalThis as { fetch: typeof fetch }).fetch = (async (url: string, init?: RequestInit) => {
    if (typeof url === "string" && url.includes("/graphql")) {
      const { variables } = JSON.parse(init!.body as string) as { variables: { login: string } };
      graphqlLogins.add(variables.login);
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
