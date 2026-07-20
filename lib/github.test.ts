import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchGithubProfile, getGithubProfile } from "./github.ts";

const ORIGINAL_TOKEN = process.env.GITHUB_TOKEN;
const ORIGINAL_FETCH = globalThis.fetch;
const CURRENT_YEAR = new Date().getFullYear();

// Query-shape helpers — the chunked pipeline fires several distinct request
// shapes per profile (createdAt probe, base profile, one query per
// contribution year, the rolling-365-day window, optional repo pages).
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

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return {
    ok: status < 400,
    status,
    headers: new Headers(headers),
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

function resourceLimitsExceeded() {
  return {
    data: { user: null },
    errors: [{ type: "RESOURCE_LIMITS_EXCEEDED", path: ["user", "contributionsCollection"], message: "Resource limits for this query exceeded." }],
  };
}

interface Fixture {
  login: string;
  createdAt: string;
  followers: number;
  repoStars: number;
  contributionYears?: number[];
}

function baseProfileBody(f: Fixture) {
  return {
    data: {
      rateLimit: { cost: 2, remaining: 4998 },
      externalMergedPRs: { issueCount: 0, nodes: [] },
      closedIssues: { issueCount: 0 },
      user: {
        login: f.login,
        name: null,
        avatarUrl: `https://avatars/${f.login}`,
        bio: null,
        location: null,
        company: null,
        createdAt: f.createdAt,
        websiteUrl: null,
        twitterUsername: null,
        followers: { totalCount: f.followers },
        following: { totalCount: 0 },
        repositories: {
          totalCount: 1,
          pageInfo: { hasNextPage: false, endCursor: null },
          nodes: [
            { name: "r", stargazerCount: f.repoStars, forkCount: 0, primaryLanguage: { name: "TS" }, createdAt: f.createdAt, pushedAt: f.createdAt },
          ],
        },
        organizations: { nodes: [] },
        ...(f.contributionYears ? { contributionsCollection: { contributionYears: f.contributionYears } } : {}),
      },
    },
  };
}

function windowAggregateBody(commits: number) {
  return {
    data: {
      rateLimit: { cost: 1, remaining: 4997 },
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

function lastYearWindowBody(commits: number) {
  return {
    data: {
      rateLimit: { cost: 1, remaining: 4996 },
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

function restore(t: import("node:test").TestContext) {
  t.after(() => {
    process.env.GITHUB_TOKEN = ORIGINAL_TOKEN;
    globalThis.fetch = ORIGINAL_FETCH;
  });
  process.env.GITHUB_TOKEN = "test-token";
}

test("chunked fetch assembles a full, complete profile from several small aggregate-only requests", async (t) => {
  restore(t);
  const login = "chunkeduser";
  const fixture: Fixture = { login, createdAt: `${CURRENT_YEAR}-01-01T00:00:00Z`, followers: 40, repoStars: 12 };
  let graphqlCalls = 0;

  (globalThis as { fetch: typeof fetch }).fetch = (async (url: string, init?: RequestInit) => {
    if (typeof url !== "string" || !url.includes("/graphql")) throw new Error(`unexpected fetch: ${url}`);
    graphqlCalls++;
    const { query } = JSON.parse(init!.body as string) as { query: string };
    if (isCreatedAtProbe(query)) return jsonResponse({ data: { user: { createdAt: fixture.createdAt } } });
    if (isBaseQuery(query)) return jsonResponse(baseProfileBody(fixture));
    if (isLastYearChunk(query)) return jsonResponse(lastYearWindowBody(3));
    if (isYearChunk(query)) return jsonResponse(windowAggregateBody(3));
    throw new Error(`unrecognized query: ${query}`);
  }) as typeof fetch;

  const profile = await fetchGithubProfile(login);

  assert.ok(profile, "chunked fetch must produce a profile");
  assert.equal(profile!.followers, 40);
  assert.equal(profile!.complete, true);
  assert.deepEqual(profile!.missingYears, []);
  assert.equal(profile!.contributionsByYear.length, 1, "one year chunk for a brand-new account");
  assert.equal(profile!.contributionsByYear[0].commits, 3);
  assert.equal(profile!.lastYearCommits, 3);
  assert.equal(profile!.degraded, false);
  assert.ok(profile!.computedAt);
  // createdAt probe + base + 1 year chunk + lastYear chunk.
  assert.equal(graphqlCalls, 4);
});

test("the expected-years invariant is GitHub's real contributionYears, not the createdAt..currentYear range — a sparse account only fetches its real years", async (t) => {
  restore(t);
  const login = "sparse-history";
  // Account created in 2012, but only ever contributed in 2015, 2020, and
  // this year — createdYear..currentYear would wastefully (and wrongly)
  // imply data should exist for every year in between.
  const contributionYears = [2015, 2020, CURRENT_YEAR];
  const fixture: Fixture = { login, createdAt: "2012-03-01T00:00:00Z", followers: 5, repoStars: 1, contributionYears };
  const requestedYears = new Set<number>();

  (globalThis as { fetch: typeof fetch }).fetch = (async (url: string, init?: RequestInit) => {
    if (typeof url !== "string" || !url.includes("/graphql")) throw new Error(`unexpected fetch: ${url}`);
    const { query, variables } = JSON.parse(init!.body as string) as { query: string; variables: { from?: string } };
    if (isCreatedAtProbe(query)) return jsonResponse({ data: { user: { createdAt: fixture.createdAt } } });
    if (isBaseQuery(query)) return jsonResponse(baseProfileBody(fixture));
    if (isLastYearChunk(query)) return jsonResponse(lastYearWindowBody(1));
    if (isYearChunk(query)) {
      requestedYears.add(Number(variables.from!.slice(0, 4)));
      return jsonResponse(windowAggregateBody(10));
    }
    throw new Error(`unrecognized query: ${query}`);
  }) as typeof fetch;

  const profile = await fetchGithubProfile(login);

  assert.ok(profile);
  assert.equal(profile!.complete, true);
  assert.deepEqual([...requestedYears].sort((a, b) => a - b), contributionYears, "must fetch exactly the years contributionYears reports, not every year since account creation");
  assert.deepEqual(
    profile!.contributionsByYear.map((c) => c.year),
    contributionYears
  );
});

test("a dense year that trips RESOURCE_LIMITS_EXCEEDED bisects into half-year windows and recovers the real total, never trusting bogus data served alongside the error", async (t) => {
  restore(t);
  const login = "timrogers-like";
  const fixture: Fixture = { login, createdAt: `${CURRENT_YEAR}-01-01T00:00:00Z`, followers: 500, repoStars: 12 };
  // The real bug: GitHub returned a partially-resolved (and WRONG) aggregate
  // alongside RESOURCE_LIMITS_EXCEEDED for the full-year window. Only the
  // FIRST year-chunk request is the full-year window (it fails, with a
  // bogus "82" riding alongside the error); every subsequent request is a
  // bisected half, which succeeds with a real, distinguishable value —
  // proving the bogus "82" never gets summed in.
  let yearCallCount = 0;

  (globalThis as { fetch: typeof fetch }).fetch = (async (url: string, init?: RequestInit) => {
    if (typeof url !== "string" || !url.includes("/graphql")) throw new Error(`unexpected fetch: ${url}`);
    const { query } = JSON.parse(init!.body as string) as { query: string };
    if (isCreatedAtProbe(query)) return jsonResponse({ data: { user: { createdAt: fixture.createdAt } } });
    if (isBaseQuery(query)) return jsonResponse(baseProfileBody(fixture));
    if (isLastYearChunk(query)) return jsonResponse(lastYearWindowBody(1));
    if (isYearChunk(query)) {
      yearCallCount++;
      if (yearCallCount === 1) {
        return jsonResponse({
          data: {
            user: { contributionsCollection: { totalCommitContributions: 82, totalPullRequestContributions: 0, totalIssueContributions: 0, totalPullRequestReviewContributions: 0, restrictedContributionsCount: 0 } },
          },
          errors: [{ type: "RESOURCE_LIMITS_EXCEEDED", path: ["user", "contributionsCollection"], message: "too pricey" }],
        });
      }
      return jsonResponse(windowAggregateBody(1500));
    }
    throw new Error(`unrecognized query: ${query}`);
  }) as typeof fetch;

  const profile = await fetchGithubProfile(login);

  assert.ok(profile, "bisection must still produce a profile");
  assert.equal(profile!.complete, true, "bisection resolving both halves means the year is NOT missing");
  assert.deepEqual(profile!.missingYears, []);
  assert.equal(profile!.contributionsByYear[0].commits, 3000, "must be the real bisected sum (1500+1500), never the bogus 82");
  assert.ok(yearCallCount >= 3, "the full-year attempt plus at least two bisected halves");
});

test("a window still too expensive at the bisection floor is marked missing, not fabricated as zero — profile is partial, not silently wrong", async (t) => {
  restore(t);
  const login = "always-too-expensive";
  const fixture: Fixture = { login, createdAt: `${CURRENT_YEAR}-01-01T00:00:00Z`, followers: 10, repoStars: 1 };

  (globalThis as { fetch: typeof fetch }).fetch = (async (url: string, init?: RequestInit) => {
    if (typeof url !== "string" || !url.includes("/graphql")) throw new Error(`unexpected fetch: ${url}`);
    const { query } = JSON.parse(init!.body as string) as { query: string };
    if (isCreatedAtProbe(query)) return jsonResponse({ data: { user: { createdAt: fixture.createdAt } } });
    if (isBaseQuery(query)) return jsonResponse(baseProfileBody(fixture));
    if (isLastYearChunk(query)) return jsonResponse(lastYearWindowBody(1));
    // Every slice, at every bisection depth, is too expensive.
    if (isYearChunk(query)) return jsonResponse(resourceLimitsExceeded());
    throw new Error(`unrecognized query: ${query}`);
  }) as typeof fetch;

  // fetchGithubProfile throws PartialProfileError for an incomplete profile
  // — getGithubProfile is what turns that into a served (marked) result.
  const profile = await getGithubProfile(login);

  assert.ok(profile, "a partial profile is still served, not an error page");
  assert.equal(profile!.complete, false);
  assert.deepEqual(profile!.missingYears, [CURRENT_YEAR]);
  assert.equal(profile!.contributionsByYear.length, 0, "the unresolved year is omitted, never a fabricated zero-commit entry");
  assert.equal(profile!.degraded, false, "still real (partial) GraphQL data, not the REST fallback");
});

test("a secondary rate limit on a window retries with backoff and still resolves the real value", async (t) => {
  restore(t);
  const login = "secondary-limited";
  const fixture: Fixture = { login, createdAt: `${CURRENT_YEAR}-01-01T00:00:00Z`, followers: 10, repoStars: 1 };
  let yearAttempts = 0;

  (globalThis as { fetch: typeof fetch }).fetch = (async (url: string, init?: RequestInit) => {
    if (typeof url !== "string" || !url.includes("/graphql")) throw new Error(`unexpected fetch: ${url}`);
    const { query } = JSON.parse(init!.body as string) as { query: string };
    if (isCreatedAtProbe(query)) return jsonResponse({ data: { user: { createdAt: fixture.createdAt } } });
    if (isBaseQuery(query)) return jsonResponse(baseProfileBody(fixture));
    if (isLastYearChunk(query)) return jsonResponse(lastYearWindowBody(1));
    if (isYearChunk(query)) {
      yearAttempts++;
      if (yearAttempts === 1) {
        // Secondary limit: remaining stays high, no Retry-After — retried
        // with the fixed backoff ladder. retry-after: "0" keeps this test
        // fast without weakening what's being exercised (the retry path).
        return jsonResponse("secondary rate limit exceeded", 403, { "x-ratelimit-remaining": "4800", "retry-after": "0" });
      }
      return jsonResponse(windowAggregateBody(42));
    }
    throw new Error(`unrecognized query: ${query}`);
  }) as typeof fetch;

  const profile = await fetchGithubProfile(login);

  assert.ok(profile);
  assert.equal(profile!.complete, true, "a retried-and-recovered rate limit is not a missing year");
  assert.equal(profile!.contributionsByYear[0].commits, 42);
  assert.equal(yearAttempts, 2, "one 403 then a successful retry");
});

test("getGithubProfile falls back to the REST degraded profile only when GraphQL is entirely unavailable (base query down)", async (t) => {
  restore(t);
  const login = "degradeduser";
  let restCalled = false;

  (globalThis as { fetch: typeof fetch }).fetch = (async (url: string) => {
    if (typeof url === "string" && url.includes("/graphql")) {
      return jsonResponse({}, 503);
    }
    if (typeof url === "string" && url.includes(`/users/${login}/repos`)) {
      return jsonResponse([
        { name: "r", fork: false, stargazers_count: 9, forks_count: 0, language: "TS", created_at: "2020-01-01", pushed_at: "2020-01-01" },
      ]);
    }
    if (typeof url === "string" && url.includes(`/users/${login}`)) {
      restCalled = true;
      return jsonResponse({ login, followers: 77, public_repos: 1, created_at: "2020-01-01T00:00:00Z" });
    }
    throw new Error(`unexpected fetch: ${url}`);
  }) as typeof fetch;

  const profile = await getGithubProfile(login);

  assert.ok(restCalled, "the REST last-resort fallback must run when GraphQL is down");
  assert.ok(profile, "a degraded profile is still a profile, not an error");
  assert.equal(profile!.degraded, true);
  assert.equal(profile!.complete, false);
  assert.equal(profile!.followers, 77);
  assert.equal(profile!.repositories.length, 1);
  assert.equal(profile!.contributionsByYear.length, 0, "contribution history isn't available in the REST fallback");
});

test("getGithubProfile returns null for a genuinely nonexistent user (no REST fallback triggered)", async (t) => {
  restore(t);
  let restCalled = false;

  (globalThis as { fetch: typeof fetch }).fetch = (async (url: string) => {
    if (typeof url === "string" && url.includes("/graphql")) {
      return jsonResponse({ data: { user: null }, errors: [{ type: "NOT_FOUND", message: "Could not resolve to a User" }] });
    }
    restCalled = true;
    return jsonResponse({}, 404);
  }) as typeof fetch;

  const profile = await getGithubProfile("ghost-user-does-not-exist");

  assert.equal(profile, null);
  assert.equal(restCalled, false, "a real 404 must not fall through to the REST degraded path");
});

test("salvages a partial BASE-query response (independent search aliases) but never a partial CONTRIBUTION-WINDOW response", async (t) => {
  restore(t);
  const login = "partialuser";
  const fixture: Fixture = { login, createdAt: `${CURRENT_YEAR}-01-01T00:00:00Z`, followers: 40, repoStars: 12 };

  (globalThis as { fetch: typeof fetch }).fetch = (async (url: string, init?: RequestInit) => {
    if (typeof url !== "string" || !url.includes("/graphql")) throw new Error(`unexpected fetch: ${url}`);
    const { query } = JSON.parse(init!.body as string) as { query: string };
    if (isCreatedAtProbe(query)) return jsonResponse({ data: { user: { createdAt: fixture.createdAt } } });
    if (isBaseQuery(query)) {
      const body = baseProfileBody(fixture);
      return jsonResponse({
        data: { ...body.data, externalMergedPRs: null, closedIssues: null },
        errors: [{ type: "RESOURCE_LIMITS_EXCEEDED", path: ["externalMergedPRs"], message: "too pricey" }],
      });
    }
    if (isLastYearChunk(query)) return jsonResponse(lastYearWindowBody(3));
    if (isYearChunk(query)) return jsonResponse(windowAggregateBody(3));
    throw new Error(`unrecognized query: ${query}`);
  }) as typeof fetch;

  const profile = await fetchGithubProfile(login);

  assert.ok(profile, "a salvageable partial BASE response must yield a profile, not null/throw");
  assert.equal(profile!.followers, 40, "resolved fields survive the salvage");
  assert.equal(profile!.externalMergedPRs, 0, "the nulled expensive alias defaults instead of crashing");
  assert.equal(profile!.complete, true);
});
