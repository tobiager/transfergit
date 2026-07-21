import { test } from "node:test";
import assert from "node:assert/strict";
import { valuateContributors } from "./valuation.ts";
import type { Contributor } from "./types.ts";

const ORIGINAL_TOKEN = process.env.GITHUB_TOKEN;
const CURRENT_YEAR = new Date().getFullYear();
const CREATED_AT = `${CURRENT_YEAR}-01-01T00:00:00Z`;

function jsonResponse(body: unknown, status = 200): Response {
  return { ok: status < 400, status, headers: new Headers(), json: async () => body, text: async () => "" } as unknown as Response;
}

interface Fixture {
  followers: number;
  stars: number;
}

function contributor(login: string): Contributor {
  return { login, avatarUrl: `https://avatars/${login}`, commits: 1 };
}

// Every valuation call is now ONE aliased batch request (up to 10 logins
// per request, see lib/github.ts's fetchLightSquadProfiles) — this mock
// resolves each `loginN` variable to its fixture (or null for a genuinely
// missing GitHub user) and replies with the matching `uN` aliases.
function mockLightBatch(fixtures: Map<string, Fixture | null>) {
  (globalThis as { fetch: typeof fetch }).fetch = (async (url: string, init?: RequestInit) => {
    if (typeof url !== "string" || !url.includes("/graphql")) throw new Error(`unexpected fetch: ${url}`);
    const { variables } = JSON.parse(init!.body as string) as { variables: Record<string, string> };
    const data: Record<string, unknown> = { rateLimit: { cost: 1, remaining: 4999 } };
    for (const [key, login] of Object.entries(variables)) {
      const idx = key.replace("login", "");
      const fixture = fixtures.get(login);
      data[`u${idx}`] =
        fixture === undefined || fixture === null
          ? null
          : {
              login,
              followers: { totalCount: fixture.followers },
              createdAt: CREATED_AT,
              location: null,
              repositories: { nodes: [{ stargazerCount: fixture.stars, primaryLanguage: { name: "TypeScript" } }] },
            };
    }
    return jsonResponse({ data });
  }) as typeof fetch;
}

test("a genuinely missing GitHub user (org/deleted account) values as a real €0, not pending", async (t) => {
  t.after(() => {
    process.env.GITHUB_TOKEN = ORIGINAL_TOKEN;
  });
  process.env.GITHUB_TOKEN = "test-token";
  mockLightBatch(new Map([["alice", { followers: 10, stars: 5 }]]));

  const [alice, ghost] = await valuateContributors([contributor("alice"), contributor("ghost-org")]);

  assert.notEqual(alice.marketValue, null);
  assert.equal(alice.valuationPending, undefined);

  assert.equal(ghost.marketValue, 0);
  assert.equal(ghost.marketValueFormatted, "€0");
  assert.equal(ghost.valuationPending, undefined, "a real zero is not the same as a failed fetch");
});

test("a hard-failing chunk falls back to pending without affecting other chunks", async (t) => {
  t.after(() => {
    process.env.GITHUB_TOKEN = ORIGINAL_TOKEN;
  });
  process.env.GITHUB_TOKEN = "test-token";

  // 11 contributors → two chunks (10 + 1, see LIGHT_PROFILE_BATCH_SIZE):
  // the lone 11th login lands alone in its own chunk, which always 500s.
  const healthy: Contributor[] = Array.from({ length: 10 }, (_, i) => contributor(`user${i}`));
  const failing = contributor("bob");

  (globalThis as { fetch: typeof fetch }).fetch = (async (url: string, init?: RequestInit) => {
    if (typeof url !== "string" || !url.includes("/graphql")) throw new Error(`unexpected fetch: ${url}`);
    const { variables } = JSON.parse(init!.body as string) as { variables: Record<string, string> };
    if (Object.values(variables).includes("bob")) return jsonResponse({}, 500);
    const data: Record<string, unknown> = { rateLimit: { cost: 1, remaining: 4999 } };
    for (const [key, login] of Object.entries(variables)) {
      const idx = key.replace("login", "");
      data[`u${idx}`] = {
        login,
        followers: { totalCount: 10 },
        createdAt: CREATED_AT,
        location: null,
        repositories: { nodes: [{ stargazerCount: 1, primaryLanguage: { name: "TypeScript" } }] },
      };
    }
    return jsonResponse({ data });
  }) as typeof fetch;

  const results = await valuateContributors([...healthy, failing]);

  const bob = results.find((v) => v.login === "bob")!;
  assert.equal(bob.marketValue, null, "a failed chunk must be null, not a fabricated 0");
  assert.equal(bob.valuationPending, true);

  for (const login of healthy.map((c) => c.login)) {
    const v = results.find((r) => r.login === login)!;
    assert.notEqual(v.marketValue, null, `${login} in the healthy chunk must not be affected by bob's chunk failing`);
    assert.equal(v.valuationPending, undefined);
  }
});

