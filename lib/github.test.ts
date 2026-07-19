import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchGithubProfile } from "./github.ts";

const ORIGINAL_TOKEN = process.env.GITHUB_TOKEN;
const ORIGINAL_FETCH = globalThis.fetch;
const CURRENT_YEAR = new Date().getFullYear();
const CREATED_AT = `${CURRENT_YEAR - 4}-01-01T00:00:00Z`;

// A resolved `user` object (enough for a full valuation), used as the partial
// payload alongside a nulled-out expensive half.
function resolvedUser(login: string, followers: number) {
  return {
    login,
    name: null,
    avatarUrl: `https://avatars/${login}`,
    bio: null,
    location: null,
    company: null,
    createdAt: CREATED_AT,
    websiteUrl: null,
    twitterUsername: null,
    followers: { totalCount: followers },
    following: { totalCount: 0 },
    repositories: {
      totalCount: 1,
      nodes: [
        { name: "r", stargazerCount: 12, forkCount: 0, primaryLanguage: { name: "TS" }, createdAt: CREATED_AT, pushedAt: CREATED_AT },
      ],
    },
    organizations: { nodes: [] },
    lastYear: { totalCommitContributions: 3, contributionCalendar: { weeks: [] } },
    [`y${CURRENT_YEAR}`]: {
      totalCommitContributions: 3,
      totalPullRequestContributions: 0,
      totalIssueContributions: 0,
      totalPullRequestReviewContributions: 0,
      contributionCalendar: { totalContributions: 3 },
    },
  };
}

test("salvages a partial GraphQL response: user resolved + expensive aliases nulled → full profile, no throw", async (t) => {
  t.after(() => {
    process.env.GITHUB_TOKEN = ORIGINAL_TOKEN;
    globalThis.fetch = ORIGINAL_FETCH;
  });
  process.env.GITHUB_TOKEN = "test-token";

  // Mirrors the real GitHub 200-with-errors partial: the external-PR search
  // and one year alias trip RESOURCE_LIMITS_EXCEEDED, but `user` still
  // resolves. Before the fix this threw and the login became "—".
  (globalThis as { fetch: typeof fetch }).fetch = (async (url: string, init?: RequestInit) => {
    const { query } = JSON.parse(init!.body as string) as { query: string; variables: { login: string } };
    if (query.includes("lastYear")) {
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          data: { externalMergedPRs: null, closedIssues: null, user: resolvedUser("partialuser", 40) },
          errors: [
            { type: "RESOURCE_LIMITS_EXCEEDED", path: ["externalMergedPRs", "nodes", 0, "repository"], message: "Resource limits for this query exceeded." },
          ],
        }),
        text: async () => "",
      } as unknown as Response;
    }
    return {
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({ data: { user: { createdAt: CREATED_AT } } }),
      text: async () => "",
    } as unknown as Response;
  }) as typeof fetch;

  const profile = await fetchGithubProfile("partialuser");

  assert.ok(profile, "a salvageable partial response must yield a profile, not null/throw");
  assert.equal(profile!.followers, 40, "resolved fields survive the salvage");
  assert.equal(profile!.externalMergedPRs, 0, "the nulled expensive alias defaults instead of crashing");
  assert.equal(profile!.publicRepos, 1);
});

test("a partial response with user === null is NOT salvaged (stays a resource-limit failure)", async (t) => {
  t.after(() => {
    process.env.GITHUB_TOKEN = ORIGINAL_TOKEN;
    globalThis.fetch = ORIGINAL_FETCH;
  });
  process.env.GITHUB_TOKEN = "test-token";

  (globalThis as { fetch: typeof fetch }).fetch = (async (url: string, init?: RequestInit) => {
    const { query } = JSON.parse(init!.body as string) as { query: string };
    if (query.includes("lastYear")) {
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          data: { externalMergedPRs: null, closedIssues: null, user: null },
          errors: [{ type: "RESOURCE_LIMITS_EXCEEDED", path: ["user"], message: "Resource limits for this query exceeded." }],
        }),
        text: async () => "",
      } as unknown as Response;
    }
    return {
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({ data: { user: { createdAt: CREATED_AT } } }),
      text: async () => "",
    } as unknown as Response;
  }) as typeof fetch;

  // user === null → not salvageable → GithubQueryTooExpensiveError bubbles up
  // (the caller's REST fallback handles it — see valuation.test.ts).
  await assert.rejects(fetchGithubProfile("expensiveuser"), /resource limit/i);
});
