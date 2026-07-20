import { test } from "node:test";
import assert from "node:assert/strict";
import { valuateContributors } from "./valuation.ts";
import type { Contributor } from "./types.ts";

const ORIGINAL_TOKEN = process.env.GITHUB_TOKEN;
const CURRENT_YEAR = new Date().getFullYear();
const CREATED_AT = `${CURRENT_YEAR}-01-01T00:00:00Z`;

function isBaseQuery(query: string) {
  return query.includes("repositories(first: 100");
}
function isLastYearChunk(query: string) {
  return query.includes("contributionsCollection") && query.includes("weeks");
}
function isYearChunk(query: string) {
  return query.includes("contributionsCollection") && !query.includes("weeks");
}
function isCreatedAtProbe(query: string) {
  return !isBaseQuery(query) && !isYearChunk(query) && !isLastYearChunk(query);
}

function jsonResponse(body: unknown, status = 200): Response {
  return { ok: status < 400, status, headers: new Headers(), json: async () => body, text: async () => "" } as unknown as Response;
}

function baseProfileBody(login: string, followers: number) {
  return {
    data: {
      externalMergedPRs: { issueCount: 0, nodes: [] },
      closedIssues: { issueCount: 0 },
      user: {
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
        repositories: { totalCount: 0, pageInfo: { hasNextPage: false, endCursor: null }, nodes: [] },
        organizations: { nodes: [] },
      },
    },
  };
}

function yearChunkBody(commits: number) {
  return {
    data: {
      user: {
        contributionsCollection: {
          totalCommitContributions: commits,
          totalPullRequestContributions: 0,
          totalIssueContributions: 0,
          totalPullRequestReviewContributions: 0,
          restrictedContributionsCount: 0,
        },
      },
    },
  };
}

function lastYearChunkBody(commits: number) {
  return {
    data: {
      user: {
        contributionsCollection: {
          totalCommitContributions: commits,
          totalPullRequestContributions: 0,
          totalIssueContributions: 0,
          totalPullRequestReviewContributions: 0,
          restrictedContributionsCount: 0,
          contributionCalendar: { weeks: [] },
        },
      },
    },
  };
}

// "bob" always 500s (even across the in-code retry) to simulate a batch
// request that never recovers; "alice" always succeeds.
function mockGithubWithFailingUser(failingLogin: string) {
  (globalThis as { fetch: typeof fetch }).fetch = (async (url: string, init?: RequestInit) => {
    if (typeof url !== "string" || !url.includes("/graphql")) throw new Error(`unexpected fetch: ${url}`);
    const { query, variables } = JSON.parse(init!.body as string) as { query: string; variables: { login: string } };
    if (variables.login === failingLogin) return jsonResponse({}, 500);
    if (isCreatedAtProbe(query)) return jsonResponse({ data: { user: { createdAt: CREATED_AT } } });
    if (isBaseQuery(query)) return jsonResponse(baseProfileBody(variables.login, 10));
    if (isLastYearChunk(query)) return jsonResponse(lastYearChunkBody(5));
    return jsonResponse(yearChunkBody(5));
  }) as typeof fetch;
}

test("a persistently failing valuation batch never fabricates a €0, and the total is stable across calls", async (t) => {
  t.after(() => {
    process.env.GITHUB_TOKEN = ORIGINAL_TOKEN;
  });
  process.env.GITHUB_TOKEN = "test-token";
  mockGithubWithFailingUser("bob");

  const contributors: Contributor[] = [
    { login: "alice", avatarUrl: "a", commits: 10 },
    { login: "bob", avatarUrl: "b", commits: 5 },
  ];

  const first = await valuateContributors(contributors);
  const second = await valuateContributors(contributors);

  for (const result of [first, second]) {
    const bob = result.find((v) => v.login === "bob")!;
    assert.equal(bob.marketValue, null, "a failed valuation must be null, not a fabricated 0");
    assert.equal(bob.valuationPending, true);
    assert.notEqual(bob.marketValueFormatted, "€0");

    const alice = result.find((v) => v.login === "alice")!;
    assert.notEqual(alice.marketValue, null);
    assert.equal(alice.valuationPending, undefined);
  }

  const totalOf = (result: typeof first) => result.reduce((sum, v) => sum + (v.marketValue ?? 0), 0);
  assert.equal(totalOf(first), totalOf(second), "total must be stable between consecutive calls");
});

