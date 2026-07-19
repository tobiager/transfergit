import "server-only";
import { unstable_cache } from "next/cache.js";
import {
  fetchGithubProfile,
  GithubRateLimitError,
  GithubQueryTooExpensiveError,
  getLastGithubRateLimitStatus,
} from "../github.ts";
import { computeValuationTimeline, computeMarketValue } from "../valuation.ts";
import { computePosition } from "../positions.ts";
import { resolveNationality } from "../geo.ts";
import { calculateAgeYears, formatMarketValue } from "../format.ts";
import type { Contributor, ContributorValuation } from "./types.ts";

// --- Cost model (see the comment on valuateContributors for the numbers) -
// Each valuation is 1-2 sequential GraphQL round trips (see
// fetchGithubProfile) — GitHub's per-token GraphQL endpoint has no documented
// hard concurrency cap below the points-based hourly budget (already guarded
// by RATE_LIMIT_BUDGET_FLOOR), so this governs wall-clock latency, not
// safety. 2 was overly conservative: a cold render with several
// expensive/rate-limited accounts (each taking seconds to respond) serialized
// into 60-80s end to end. 6 cuts that roughly 3x while still leaving slack
// under the budget floor.
const CONCURRENCY = 6;
const RETRY_DELAY_MS = 300;
const VALUATION_CACHE_TTL_SECONDS = 86400;
// A login that has never once succeeded gets retried at most this often —
// see the two-tier caching comment above cachedAttempt below.
const NEGATIVE_CACHE_TTL_SECONDS = 600;
// Stop starting new fetches once less than this fraction of the hourly
// GraphQL point budget remains — the rest of the batch falls back to
// stale/pending instead of risking starving every other visitor.
const RATE_LIMIT_BUDGET_FLOOR = 0.1;
// ponytail: no hit/miss signal is exposed for internal fetch()/unstable_cache
// calls, so a cache hit (fresh OR stale-served) is inferred from latency.
// Upgrade to a real signal if Next ever exposes one.
const CACHE_LATENCY_THRESHOLD_MS = 50;

