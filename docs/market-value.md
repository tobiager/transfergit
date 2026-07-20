# Market value formula

Formula and constants live in [`lib/valuation.ts`](../lib/valuation.ts) (`computeMarketValue`). It's deliberately a
flat, tunable set of constants — no ML, no external pricing data.

```
baseValue = 50,000                                        (BASE_VALUE)
          + commitsTotal        × 800                      (COMMIT_WEIGHT)
          + starsTotal          × 4,000                     (STAR_WEIGHT)
          + followers           × 6,000                     (FOLLOWER_WEIGHT)
          + prsTotal            × 2,500                      (PR_WEIGHT)
          + reposOver10Stars    × 25,000                     (POPULAR_REPO_WEIGHT, threshold: >10 stars)

formMultiplier = 1 + min(commitsLast12Months / 2,000, 0.5)   (up to +50%)

ageMultiplier  = 0.8   if accountAgeYears < 2               (young prospect)
               = 1.1   if accountAgeYears > 6               (veteran)
               = 1.0   otherwise

marketValue = baseValue × formMultiplier × ageMultiplier
```

Result is rounded by `roundMarketValue` ([`lib/format.ts`](../lib/format.ts)) to the nearest €25k (<€1m), €100k
(<€1bn), or €10m (≥€1bn), then formatted as `€850k` / `€2.50m` / `€1.20bn`.

## Inputs, where they come from

All inputs are `ValuationInput` fields, sourced from a `GithubProfile` ([`lib/github.ts`](../lib/github.ts)) via:

- **Player card** ([`lib/valuation.ts`](../lib/valuation.ts) `computeValuationTimeline`): full profile — repos,
  contributionsCollection per year, followers.
- **Repo Squad, tier 1** ([`lib/squad/valuation.ts`](../lib/squad/valuation.ts) `toContributorValuation`): the same
  formula, fed by the same GraphQL profile fetch, called per contributor.

`computeValuationTimeline` also produces a **year-by-year history** for the player card's chart — GitHub doesn't
expose historical stars/followers, so past years use an approximation: repos already created by that year keep
their *current* star count, and every year uses *current* followers. This is a documented, deliberate
simplification (see the comment above `computeValuationTimeline`), not a bug — it's what makes a "market value
evolution" chart possible without a time-series data source.

## Squad valuation fallbacks (tier 1 only)

`lib/squad/valuation.ts` has three quality levels, in order of preference — see that file for the full comment
with real cost numbers:

1. **Full GraphQL profile** (`fetchGraphqlValuation`) — same formula, same quality as the player card.
2. **REST fallback** (`fetchRestValuation`) — used when the GraphQL profile query is deterministically too
   expensive for GitHub's per-request resource limit (`GithubQueryTooExpensiveError`) or the GraphQL budget is
   low. One cheap `GET /users/{login}` call recovers `followers` + account age; `commitsTotal`, `starsTotal`,
   `prsTotal`, `commitsLast12Months` are all `0` in this path, so it's a **floor value, not the real one** — a
   later successful full fetch overwrites it.
3. **Pending** (`—`, `marketValue: null`) — both failed and no cached value exists for this login. Excluded from
   `Squad.totalValue`, never counted as €0. A genuinely-nonexistent/org account (GraphQL resolves but has no
   usable profile) *is* a real `€0` (`zeroValuation`), which is different from pending.

## Reserves (tier 2, roster positions 31–100)

Never valued at all — `ReservePlayer` only has `login`/`avatarUrl`/`commits` from the one contributors REST call.
No market value is computed or shown for reserves.
