# Caching and rate limits

Transfergit has no database — GitHub is the source of truth, hit through several caching layers so a repeat visit
(or a viral spike) doesn't refetch/rate-limit against it. All numbers below are real constants from the code, not
estimates.

## Layers, outer to inner

| Layer | TTL | Where |
|---|---|---|
| CDN / camo (`s-maxage`, `stale-while-revalidate`) | 1h–24h (route-dependent) | Response headers on every `/api/og/*` and `/api/svg/*` route |
| Squad valued-roster cache (`unstable_cache`) | 6h (21,600s) | [`lib/squad/index.ts`](../lib/squad/index.ts) `getCachedValuedSquad` |
| Squad light-profile batch cache (`unstable_cache`) | 24h | [`lib/github.ts`](../lib/github.ts) `cachedLightProfileBatch` (backs `fetchLightSquadProfiles`, used by `lib/squad/valuation.ts`'s `valuateContributors`) |
| Player profile — complete (`unstable_cache`) | 24h | [`lib/github.ts`](../lib/github.ts) `cachedFullProfile` |
| Player profile — partial/degraded retry cache (`unstable_cache`) | 5 min | [`lib/github.ts`](../lib/github.ts) `cachedAttemptProfile` (300s, `RETRY_TTL_SECONDS`) |
| Per-year contribution chunk (`unstable_cache`) | 30d historical / 4h current year / 1h rolling last-year | [`lib/github.ts`](../lib/github.ts) — see [`data-pipeline.md`](data-pipeline.md) |
| Raw `fetch` cache (Next Data Cache, `next: { revalidate }`) | 24h | `lib/squad/contributors.ts`'s REST contributors call |
| Same-process request coalescing (profile) | request lifetime | `profileInFlight` map in `lib/github.ts` |
| Same-process request coalescing (squad) | request lifetime | `valuedSquadInFlight` map in `lib/squad/index.ts` |
| Same-process last-known-good (profile, complete only) | server instance lifetime | `lastKnownGoodProfile` map in `lib/github.ts` |
| Same-process last-known-good (squad valuation) | server instance lifetime | `lastKnownGood` map in `lib/squad/valuation.ts` |
| Process-wide GitHub request concurrency gate | n/a (not a cache — a limiter) | [`lib/githubGate.ts`](../lib/githubGate.ts) `withGithubGate`, `MAX_CONCURRENT = 3` |

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

## Squad valuation: light aliased batches, not per-login GraphQL

Older versions of this doc described a per-login GraphQL valuation pipeline (`cachedFetchValuation`,
`fetchGraphqlValuation`, a 10-minute negative cache, `CONCURRENCY = 6`) — **that pipeline no longer exists.**
Repo Squad valuation is `lib/squad/valuation.ts`'s `valuateContributors`, which calls `lib/github.ts`'s
`fetchLightSquadProfiles`: up to `LIGHT_PROFILE_BATCH_SIZE = 10` logins share **one** aliased GraphQL request, and
those batches are cached together (`cachedLightProfileBatch`, 24h) rather than per-login. See
[`data-pipeline.md`](data-pipeline.md) for the full design and why it's a deliberately separate, lighter sibling of
the player-card profile pipeline.

A batch that hard-fails (rate limit exhausted, network error) is caught and returned as `null` rather than thrown
— `fetchLightSquadProfiles` leaves those logins absent from its result map (not "resolved to no user"), so
`valuateContributors` can tell "genuinely no such user" (a real `€0`, `zeroValuation`) apart from "couldn't fetch
this time" (falls back to `lastKnownGood`, or `pendingValuation` ("—") as the last resort). There is no separate
short-lived negative cache for squad valuation the way there is for player profiles (`cachedAttemptProfile`, 5
min) — a failed batch simply isn't cached, so the next request (this instance's `lastKnownGood` permitting) retries
it.

## Request coalescing and stale-on-error

Two **process-local** (not durable) maps back this, distinct from the durable `unstable_cache` layers:

- `lightBatchInFlight` (`lib/github.ts`) / `valuedSquadInFlight` (`lib/squad/index.ts`) — concurrent requests for
  the same batch/repo during a cold render share one promise instead of firing duplicate GraphQL calls. The
  player-card pipeline has the equivalent `profileInFlight` in `lib/github.ts`.
- `lastKnownGood` (`lib/squad/valuation.ts`) — the last valuation that actually succeeded for a login in this
  server instance. If both the durable cache and a fresh fetch fail, this is consulted before falling back to
  `pendingValuation` ("—"). The player-card pipeline's equivalent, `lastKnownGoodProfile` (`lib/github.ts`), only
  updates on a `complete` profile — see [`data-pipeline.md`](data-pipeline.md).

## GitHub API budget guard and the process-wide concurrency gate

`lib/github.ts` records the `x-ratelimit-remaining`/`x-ratelimit-limit` headers from every GraphQL response
(`getLastGithubRateLimitStatus`). `fetchGithubProfile` (the player-card pipeline) checks this via `budgetIsLow()`
before starting any new GraphQL fan-out: below **10% remaining** (`RATE_LIMIT_BUDGET_FLOOR`), it throws immediately
so the caller falls back to the REST-degraded profile instead of risking starving every other concurrent visitor.
Squad valuation doesn't re-check the budget itself — it's a much smaller fan-out (3 GraphQL requests for a
30-contributor squad) and shares the same guarded pipeline's headroom.

Separately, **every** GitHub network call in the codebase — GraphQL chunks, REST contributor/profile lookups,
even the navbar's star-count fetch (`lib/repoStats.ts`) — routes through `withGithubGate`
([`lib/githubGate.ts`](../lib/githubGate.ts)), a process-wide concurrency cap (`MAX_CONCURRENT = 3`) with 50-150ms
of jitter per acquire. This exists for GitHub's **secondary** (anti-abuse burst) rate limit, which is independent
of the points budget above and triggers on request concurrency, not cost — see
[`data-pipeline.md`](data-pipeline.md#primary-vs-secondary-rate-limits) for why primary and secondary limits are
retried differently.

## Cost of a cold squad (nothing cached)

Per the module comment in [`lib/squad/valuation.ts`](../lib/squad/valuation.ts) and `fetchLightSquadProfiles` in
[`lib/github.ts`](../lib/github.ts):

- 1 REST request total (contributors, `per_page=100`).
- Tier 1 (up to 30 contributors) is valued via the light aliased-batch fetch: `ceil(30 / 10) = 3` GraphQL requests
  (`LIGHT_PROFILE_BATCH_SIZE = 10`). Tier 2 (positions 31–100) costs nothing beyond the 1 REST call.
- **1 REST request + 3 GraphQL requests = 3 GraphQL points total** for a cold 30-contributor squad (each light
  batch request costs ~1 point) — roughly a 20x reduction from the old per-login pipeline this doc used to
  describe, which cost up to 60 GraphQL requests for the same roster.
- That cost is paid **at most once per day per unique repo's contributor batch**, not once per page view —
  coalescing collapses concurrent duplicate requests, the 24h light-batch cache serves everything after the first.
  A single PAT can cold-start on the order of hundreds of distinct squads/hour while serving unlimited repeat
  traffic to already-cached ones for free.
- Measured cold-load latency for a real repo (`/squad/vercel/next.js`, production build) was ~11.4-11.6s despite
  the low request count — traced to GitHub's own edge intermittently 502'ing on the light-batch GraphQL call, with
  no fetch timeout/retry on this codebase's side for that specific failure mode. A known, not-yet-fixed finding,
  not a caching issue.