interface ValuationTally {
  cache: number;
  fetch: number;
  fallback: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

// A contributor account that genuinely has no valuation data (org/deleted
// account still listed as a REST contributor) — a real €0, not a failure.
function zeroValuation(login: string): ContributorValuation {
  return {
    login,
    followers: 0,
    starsTotal: 0,
    mainLanguage: null,
    countryName: null,
    countryIso2: null,
    marketValue: 0,
    marketValueFormatted: "€0",
  };
}

// A valuation that could not be fetched, has no prior cached value to fall
// back to (cross-invocation or same-process), and has never succeeded even
// once. The last resort — must never be summed as €0.
function pendingValuation(login: string): ContributorValuation {
  return {
    login,
    followers: 0,
    starsTotal: 0,
    mainLanguage: null,
    countryName: null,
    countryIso2: null,
    marketValue: null,
    marketValueFormatted: "—",
    valuationPending: true,
  };
}

// Secondary fallback for a login whose full GraphQL profile query is
// deterministically too expensive to run (GithubQueryTooExpensiveError —
// GitHub returns 200 + RESOURCE_LIMITS_EXCEEDED with data.user === null; see
// lib/github.ts). One cheap REST call to /users/{login} — which is NOT
// subject to the GraphQL per-request cost limit — recovers followers +
// account age, enough for a real (if reduced) market value via the same
// formula, instead of a permanent "—". Stars/commit-history aren't in this
// REST payload, so the value is a floor, not the full valuation; a later
// render whose GraphQL query does succeed replaces it. Returns null (→ caller
// falls back to pending) only if REST itself fails.
async function fetchRestValuation(login: string): Promise<ContributorValuation | null> {
  const token = process.env.GITHUB_TOKEN;
  try {
    const res = await fetch(`https://api.github.com/users/${login}`, {
      headers: {
        Accept: "application/vnd.github+json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      next: { revalidate: VALUATION_CACHE_TTL_SECONDS },
    });
    if (!res.ok) return null;
    const u = (await res.json()) as { followers?: number; created_at?: string; location?: string | null };
    const followers = u.followers ?? 0;
    const accountAgeYears = u.created_at ? calculateAgeYears(u.created_at) : 0;
    const marketValue = computeMarketValue({
      commitsTotal: 0,
      starsTotal: 0,
      followers,
      prsTotal: 0,
      reposOver10Stars: 0,
      commitsLast12Months: 0,
      accountAgeYears,
    });
    const nationality = resolveNationality(u.location ?? null);
    console.warn(`[squad] REST fallback valuation for ${login} (followers=${followers}, value=${marketValue})`);
    return {
      login,
      followers,
      starsTotal: 0,
      mainLanguage: null,
      countryName: nationality.countryName,
      countryIso2: nationality.iso2,
      marketValue,
      marketValueFormatted: formatMarketValue(marketValue),
    };
  } catch {
    return null;
  }
}

function toContributorValuation(
  login: string,
  profile: NonNullable<Awaited<ReturnType<typeof fetchGithubProfile>>>
): ContributorValuation {
  const { topLanguage } = computePosition(profile.repositories);
  const nationality = resolveNationality(profile.location);
  const valuation = computeValuationTimeline(profile);
  const starsTotal = profile.repositories.reduce((sum, r) => sum + r.stars, 0);

  return {
    login,
    followers: profile.followers,
    starsTotal,
    mainLanguage: topLanguage,
    countryName: nationality.countryName,
    countryIso2: nationality.iso2,
    marketValue: valuation.current,
    marketValueFormatted: valuation.currentFormatted,
  };
}

// Attempts the full-profile GraphQL valuation — the same profile that powers
// the individual /login card, reusing the exact same market-value formula.
// Returns null (NOT throws) when GraphQL can't produce a usable profile, so
// the caller can try the REST fallback; only re-throws the unrecoverable
// GITHUB_TOKEN config error. Failure classes, and why a retry does/doesn't
// help:
//   - GithubQueryTooExpensiveError (200 OK, errors[].type ===
//     RESOURCE_LIMITS_EXCEEDED, data.user null): deterministic — the same
//     query costs the same every time, so a retry is pointless. This is the
//     dominant cause of squad "—"s: long-tenured/active accounts (many
//     contributionsCollection year aliases + a wide external merged-PR
//     search) trip GitHub's per-REQUEST resource limit, independent of the
//     hourly rate budget (x-ratelimit-remaining stays >90%).
//   - GithubRateLimitError (403/429) / budget-guard: the GraphQL hourly
//     budget is low or throttled — no same-request retry (its Retry-After
//     can be minutes). REST is a SEPARATE budget, so falling back there is
//     both cheaper and doesn't wait.
//   - Anything else (network hiccup, GitHub 5xx): one fixed-backoff retry,
//     then REST.
async function fetchGraphqlValuation(login: string): Promise<ContributorValuation | null> {
  const budget = getLastGithubRateLimitStatus();
  if (budget && budget.remaining / budget.limit < RATE_LIMIT_BUDGET_FLOOR) {
    // GraphQL budget low — don't start a new GraphQL fetch; let the caller
    // fall back to REST, which draws on a different budget.
    return null;
  }

  for (let attempt = 0; ; attempt++) {
    try {
      const profile = await fetchGithubProfile(login);
      // A genuinely-missing/org account returns null from fetchGithubProfile
      // → a real €0, not a fetch failure — return it, don't REST-fallback.
      return profile ? toContributorValuation(login, profile) : zeroValuation(login);
    } catch (err) {
      if (err instanceof Error && err.message.includes("GITHUB_TOKEN")) throw err;
      // Deterministic (too expensive) or throttled (rate limit): no retry.
      // Transient: one backoff retry, then give up to REST.
      if (attempt > 0 || err instanceof GithubQueryTooExpensiveError || err instanceof GithubRateLimitError) {
        return null;
      }
      await sleep(RETRY_DELAY_MS);
    }
  }
}

// A contributor's market value. GraphQL first (full-quality); on ANY GraphQL
// failure that isn't "user genuinely doesn't exist" — too-expensive query,
// rate limit, low budget, transient 5xx — fall back to the cheap REST /users
// lookup for a reduced-but-real value. Only when BOTH fail does this throw,
// which the caller (valuateOne) turns into a stale-known-good or, last of
// all, a pending "—". This is what stops long-tenured accounts (whose profile
// query deterministically trips GitHub's per-request resource limit) from
// showing "—" forever on both the live page and every export.
export async function fetchValuation(login: string): Promise<ContributorValuation> {
  const graphql = await fetchGraphqlValuation(login);
  if (graphql) return graphql;

  const rest = await fetchRestValuation(login);
  if (rest) return rest;

  throw new Error(`valuation unavailable for ${login}: GraphQL failed and REST fallback failed`);
}

// Cross-invocation persistence: Next's Data Cache via unstable_cache — the
// same caching primitive the rest of the site already relies on for GitHub
// data (see lib/github.ts's cacheStableNow() note on the profile fetch
// itself), not a plain in-memory Map. When an entry is stale (>24h old),
// Next serves it immediately and attempts a background refresh; if that
// refresh throws — including a login that fails with
// GithubQueryTooExpensiveError on literally every attempt — Next swallows
// the error and keeps serving the last good value indefinitely. That's the
// stale-on-error fallback, for free, from the primitive itself.
const cachedFetchValuation = unstable_cache(fetchValuation, ["squad-contributor-valuation"], {
  revalidate: VALUATION_CACHE_TTL_SECONDS,
});

// unstable_cache needs Next's request-scoped incrementalCache, which only
// exists inside an actual Next.js request — calling it from a plain script
// (this repo's `node --test` suite has no Next runtime) throws. Fall back
// to the uncached path rather than crash; real traffic never takes this
// branch.
async function cachedOrDirectFetchValuation(login: string): Promise<ContributorValuation> {
  try {
    return await cachedFetchValuation(login);
  } catch (err) {
    if (err instanceof Error && err.message.includes("incrementalCache")) {
      return fetchValuation(login);
    }
    throw err;
  }
}

interface AttemptOutcome {
  status: "success" | "failed";
  valuation?: ContributorValuation;
}

// A login that has never once succeeded is a cache MISS on
// cachedFetchValuation above every single time — meaning every render pays
// fetchValuation's full retry+backoff cost again, forever, for exactly the
// accounts that are failing deterministically (GithubQueryTooExpensiveError).
// That's the "6 fallback (of 30), identical on every render" bug.
//
// Fix: a second, SHORTER-lived cache in front of it whose job is only to
// remember "did an attempt just happen" — success or failure alike — for up
// to NEGATIVE_CACHE_TTL_SECONDS. Within that window, a repeat caller gets
// the outcome (fallback or valuation) instantly, no network call. Once the
// window elapses, unstable_cache's own stale-serve-then-background-refresh
// behavior kicks in: the caller still gets an instant answer, but a fresh
// attempt runs in the background — which is exactly "retry only the
// currently-failing logins, at most once per 10 minutes" without a
// hand-rolled batch/scheduler. A successful outcome still flows through
// cachedFetchValuation above, so it durably lands in the 24h cache the
// moment it happens — no separate write path needed.
async function attemptValuation(login: string): Promise<AttemptOutcome> {
  try {
    const valuation = await cachedOrDirectFetchValuation(login);
    return { status: "success", valuation };
  } catch (err) {
    if (err instanceof Error && err.message.includes("GITHUB_TOKEN")) throw err;
    return { status: "failed" };
  }
}

const cachedAttempt = unstable_cache(attemptValuation, ["squad-valuation-attempt"], {
  revalidate: NEGATIVE_CACHE_TTL_SECONDS,
});

async function cachedOrDirectAttempt(login: string): Promise<AttemptOutcome> {
  try {
    return await cachedAttempt(login);
  } catch (err) {
    if (err instanceof Error && err.message.includes("incrementalCache")) {
      return attemptValuation(login);
    }
    throw err;
  }
}

// Same-process fast path: the last valuation that actually succeeded for a
// login, kept only for this server instance's lifetime. This is NOT the
// durable cache (that's unstable_cache above) — it's a best-effort second
// line of defense for whenever even the Data Cache's own stale-on-error
// has nothing (a login that has never once succeeded from this instance),
// and it's what makes stale-on-error independently testable without a
// real Next.js request context — see valuation.test.ts.
const lastKnownGood = new Map<string, ContributorValuation>();

// Tier 1 only (<=30 players get valued — see getRepoSquad): request
// coalescing across concurrent renders asking for the same login at the
// same time. Deliberately process-local, same as lastKnownGood above — the
// durable, cross-invocation guarantee is unstable_cache's job, not this
// map's.
const inFlight = new Map<string, Promise<ContributorValuation>>();

function valuateOne(login: string, tally: ValuationTally): Promise<ContributorValuation> {
  const existing = inFlight.get(login);
  if (existing) return existing;

  const start = Date.now();
  const promise = cachedOrDirectAttempt(login)
    .then((outcome) => {
      if (outcome.status === "success" && outcome.valuation) {
        tally[Date.now() - start < CACHE_LATENCY_THRESHOLD_MS ? "cache" : "fetch"]++;
        lastKnownGood.set(login, outcome.valuation);
        return outcome.valuation;
      }
      tally.fallback++;
      return lastKnownGood.get(login) ?? pendingValuation(login);
    })
    .catch((err) => {
      if (err instanceof Error && err.message.includes("GITHUB_TOKEN")) throw err;
      tally.fallback++;
      return lastKnownGood.get(login) ?? pendingValuation(login);
    })
    .finally(() => inFlight.delete(login));

  inFlight.set(login, promise);
  return promise;
}

// Cost per cold squad (nothing cached, nothing coalesced — the worst case,
// paid at most once per (repo, contributor-set) per 24h thanks to the
// cache above):
//   - REST: 1 request total (fetchTopContributors, per_page=100).
//   - GraphQL: up to 2 requests per TIER 1 player (a createdAt probe + the
//     full profile query — see lib/github.ts) — tier 2 (roster positions
//     31-100) are never valued, so they cost nothing beyond the 1 REST
//     call. At the 30-player tier 1 cap: up to 60 GraphQL requests.
//   - Points: GitHub bills GraphQL against an hourly points budget (5000
//     for a classic PAT), not a flat per-request count. Diagnosed via
//     temporary logging against a real 30-contributor squad: the createdAt
//     probe costs ~1 point; the full profile query costs roughly 1-15+
//     points depending on the account's history (years active, external
//     merged PRs) — and it's exactly the priciest ones (long-tenured,
//     prolific accounts — i.e. the accounts most likely to be a repo's top
//     contributor/captain) that can trip GitHub's per-request resource
//     limit entirely (RESOURCE_LIMITS_EXCEEDED, see
//     GithubQueryTooExpensiveError), independent of the points budget.
//   - Budgeting ~10 points/player worst case: a cold 30-player squad costs
//     roughly 300 points, ~6% of a 5000/hour PAT — comfortably under the
//     10% RATE_LIMIT_BUDGET_FLOOR guard, with room for the createdAt-only
//     tier-2 lookups this feature deliberately skips.
//   - Viral-spike math: that ~300-point cost is paid at most once per day
//     per unique (repo, contributor) combination, not once per page view —
//     coalescing collapses concurrent duplicate requests and the 24h cache
//     serves everything after the first. A single 5000-point/hour PAT can
//     therefore cold-start on the order of 15+ distinct squads an hour
//     while serving unlimited repeat traffic to already-cached ones for
//     free.
export async function valuateContributors(contributors: Contributor[]): Promise<ContributorValuation[]> {
  const start = Date.now();
  const tally: ValuationTally = { cache: 0, fetch: 0, fallback: 0 };
  const results = await runWithConcurrency(contributors, CONCURRENCY, (c) => valuateOne(c.login, tally));
  const budget = getLastGithubRateLimitStatus();
  console.warn(
    `[squad] valuations: ${tally.cache} cache, ${tally.fetch} fetch, ${tally.fallback} fallback (of ${contributors.length})` +
      (budget ? ` — GitHub budget ${budget.remaining}/${budget.limit}` : "")
  );
  console.warn(`[squad] timing: valuation ${Date.now() - start}ms`);
  return results;
}
