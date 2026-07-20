import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchTopContributors, RepoNotFoundError, NotEnoughPlayersError } from "./contributors.ts";

function mockFetchOnce(status: number, body: unknown) {
  (globalThis as { fetch: typeof fetch }).fetch = (async () =>
    ({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
      text: async () => JSON.stringify(body),
    }) as Response) as typeof fetch;
}

test("filters out bot accounts (type Bot and [bot] suffix)", async () => {
  mockFetchOnce(200, [
    { login: "alice", avatar_url: "a", contributions: 50, type: "User" },
    { login: "dependabot[bot]", avatar_url: "d", contributions: 40, type: "Bot" },
    { login: "renovate-bot", avatar_url: "r", contributions: 30, type: "User" },
    { login: "bob", avatar_url: "b", contributions: 20, type: "User" },
    { login: "carol", avatar_url: "c", contributions: 10, type: "User" },
  ]);

  const contributors = await fetchTopContributors("owner", "repo");

  assert.deepEqual(
    contributors.map((c) => c.login),
    ["alice", "renovate-bot", "bob", "carol"]
  );
});

test("throws RepoNotFoundError on 404", async () => {
  mockFetchOnce(404, {});
  await assert.rejects(() => fetchTopContributors("owner", "missing"), RepoNotFoundError);
});

test("throws NotEnoughPlayersError with fewer than 3 humans", async () => {
  mockFetchOnce(200, [
    { login: "alice", avatar_url: "a", contributions: 50, type: "User" },
    { login: "bot[bot]", avatar_url: "d", contributions: 40, type: "Bot" },
  ]);
  await assert.rejects(() => fetchTopContributors("owner", "repo"), NotEnoughPlayersError);
});

test("requests per_page=100 (still one REST call) and returns a 100-person roster with bots filtered", async () => {
  const humans = Array.from({ length: 90 }, (_, i) => ({
    login: `human${i}`,
    avatar_url: "x",
    contributions: 100 - i,
    type: "User" as const,
  }));
  const bots = Array.from({ length: 15 }, (_, i) => ({
    login: `renovate${i}[bot]`,
    avatar_url: "x",
    contributions: 50,
    type: "Bot" as const,
  }));

  let requestedUrl = "";
  let requestCount = 0;
  (globalThis as { fetch: typeof fetch }).fetch = (async (url: string) => {
    requestCount++;
    requestedUrl = url;
    return { ok: true, status: 200, json: async () => [...humans, ...bots], text: async () => "" } as Response;
  }) as typeof fetch;

  const contributors = await fetchTopContributors("owner", "repo");

  assert.equal(requestCount, 1, "the whole 100-person roster comes from a single REST call");
  assert.match(requestedUrl, /per_page=100/);
  assert.equal(contributors.length, 90, "all 90 humans come back, bots filtered out");
  assert.ok(contributors.every((c) => !c.login.includes("[bot]")));
});
