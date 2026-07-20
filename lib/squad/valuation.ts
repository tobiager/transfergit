import "server-only";
import { getGithubProfile, getLastGithubRateLimitStatus } from "../github.ts";
import { computeValuationTimeline } from "../valuation.ts";
import { computePosition } from "../positions.ts";
import { resolveNationality } from "../geo.ts";
import { mapWithConcurrency } from "../concurrency.ts";
import type { Contributor, ContributorValuation } from "./types.ts";

// Each valuation is one getGithubProfile call — which itself already fans
// out into several small chunked GraphQL requests run with its own bounded
// concurrency (see lib/github.ts) — so this governs how many CONTRIBUTORS
// are in flight at once, not raw request count. Kept generous since
// getGithubProfile's own cache + coalescing absorbs duplicate/overlapping
// work across concurrent renders.
const CONCURRENCY = 6;

interface ValuationTally {
  cache: number;
  fetch: number;
  fallback: number;
}
// ponytail: no hit/miss signal is exposed for getGithubProfile's internal
// caches, so a cache hit (fresh OR stale-served) is inferred from latency.
const CACHE_LATENCY_THRESHOLD_MS = 50;

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

function toContributorValuation(
  login: string,
  profile: NonNullable<Awaited<ReturnType<typeof getGithubProfile>>>
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

// A contributor's market value, from the SAME shared, cached, coalesced
// profile fetcher every other route uses (getGithubProfile — see
// lib/github.ts): chunked GraphQL, REST-degraded last resort, 24h/10min
// two-tier caching and stale-on-error already happen there, so this doesn't
// duplicate any of it. A genuinely-missing/org account resolves to a real
// €0 (not a failure); getGithubProfile throwing (GraphQL AND REST both
// down, or an unrecoverable GITHUB_TOKEN config error) is the only path
// that reaches the caller's own stale-known-good/pending fallback below.
export async function fetchValuation(login: string): Promise<ContributorValuation> {
  const profile = await getGithubProfile(login);
  return profile ? toContributorValuation(login, profile) : zeroValuation(login);
}

// Same-process fast path: the last valuation that actually succeeded for a
// login, kept only for this server instance's lifetime — a second line of
// defense for whenever getGithubProfile's own stale-on-error has nothing
// (a login that has never once succeeded from this instance).
const lastKnownGood = new Map<string, ContributorValuation>();

// Request coalescing across concurrent renders asking for the same login at
// the same time. getGithubProfile already coalesces the underlying profile
// fetch itself, so this is a thin extra layer over the (cheap) valuation
// math, not a duplicate of the network-level coalescing.
const inFlight = new Map<string, Promise<ContributorValuation>>();

function valuateOne(login: string, tally: ValuationTally): Promise<ContributorValuation> {
  const existing = inFlight.get(login);
  if (existing) return existing;

  const start = Date.now();
  const promise = fetchValuation(login)
    .then((valuation) => {
      tally[Date.now() - start < CACHE_LATENCY_THRESHOLD_MS ? "cache" : "fetch"]++;
      lastKnownGood.set(login, valuation);
      return valuation;
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

export async function valuateContributors(contributors: Contributor[]): Promise<ContributorValuation[]> {
  const start = Date.now();
  const tally: ValuationTally = { cache: 0, fetch: 0, fallback: 0 };
  const results = await mapWithConcurrency(contributors, CONCURRENCY, (c) => valuateOne(c.login, tally));
  const budget = getLastGithubRateLimitStatus();
  console.warn(
    `[squad] valuations: ${tally.cache} cache, ${tally.fetch} fetch, ${tally.fallback} fallback (of ${contributors.length})` +
      (budget ? ` — GitHub budget ${budget.remaining}/${budget.limit}` : "")
  );
  console.warn(`[squad] timing: valuation ${Date.now() - start}ms`);
  return results;
}
