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
  contributionsCollection per year, followers — from `lib/github.ts`'s deep, year-chunked `getGithubProfile`.
- **Repo Squad, tier 1** ([`lib/squad/valuation.ts`](../lib/squad/valuation.ts) `toContributorValuation`): the same
  formula, but fed by a **different, deliberately lighter** fetch — `fetchLightSquadProfiles`
  (`lib/github.ts`), which only returns followers/stars/top-language/account-age via an aliased GraphQL batch (up
  to 10 logins per request). It never fetches per-year contribution history, so `commitsTotal`, `prsTotal`, and
  `commitsLast12Months` are always `0` for a squad contributor — `formMultiplier` is always `1` (no "form" boost) in
  a squad valuation. This is intentional, not a missing feature: see [`data-pipeline.md`](data-pipeline.md) for why
  squad valuation must never go through the deep per-year pipeline the player card uses.

`computeValuationTimeline` also produces a **year-by-year history** for the player card's chart — GitHub doesn't
expose historical stars/followers, so past years use an approximation: repos already created by that year keep
their *current* star count, and every year uses *current* followers. This is a documented, deliberate
simplification (see the comment above `computeValuationTimeline`), not a bug — it's what makes a "market value
evolution" chart possible without a time-series data source.

### Repo count: why the card can show fewer repos than github.com's profile tab

`GithubProfile.repositories` (and therefore `starsTotal`/`reposOver10Stars` above) comes from a GraphQL query with
`ownerAffiliations: OWNER, isFork: false` (see `BASE_PROFILE_QUERY` / `REPO_PAGE_QUERY` in
[`lib/github.ts`](../lib/github.ts)) — **owned, non-fork repos only**. GitHub's own profile "Repositories" tab
counts forks too by default, so a prolific forker's public repo count there is routinely higher than what shows
here. This is a deliberate filter (forked repos add no real stars/authored-code signal to the formula), not a
pagination bug — pagination itself is cursor-based and capped at `MAX_REPO_PAGES` (12 pages / 1,200 repos,
ordered by stars DESC so the capped tail never moves the valuation). Archived repos are **not** filtered out and
still count.

## Fetching, chunking, and completeness

`lib/github.ts`'s `getGithubProfile` is the one fetch/cache entrypoint every **player-card** route (`/[username]`,
its OG/SVG export routes) goes through — Repo Squad valuation deliberately does **not** go through it (see above).
A profile is assembled from several small, year-chunked GraphQL requests rather than one monolithic query — see
[`docs/data-pipeline.md`](data-pipeline.md) for the full chunking/bisection/budget-guard design. Two outcomes matter
for valuation quality:

1. **Complete** (`GithubProfile.complete === true`) — every year in GitHub's own `contributionYears` list resolved,
   plus the rolling lastYear window. Same formula, same quality as before chunking existed. Durably cached 24h.
2. **Partial** (`complete: false`, `missingYears: number[]`) — one or more chunks never resolved even after
   rate-limit retry and cost-bisection (year → semester → quarter). Real GraphQL data for the years that DID
   resolve, `commitsTotal`/history simply reflect a smaller `contributionsByYear` — never a fabricated `0` for a
   missing year. Only cached 5 minutes (`RETRY_TTL_SECONDS`, `lib/github.ts`) so the next visit retries just the
   missing years. The player card surfaces this via `Player.dataCompleteness` — see `app/[username]/page.tsx`'s
   partial banner. This is player-card-only; squad valuation's light fetch has no equivalent completeness concept
   (see `docs/squad.md`).
3. **Degraded** (`degraded: true`) — GraphQL was entirely unavailable (down, or hourly points budget low); a REST
   `GET /users/{login}` (+ best-effort repos) last resort. `commitsTotal`, `prsTotal`, `commitsLast12Months` are
   all `0` in this path, so it's a **floor value, not the real one** — cached only 5 minutes, replaced by a full
   fetch as soon as GraphQL recovers.
4. **Pending** (squad only, `—`, `marketValue: null`) — a contributor whose valuation has never once succeeded and
   has no stale cached value to fall back to. Excluded from `Squad.totalValue`, never counted as €0. A
   genuinely-nonexistent/org account (GraphQL resolves but has no usable profile) *is* a real `€0`
   (`zeroValuation`), which is different from pending.

## Reserves (tier 2, roster positions 31–100)

Never valued at all — `ReservePlayer` only has `login`/`avatarUrl`/`commits` from the one contributors REST call.
No market value is computed or shown for reserves.
