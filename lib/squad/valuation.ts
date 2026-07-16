import "server-only";
import { fetchGithubProfile } from "../github.ts";
import { computeValuationTimeline } from "../valuation.ts";
import { computePosition } from "../positions.ts";
import { resolveNationality } from "../geo.ts";
import type { Contributor, ContributorValuation } from "./types.ts";

const CONCURRENCY = 2;

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

function emptyValuation(login: string): ContributorValuation {
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

// Fetches each contributor's full GitHub profile — the same one that powers
// their individual /login card — and reuses the exact same market-value
// formula, so a player's squad valuation always matches their Transfergit
// profile number instead of a cheaper repo-scoped approximation. A squad
// fans out into many of these (up to 2 GraphQL calls × 30 contributors), so
// one contributor hitting a transient GitHub API hiccup degrades to a
// zeroed entry instead of failing the whole squad.
async function valuateOne(login: string): Promise<ContributorValuation> {
  let profile;
  try {
    profile = await fetchGithubProfile(login);
  } catch (err) {
    if (err instanceof Error && err.message.includes("GITHUB_TOKEN")) throw err;
    return emptyValuation(login);
  }

  // Can happen for orgs/deleted accounts still listed as a REST contributor.
  if (!profile) return emptyValuation(login);

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

export async function valuateContributors(contributors: Contributor[]): Promise<ContributorValuation[]> {
  return runWithConcurrency(contributors, CONCURRENCY, (c) => valuateOne(c.login));
}