test("GraphQL entirely unavailable falls back to a real REST-degraded valuation, not a pending —", async (t) => {
  t.after(() => {
    process.env.GITHUB_TOKEN = ORIGINAL_TOKEN;
  });
  process.env.GITHUB_TOKEN = "test-token";

  const login = "too-expensive-user";
  let restCalled = false;
  (globalThis as { fetch: typeof fetch }).fetch = (async (url: string, init?: RequestInit) => {
    if (typeof url === "string" && url.includes(`/users/${login}/repos`)) {
      return jsonResponse([]);
    }
    if (typeof url === "string" && url.includes(`/users/${login}`)) {
      restCalled = true;
      return jsonResponse({ login, followers: 100, public_repos: 0, created_at: `${CURRENT_YEAR - 8}-01-01T00:00:00Z` });
    }
    if (typeof url !== "string" || !url.includes("/graphql")) throw new Error(`unexpected fetch: ${url}`);
    const { query } = JSON.parse(init!.body as string) as { query: string };
    if (isCreatedAtProbe(query)) return jsonResponse({ data: { user: { createdAt: CREATED_AT } } });
    // The base query deterministically trips GitHub's per-request resource
    // limit — GraphQL is unusable for this login, not just this one query.
    return jsonResponse({
      data: { externalMergedPRs: null, closedIssues: null, user: null },
      errors: [{ type: "RESOURCE_LIMITS_EXCEEDED", path: ["user"], message: "Resource limits for this query exceeded." }],
    });
  }) as typeof fetch;

  const [result] = await valuateContributors([{ login, avatarUrl: "a", commits: 1 }]);

  assert.ok(restCalled, "the REST fallback must run when GraphQL can't produce a usable profile");
  assert.notEqual(result.marketValue, null, "REST fallback yields a real value, not a pending —");
  assert.equal(result.valuationPending, undefined);
  assert.notEqual(result.marketValueFormatted, "—");
  // (50000 base + 100 followers × 6000) × 1.1 veteran multiplier (>6y old).
  assert.equal(result.marketValue, (50000 + 100 * 6000) * 1.1);
});

test("concurrent renders requesting the same login coalesce into one in-flight fetch", async (t) => {
  t.after(() => {
    process.env.GITHUB_TOKEN = ORIGINAL_TOKEN;
  });
  process.env.GITHUB_TOKEN = "test-token";

  const login = "coalesce-user";
  let graphqlCalls = 0;
  (globalThis as { fetch: typeof fetch }).fetch = (async (url: string, init?: RequestInit) => {
    if (typeof url !== "string" || !url.includes("/graphql")) throw new Error(`unexpected fetch: ${url}`);
    graphqlCalls++;
    const { query, variables } = JSON.parse(init!.body as string) as { query: string; variables: { login: string } };
    if (isCreatedAtProbe(query)) return jsonResponse({ data: { user: { createdAt: CREATED_AT } } });
    if (isBaseQuery(query)) return jsonResponse(baseProfileBody(variables.login, 10));
    if (isLastYearChunk(query)) return jsonResponse(lastYearChunkBody(5));
    return jsonResponse(yearChunkBody(5));
  }) as typeof fetch;

  const contributors: Contributor[] = [{ login, avatarUrl: "a", commits: 1 }];

  // Two renders asking for the exact same repo/user at the same time —
  // fired concurrently, not sequentially.
  const [first, second] = await Promise.all([valuateContributors(contributors), valuateContributors(contributors)]);

  // getGithubProfile makes 4 round trips per user (createdAt probe, base,
  // one year chunk, the lastYear chunk) — coalescing means that set happens
  // once total across both concurrent callers, not once each.
  assert.equal(graphqlCalls, 4, "two concurrent requests for the same login must share one in-flight fetch");
  assert.equal(first[0].marketValue, second[0].marketValue);
});

