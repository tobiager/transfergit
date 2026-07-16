import "server-only";
import { fetchTopContributors } from "./contributors.ts";
import { valuateContributors } from "./valuation.ts";
import { getFormationSlots, DEFAULT_FORMATION, type FormationName } from "./formations.ts";
import { assignRoles } from "./roles.ts";
import { formatMarketValue } from "../format.ts";
import type { Squad, SquadPlayer } from "./types.ts";

export { RepoNotFoundError, NotEnoughPlayersError } from "./contributors.ts";
export { GithubRateLimitError } from "../github.ts";
export type { Squad, SquadPlayer, Starter, Contributor, ContributorValuation, PositionSlot } from "./types.ts";
export type { FormationName } from "./formations.ts";

export async function getRepoSquad(
  owner: string,
  repo: string,
  formation: FormationName = DEFAULT_FORMATION
): Promise<Squad> {
  const contributors = await fetchTopContributors(owner, repo);
  const valuations = await valuateContributors(contributors);
  const valuationByLogin = new Map(valuations.map((v) => [v.login, v]));

  const players: SquadPlayer[] = contributors.map((c) => ({
    ...c,
    ...valuationByLogin.get(c.login)!,
  }));

  const slots = getFormationSlots(players.length, formation);
  const { starters, bench, mvp, captain } = assignRoles(players, slots, owner);

  const totalValue = players.reduce((sum, p) => sum + p.marketValue, 0);

  return {
    owner,
    repo,
    formation,
    starters,
    bench,
    totalValue,
    totalValueFormatted: formatMarketValue(totalValue),
    mvp,
    captain,
  };
}
