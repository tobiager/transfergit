# Caching and rate limits

Transfergit has no database — GitHub is the source of truth, hit through several caching layers so a repeat visit
(or a viral spike) doesn't refetch/rate-limit against it. All numbers below are real constants from the code, not
estimates.

## Layers, outer to inner

| Layer | TTL | Where |
|---|---|---|
| CDN / camo (`s-maxage`, `stale-while-revalidate`) | 1h–24h (route-dependent) | Response headers on every `/api/og/*` and `/api/svg/*` route |
| Squad assembled-roster cache (`unstable_cache`) | 6h (21,600s) | [`lib/squad/index.ts`](../lib/squad/index.ts) `getCachedValuedSquad` |
| Per-contributor valuation cache (`unstable_cache`) | 24h | [`lib/squad/valuation.ts`](../lib/squad/valuation.ts) `cachedFetchValuation` |
| Negative (failure) cache | 10 min | [`lib/squad/valuation.ts`](../lib/squad/valuation.ts) `cachedAttempt` |
| Raw `fetch` cache (Next Data Cache, `next: { revalidate }`) | 24h | Every direct GitHub call in `lib/github.ts`, `lib/squad/contributors.ts` |
| Same-process request coalescing | request lifetime | `inFlight` map in `lib/squad/valuation.ts` |
| Same-process last-known-good | server instance lifetime | `lastKnownGood` map in `lib/squad/valuation.ts` |

## Route `Cache-Control` values

- Player README SVG (`app/api/svg/[username]/readme`): `s-maxage=3600, stale-while-revalidate=86400` — camo
  re-checks hourly.
- Squad README SVG (`app/api/svg/squad/[owner]/[repo]`): `s-maxage=43200, stale-while-revalidate=86400` — 12h,
  matched to the squad page's own 86400s `revalidate` rather than the individual valuation TTL.
- Squad OG/PNG routes: `s-maxage=86400, stale-while-revalidate`.
- Not-found placeholders: `s-maxage=60` — short, so a repo that just got created (or a typo that gets fixed)
  doesn't stay "not found" for hours. Served with **HTTP 200**, not 404/500 — a non-200 response makes a README
  `<img>` show a broken-image icon instead of the styled "not found" card.

## Why the squad cache is split into two caches, not one

`computeValuedSquad` (contributors + valuations + the one authoritative `totalValue`) is cached **without** the
formation in its key. `assembleSquad` (slot/role assignment for a given formation) is pure, cheap, and runs
**uncached**, per request, on top of the cached valued roster. This used to be one cache keyed by
`(owner, repo, formation)` — which meant the live page (`formation` undefined) and an export
(`formation="433"`) were different cache entries that could independently go stale and **diverge in total value**.
Splitting the cache is what guarantees the page and every export always agree on the squad and the total, no
matter which formation each one requests. See the comment above `ValuedSquad` in
[`lib/squad/index.ts`](../lib/squad/index.ts) for the full account, including the exact incident it fixed (page
read €384m, banner read €7.50m off a cold, mostly-pending recompute).

## Negative cache — why valuation has two `unstable_cache` layers

A login whose GraphQL profile query deterministically trips GitHub's per-request resource limit
(`GithubQueryTooExpensiveError`) is a cache **miss** on the 24h valuation cache every single time, since it never
successfully writes a value. Without a second cache, every render re-paid that login's full retry+backoff cost —
"6 fallback (of 30), identical on every render." The 10-minute negative cache (`cachedAttempt`) remembers *that an
attempt just happened*, success or failure, so a repeat request within the window gets an instant answer; once it
expires, `unstable_cache`'s own stale-serve-then-background-refresh retries it — "retry only what's currently
failing, at most once per 10 minutes" without a hand-rolled scheduler.

## Request coalescing and stale-on-error

`lib/squad/valuation.ts` keeps two **process-local** (not durable) maps as a second line of defense, distinct from
the durable `unstable_cache` layers:

- `inFlight` — concurrent requests for the same login during a cold render share one promise instead of firing
  duplicate GraphQL calls.
- `lastKnownGood` — the last valuation that actually succeeded for a login in this server instance. If both the
  durable cache and a fresh fetch fail, this is consulted before falling back to `pendingValuation` ("—").

## GitHub API budget guard

`lib/github.ts` records the `x-ratelimit-remaining`/`x-ratelimit-limit` headers from every GraphQL response
(`getLastGithubRateLimitStatus`). `lib/squad/valuation.ts`'s `fetchGraphqlValuation` checks this before starting a
new GraphQL fetch: below **10% remaining** (`RATE_LIMIT_BUDGET_FLOOR`), it skips straight to the REST fallback
(a separate budget) instead of risking starving every other concurrent visitor. Concurrency for the valuation
fan-out is capped at **6** (`CONCURRENCY` in `valuation.ts`) — governs wall-clock latency, not safety, since
GitHub has no documented hard concurrency cap below the points budget.

## Cost of a cold squad (nothing cached)

Per the cost-model comment in [`lib/squad/valuation.ts`](../lib/squad/valuation.ts):

- 1 REST request total (contributors, `per_page=100`).
- Up to 2 GraphQL requests per tier-1 player (a `createdAt` probe + the full profile query) — tier 2 (positions
  31–100) costs nothing beyond the 1 REST call. At the 30-player tier-1 cap: **up to 60 GraphQL requests**.
- GitHub bills GraphQL against an hourly **points** budget (5000 for a classic PAT), not a flat per-request count.
  Measured against a real 30-contributor squad: the `createdAt` probe costs ~1 point; the full profile query costs
  roughly 1–15+ points depending on account history.
- Budgeting ~10 points/player worst case: a cold 30-player squad costs **~300 points, ~6% of a 5000/hour PAT** —
  comfortably under the 10% budget-floor guard.
- That cost is paid **at most once per day per unique `(repo, contributor)` combination**, not once per page view —
  coalescing collapses concurrent duplicate requests, the 24h cache serves everything after the first. A single PAT
  can cold-start on the order of 15+ distinct squads/hour while serving unlimited repeat traffic to already-cached
  ones for free.