test("stale-on-error: a login that succeeded once keeps serving that valuation once every later attempt fails", async (t) => {
  t.after(() => {
    process.env.GITHUB_TOKEN = ORIGINAL_TOKEN;
  });
  process.env.GITHUB_TOKEN = "test-token";

  const login = "stale-user";
  let shouldFail = false;
  (globalThis as { fetch: typeof fetch }).fetch = (async (url: string, init?: RequestInit) => {
    if (typeof url !== "string" || !url.includes("/graphql")) {
      // REST fallback also fails while shouldFail is true, so the only
      // recovery path left is the process-local stale-known-good value.
      throw new Error(`unexpected fetch: ${url}`);
    }
    if (shouldFail) return jsonResponse({}, 500);
    const { query, variables } = JSON.parse(init!.body as string) as { query: string; variables: { login: string } };
    if (isCreatedAtProbe(query)) return jsonResponse({ data: { user: { createdAt: CREATED_AT } } });
    if (isBaseQuery(query)) return jsonResponse(baseProfileBody(variables.login, 10));
    if (isLastYearChunk(query)) return jsonResponse(lastYearChunkBody(5));
    return jsonResponse(yearChunkBody(5));
  }) as typeof fetch;

  const contributors: Contributor[] = [{ login, avatarUrl: "a", commits: 1 }];

  const first = await valuateContributors(contributors);
  assert.notEqual(first[0].marketValue, null, "the first call should succeed and become the fallback");

  shouldFail = true;
  const second = await valuateContributors(contributors);
  assert.equal(
    second[0].marketValue,
    first[0].marketValue,
    'a later failure must fall back to the last known good valuation, not "—"'
  );
  assert.equal(second[0].valuationPending, undefined, "a stale fallback is not the same as never having succeeded");
});

test("a login that fails on one render and succeeds on the next has its fallback replaced by the real value", async (t) => {
  t.after(() => {
    process.env.GITHUB_TOKEN = ORIGINAL_TOKEN;
  });
  process.env.GITHUB_TOKEN = "test-token";

  const login = "recovers-user";
  let shouldFail = true;
  (globalThis as { fetch: typeof fetch }).fetch = (async (url: string, init?: RequestInit) => {
    if (typeof url !== "string" || !url.includes("/graphql")) throw new Error(`unexpected fetch: ${url}`);
    if (shouldFail) return jsonResponse({}, 500);
    const { query, variables } = JSON.parse(init!.body as string) as { query: string; variables: { login: string } };
    if (isCreatedAtProbe(query)) return jsonResponse({ data: { user: { createdAt: CREATED_AT } } });
    if (isBaseQuery(query)) return jsonResponse(baseProfileBody(variables.login, 10));
    if (isLastYearChunk(query)) return jsonResponse(lastYearChunkBody(5));
    return jsonResponse(yearChunkBody(5));
  }) as typeof fetch;

  const contributors: Contributor[] = [{ login, avatarUrl: "a", commits: 1 }];

  const first = await valuateContributors(contributors);
  assert.equal(first[0].marketValue, null, "the first render should fail and fall back to pending, not a fabricated value");
  assert.equal(first[0].valuationPending, true);

  shouldFail = false;
  const second = await valuateContributors(contributors);
  assert.notEqual(second[0].marketValue, null, "a later successful render must retry and replace the fallback");
  assert.equal(second[0].valuationPending, undefined);
});
