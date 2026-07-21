import "server-only";
import { fetchLightSquadProfiles, getLastGithubRateLimitStatus, type LightGithubProfile } from "../github.ts";
import { computeMarketValue } from "../valuation.ts";
import { formatMarketValue, calculateAgeYears } from "../format.ts";
import { resolveNationality } from "../geo.ts";
import type { Contributor, ContributorValuation } from "./types.ts";

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

// Squad valuation deliberately has no per-year contribution history (that's
// the deep /[username] pipeline's job, see lib/github.ts's getGithubProfile)
// — commitsTotal/prsTotal/commitsLast12Months are always 0 here, same
// reduced formula computeValuationTimeline already falls back to when a
// profile has no year data at all.
function toContributorValuation(login: string, profile: LightGithubProfile): ContributorValuation {
  const nationality = resolveNationality(profile.location);
  const marketValue = computeMarketValue({
    commitsTotal: 0,
    starsTotal: profile.starsTotal,
    followers: profile.followers,
    prsTotal: 0,
    reposOver10Stars: profile.reposOver10Stars,
    commitsLast12Months: 0,
    accountAgeYears: calculateAgeYears(profile.createdAt),
  });

  return {
    login,
    followers: profile.followers,
    starsTotal: profile.starsTotal,
    mainLanguage: profile.topLanguage,
    countryName: nationality.countryName,
    countryIso2: nationality.iso2,
    marketValue,
    marketValueFormatted: formatMarketValue(marketValue),
  };
}

// Same-process fast path: the last valuation that actually succeeded for a
// login, kept only for this server instance's lifetime — a second line of
// defense for whenever the light batch fetch (lib/github.ts) hard-fails
// (GraphQL down, not just a missing user).
const lastKnownGood = new Map<string, ContributorValuation>();

// A contributor's market value, from the shared light batch fetcher every
// squad valuation goes through (fetchLightSquadProfiles — see lib/github.ts):
// aliased GraphQL batching, 24h caching and coalescing already happen
// there. A genuinely-missing/org account resolves to a real €0 (not a
// failure); a hard failure falls back to this instance's lastKnownGood, or
// pendingValuation as the last resort.
export async function valuateContributors(contributors: Contributor[]): Promise<ContributorValuation[]> {
  const start = Date.now();
  let zero = 0;
  let fallback = 0;

  let profiles: Map<string, LightGithubProfile | null>;
  try {
    profiles = await fetchLightSquadProfiles(contributors.map((c) => c.login));
  } catch (err) {
    if (err instanceof Error && err.message.includes("GITHUB_TOKEN")) throw err;
    profiles = new Map();
  }

  const results = contributors.map((c) => {
    const profile = profiles.get(c.login);
    if (profile) {
      const valuation = toContributorValuation(c.login, profile);
      lastKnownGood.set(c.login, valuation);
      return valuation;
    }
    if (profiles.has(c.login)) {
      // Fetched successfully, but the login genuinely doesn't resolve to a
      // user (org/deleted account still listed as a REST contributor).
      zero++;
      return zeroValuation(c.login);
    }
    fallback++;
    return lastKnownGood.get(c.login) ?? pendingValuation(c.login);
  });

  const budget = getLastGithubRateLimitStatus();
  console.warn(
    `[squad] valuations: ${results.length - zero - fallback} fetched, ${zero} zero, ${fallback} fallback (of ${contributors.length})` +
      (budget ? ` — GitHub budget ${budget.remaining}/${budget.limit}` : "")
  );
  console.warn(`[squad] timing: valuation ${Date.now() - start}ms`);
  return results;
}
