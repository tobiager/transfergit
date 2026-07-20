# Repo Squad pipeline

Turns a GitHub repo's contributors into a fielded football squad. Entry point: `getRepoSquad` /
`getSquadFromParams` in [`lib/squad/index.ts`](../lib/squad/index.ts).

## 1. Contributors — [`lib/squad/contributors.ts`](../lib/squad/contributors.ts)

One REST call: `GET /repos/{owner}/{repo}/contributors?per_page=100&anon=false`. This is REST, not GraphQL, because
GitHub's GraphQL API has no per-repo contributor-stats field.

- **Bot filter**: `type === "Bot"` or a login ending in `[bot]` is dropped before anything else.
- Sorted by `contributions` (commits) descending.
- Requires at least **3 human contributors** (`MIN_HUMAN_CONTRIBUTORS`) — fewer throws `NotEnoughPlayersError`,
  rendered as `SquadEmptyState` on the page and a 200-status placeholder image on exports.
- Capped at **100** (`MAX_ROSTER_SIZE`, GitHub's own `per_page` ceiling for this endpoint).
- Unknown/missing repo → `RepoNotFoundError` (404 from GitHub) → Next.js `notFound()`.

## 2. Two tiers

Defined in [`lib/squad/index.ts`](../lib/squad/index.ts):

| Tier | Roster positions | Valuation | Type |
|---|---|---|---|
| 1 | 1–30 (`TIER1_SIZE`) | Full — GraphQL profile fetch, real market value | `SquadPlayer` |
| 2 | 31–100 | **None** — no extra API call, just login/avatar/commits from the tier-1 contributors fetch | `ReservePlayer` |

Tier 2 exists purely to show "+N more contributors" without paying for 70 more GraphQL profile fetches. Reserves
never appear on the pitch or bench, only in the reserves list/count. See [`market-value.md`](market-value.md) for
what tier 1's valuation actually costs.

## 3. Formation resolution and role assignment

`getFormationOptions(humanCount)` ([`lib/squad/formations.ts`](../lib/squad/formations.ts)) returns every selectable
formation for the squad's size (full detail in [`formations.md`](formations.md)). `assignRoles`
([`lib/squad/roles.ts`](../lib/squad/roles.ts)) then:

1. Ranks all tier-1 players by **commit count**, ties broken alphabetically by login (deterministic).
2. Assigns the top N (N = slot count) to starters — slot 0 (highest-commit slot, e.g. the centre-forward) gets the
   most-committed player, the last slot (always GK) gets the least.
3. Everyone past the slot count becomes bench.
4. **MVP** = highest `marketValue` across the *whole* squad (starters + bench) — a pending valuation (`null`) never
   outranks a known value.
5. **Captain** = the repo owner, if they're among the contributors (case-insensitive login match); otherwise the
   top committer (`ranked[0]`).

This is pluggable (`RoleAssignmentStrategy` interface, currently only `CommitsRoleStrategy` exists) but nothing else
implements it today.

## 4. Custom (drag-and-drop) formations

A user can drag any starter chip on the pitch ([`components/squad/SquadPitch.tsx`](../components/squad/SquadPitch.tsx)).
This never changes *who* plays where (role assignment is untouched) — only each starter's `position.x/y`.

- [`lib/squad/customLayout.ts`](../lib/squad/customLayout.ts) encodes the dragged positions as a compact,
  human-readable string: `SLOTID:x,y;SLOTID:x,y;...` (one decimal place per axis), keyed by **slot id** (`GK`,
  `CB_L`, ...), not player login — the slot's role tag stays with whoever was assigned to it.
- The live page persists this to the URL via `history.replaceState` (no full navigation per drag):
  `?formation=custom&base=433&layout=GK:50.0,0.0;...`. `base` records which standard formation the drag started
  from, so "Reset formation" and re-deriving role assignment both know the real underlying shape.
- `applyCustomLayout` re-applies a decoded layout on top of an already-resolved `Squad`.

## 5. Small-sided mode

Squads with **≤7 human contributors** (`SMALL_SIDED_MAX`) render on a compressed half-pitch (futsal-style: one
penalty box, halfway line near the top) instead of a full 11-a-side pitch stretched over mostly-empty grass —
`isSmallSided()` in [`lib/squad/formations.ts`](../lib/squad/formations.ts). Chip scale also grows as the squad
shrinks (`chipScale()`: 1× at 11, 1.15× at 8-10, 1.4× below that) so a 3-a-side repo doesn't look like three dots
lost on a full pitch.

## Types

`Squad`, `SquadPlayer`, `Starter`, `ReservePlayer`, `PositionSlot` — all in
[`lib/squad/types.ts`](../lib/squad/types.ts). `Squad.pendingValuations` lists logins whose valuation fetch failed
with no cached fallback (excluded from `totalValue`, shown as "—" in the UI, not €0).

## Tests

[`lib/squad/*.test.ts`](../lib/squad/) — `contributors`, `customLayout`, `formations`, `index`, `pitchLayout`,
`roles`, `textFit`, `valuation`. Run with `npm test`.