test("concurrent renders requesting the same roster coalesce into one in-flight batch", async (t) => {
  t.after(() => {
    process.env.GITHUB_TOKEN = ORIGINAL_TOKEN;
  });
  process.env.GITHUB_TOKEN = "test-token";

  let graphqlCalls = 0;
  const fixtures = new Map([["coalesce-user", { followers: 10, stars: 5 }]]);
  mockLightBatch(fixtures);
  const mocked = globalThis.fetch;
  (globalThis as { fetch: typeof fetch }).fetch = (async (url: string, init?: RequestInit) => {
    graphqlCalls++;
    return mocked(url, init);
  }) as typeof fetch;

  const contributors: Contributor[] = [contributor("coalesce-user")];

  // Two renders asking for the exact same repo/roster at the same time —
  // fired concurrently, not sequentially.
  const [first, second] = await Promise.all([valuateContributors(contributors), valuateContributors(contributors)]);

  assert.equal(graphqlCalls, 1, "two concurrent requests for the same roster must share one in-flight batch");
  assert.equal(first[0].marketValue, second[0].marketValue);
});

test("stale-on-error: a login that succeeded once keeps serving that valuation once a later batch fails", async (t) => {
  t.after(() => {
    process.env.GITHUB_TOKEN = ORIGINAL_TOKEN;
  });
  process.env.GITHUB_TOKEN = "test-token";

  const login = "stale-user";
  let shouldFail = false;
  (globalThis as { fetch: typeof fetch }).fetch = (async (url: string, init?: RequestInit) => {
    if (typeof url !== "string" || !url.includes("/graphql")) throw new Error(`unexpected fetch: ${url}`);
    if (shouldFail) return jsonResponse({}, 500);
    const { variables } = JSON.parse(init!.body as string) as { variables: Record<string, string> };
    const data: Record<string, unknown> = { rateLimit: { cost: 1, remaining: 4999 } };
    for (const [key, l] of Object.entries(variables)) {
      const idx = key.replace("login", "");
      data[`u${idx}`] = {
        login: l,
        followers: { totalCount: 10 },
        createdAt: CREATED_AT,
        location: null,
        repositories: { nodes: [{ stargazerCount: 5, primaryLanguage: { name: "TypeScript" } }] },
      };
    }
    return jsonResponse({ data });
  }) as typeof fetch;

  const contributors: Contributor[] = [contributor(login)];

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
    const { variables } = JSON.parse(init!.body as string) as { variables: Record<string, string> };
    const data: Record<string, unknown> = { rateLimit: { cost: 1, remaining: 4999 } };
    for (const [key, l] of Object.entries(variables)) {
      const idx = key.replace("login", "");
      data[`u${idx}`] = {
        login: l,
        followers: { totalCount: 10 },
        createdAt: CREATED_AT,
        location: null,
        repositories: { nodes: [{ stargazerCount: 5, primaryLanguage: { name: "TypeScript" } }] },
      };
    }
    return jsonResponse({ data });
  }) as typeof fetch;

  const contributors: Contributor[] = [contributor(login)];

  const first = await valuateContributors(contributors);
  assert.equal(first[0].marketValue, null, "the first render should fail and fall back to pending, not a fabricated value");
  assert.equal(first[0].valuationPending, true);

  shouldFail = false;
  const second = await valuateContributors(contributors);
  assert.notEqual(second[0].marketValue, null, "a later successful render must retry and replace the fallback");
  assert.equal(second[0].valuationPending, undefined);
});
