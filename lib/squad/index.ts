import "server-only";
import { unstable_cache } from "next/cache.js";
import { fetchTopContributors } from "./contributors.ts";
import { valuateContributors } from "./valuation.ts";
import { resolveFormation, getFormationOptions, CUSTOM_FORMATION, type FormationName } from "./formations.ts";
import { assignRoles } from "./roles.ts";
import { decodeLayout, applyCustomLayout } from "./customLayout.ts";
import { formatMarketValue } from "../format.ts";
import type { Squad, SquadPlayer, ReservePlayer } from "./types.ts";

export { RepoNotFoundError, NotEnoughPlayersError } from "./contributors.ts";
export { GithubRateLimitError } from "../github.ts";
export type { Squad, SquadPlayer, Starter, Contributor, ContributorValuation, ReservePlayer, PositionSlot } from "./types.ts";
export type { FormationName } from "./formations.ts";

// Tier 1 (roster positions 1-30) get a full batched valuation, same as
// before this ever grew past 30 contributors. Tier 2 (31-100) are reserves:
// exposed with only what fetchTopContributors' single REST call already
// returned (avatar/username/commits), with zero extra API cost — see
// lib/squad/valuation.ts's cost-model comment for the full accounting.
const TIER1_SIZE = 30;
// A repo's contributor set and their valuations barely move day to day —
// caching the whole assembled squad (not just each player's valuation)
// means a second visit skips contributors + valuation + role assignment
// entirely instead of re-running the pipeline against warm per-login
// caches. Shorter than the 24h per-valuation cache so a squad still picks
// up newly-recovered valuations (see lib/squad/valuation.ts) well within a
// day rather than being stuck on whatever failed the first time.
const SQUAD_CACHE_TTL_SECONDS = 21600;

// The expensive, FORMATION-INDEPENDENT half of a squad: the contributor set,
// their valuations, and the one authoritative total. This — not the fully
// assembled Squad — is what gets cached, so the live page and every export
// route (OG PNG, dynamic SVG) share the exact same valued roster and the
// exact same total regardless of which formation each one requests. Folding
// the formation into the cache key (as this used to) split the page
// (formation=undefined) and the exports (formation="433") into separate
// cache entries that recomputed independently and could diverge — that's what
// let the page read €384m while the social banner read €7.50m off its own
// cold, mostly-pending recompute.
interface ValuedSquad {
  owner: string;
  repo: string;
  players: SquadPlayer[];
  reserves: ReservePlayer[];
  totalValue: number;
  totalValueFormatted: string;
  pendingValuations: string[];
}

async function computeValuedSquad(owner: string, repo: string): Promise<ValuedSquad> {
  const totalStart = Date.now();
  const contributors = await fetchTopContributors(owner, repo);
  const tier1 = contributors.slice(0, TIER1_SIZE);
  const reserves = contributors.slice(TIER1_SIZE);

  const valuations = await valuateContributors(tier1);
  const valuationByLogin = new Map(valuations.map((v) => [v.login, v]));

  const players: SquadPlayer[] = tier1.map((c) => ({
    ...c,
    ...valuationByLogin.get(c.login)!,
  }));

  // Computed ONCE here and carried in the object — no route or component ever
  // re-derives it by summing partial valuations. Pending valuations (fetch
  // failed, no cache to fall back to) are excluded from the total rather than
  // counted as €0.
  const totalValue = players.reduce((sum, p) => sum + (p.marketValue ?? 0), 0);
  const pendingValuations = players.filter((p) => p.valuationPending).map((p) => p.login);

  console.warn(`[squad] timing: computeValuedSquad total ${Date.now() - totalStart}ms`);

  return {
    owner,
    repo,
    players,
    reserves,
    totalValue,
    totalValueFormatted: formatMarketValue(totalValue),
    pendingValuations,
  };
}

// Applies a formation on top of the cached valued squad — pure, in-memory,
// cheap (role/slot assignment only), so it runs per request without touching
// the cache. Only the slot assignment depends on the formation; the roster,
// valuations and total do not.
function assembleSquad(valued: ValuedSquad, requestedFormation?: FormationName): Squad {
  const { players, owner, repo } = valued;
  const formation = resolveFormation(players.length, requestedFormation);
  const formationOptions = getFormationOptions(players.length).map((o) => o.name);
  const { starters, bench, mvp, captain } = assignRoles(players, formation.slots, owner);

  return {
    owner,
    repo,
    formation: formation.name,
    formationOptions,
    starters,
    bench,
    reserves: valued.reserves,
    totalValue: valued.totalValue,
    totalValueFormatted: valued.totalValueFormatted,
    mvp,
    captain,
    pendingValuations: valued.pendingValuations,
  };
}

function squadCacheTag(owner: string, repo: string): string {
  return `squad:${owner}/${repo}`;
}

// Same "no Next runtime in node --test" fallback as valuation.ts's
// cachedOrDirectFetchValuation — see that file's comment. Tags need to be
// per-repo, and unstable_cache's tags option is fixed at wrap time, so the
// wrapper is (re)created per call rather than once at module scope — the
// cache key itself (owner/repo, via keyParts + args) stays consistent across
// invocations regardless. Note the key deliberately has NO formation part:
// see the ValuedSquad comment.
async function getCachedValuedSquad(owner: string, repo: string): Promise<ValuedSquad> {
  const cached = unstable_cache(computeValuedSquad, ["squad-repo-squad", owner, repo], {
    revalidate: SQUAD_CACHE_TTL_SECONDS,
    tags: [squadCacheTag(owner, repo)],
  });
  try {
    return await cached(owner, repo);
  } catch (err) {
    if (err instanceof Error && err.message.includes("incrementalCache")) {
      return computeValuedSquad(owner, repo);
    }
    throw err;
  }
}

export async function getRepoSquad(owner: string, repo: string, requestedFormation?: FormationName): Promise<Squad> {
  const start = Date.now();
  const valued = await getCachedValuedSquad(owner, repo);
  const squad = assembleSquad(valued, requestedFormation);
  console.warn(`[squad] timing: getRepoSquad (outer, incl. cache) ${Date.now() - start}ms`);
  return squad;
}

export interface SquadFormationParams {
  formation?: string | null;
  base?: string | null;
  layout?: string | null;
}

// The one place that turns a ?formation=&base=&layout= query (the live
// page's URL — see components/squad/SquadInteractive.tsx — and now every
// export route, so an export is exactly what's on screen) into a resolved
// Squad. formation=custom needs base to know which standard formation's
// role/slot assignment the drag started from; layout then overrides each
// starter's position on top of that. Every caller (the page, the OG PNG
// route, the SVG route) must go through this so a shared/exported link
// reproduces the exact same on-screen arrangement.
export async function getSquadFromParams(
  owner: string,
  repo: string,
  params: SquadFormationParams
): Promise<{ squad: Squad; baseFormation: FormationName }> {
  const isCustom = params.formation === CUSTOM_FORMATION;
  const requestedFormation = isCustom ? (params.base ?? undefined) : (params.formation ?? undefined);
  const squad = await getRepoSquad(owner, repo, requestedFormation);
  // The real, resolved standard formation this squad's roles/slots are built
  // from — captured before any custom override, since it's also what
  // "Reset formation" (the live page) should return to.
  const baseFormation = squad.formation;
  if (isCustom && params.layout) {
    return { squad: applyCustomLayout(squad, decodeLayout(params.layout)), baseFormation };
  }
  return { squad, baseFormation };
}
