import type { PositionSlot, SquadPlayer, Starter } from "./types";

// Strategy interface so alternative ranking criteria (stars, PRs, recent
// activity...) can be plugged in later without touching the orchestrator.
export interface RoleAssignmentStrategy {
  rank(players: SquadPlayer[]): SquadPlayer[];
}

// Highest commit count first; ties broken alphabetically by login so the
// assignment is deterministic.
export class CommitsRoleStrategy implements RoleAssignmentStrategy {
  rank(players: SquadPlayer[]): SquadPlayer[] {
    return [...players].sort((a, b) => b.commits - a.commits || a.login.localeCompare(b.login));
  }
}

export interface RoleAssignment {
  starters: Starter[];
  bench: SquadPlayer[];
  mvp: SquadPlayer;
  captain: SquadPlayer;
}

// Assigns the top-ranked players to `slots` (slot 0 = most commits, e.g. the
// centre-forward; the last slot, always the goalkeeper, gets the fewest),
// the rest to the bench, then picks the MVP (highest market value across the
// whole squad) and captain (repo owner if they're among the contributors,
// otherwise the top committer).
export function assignRoles(
  players: SquadPlayer[],
  slots: PositionSlot[],
  repoOwner: string,
  strategy: RoleAssignmentStrategy = new CommitsRoleStrategy()
): RoleAssignment {
  const ranked = strategy.rank(players);

  const starters: Starter[] = ranked
    .slice(0, slots.length)
    .map((player, i) => ({ ...player, position: slots[i] }));
  const bench = ranked.slice(slots.length);

  // Pending valuations (marketValue null) never outrank a known value.
  const mvp = ranked.reduce((best, p) => ((p.marketValue ?? -1) > (best.marketValue ?? -1) ? p : best), ranked[0]);
  const captain =
    ranked.find((p) => p.login.toLowerCase() === repoOwner.toLowerCase()) ?? ranked[0];

  return { starters, bench, mvp, captain };
}
