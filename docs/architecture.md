# Architecture

Transfergit has no database. Every page and every export route re-derives its data from the GitHub API through a
caching layer (Next.js's `fetch`/`unstable_cache` Data Cache), plus one static snapshot file
(`data/legends.json`) refreshed daily by a cron job.

## Two pipelines

### 1. Player profile — `/[username]`

```
GitHub GraphQL, year-chunked + bisected, gated by withGithubGate
  (lib/github.ts: getGithubProfile -> fetchGithubProfile)
  -> GithubProfile (lib/types.ts), complete | partial | degraded
  -> lib/player.ts: buildPlayer-style assembly
       - lib/valuation.ts        market value + history
       - lib/positions.ts        position/language classification
       - lib/injuries.ts         commit-gap "injury" detection
       - lib/ratings.ts          0-99 scouting ratings
       - lib/achievements.ts     trophy cabinet
       - lib/ranking.ts          percentile tier (log-curve, not legends-relative)
       - lib/geo.ts              nationality from free-text location
  -> Player (lib/types.ts)
  -> app/[username]/page.tsx (React UI) or app/api/og/[username]/* (PNG) or
     app/api/svg/[username]/readme (SVG)
```

`getGithubProfile` is the one fetch/cache entrypoint every consumer above goes through — it fans out into several
year-chunked GraphQL requests (with bisection for very active accounts), retries rate limits, and can return a
`complete`, `partial`, or `degraded` profile depending on how much of that fan-out actually resolved. See
[`data-pipeline.md`](data-pipeline.md) for the full chunking/bisection/completeness/budget-guard design — this
page intentionally doesn't restate it.

`data/legends.json` (built by [`scripts/build-legends.ts`](../scripts/build-legends.ts)) is only consulted for the
Hall of Fame page ([`app/hall-of-fame/page.tsx`](../app/hall-of-fame/page.tsx)) — the per-profile percentile tier
(`lib/ranking.ts`) is a fixed log curve, independent of that dataset.

### 2. Repo Squad — `/squad/[owner]/[repo]`

```
GitHub REST contributors (lib/squad/contributors.ts: fetchTopContributors)
  -> Contributor[] (bots filtered, sorted by commits, capped at 100)
  -> split: tier 1 (top 30, positions 1-30) / tier 2 (31-100, reserves)
  -> lib/squad/valuation.ts: valuateContributors(tier1)
       -> lib/github.ts: fetchLightSquadProfiles   [light aliased-batch GraphQL, cached 24h]
  -> lib/squad/index.ts: computeValuedSquad               [cached 6h, formation-independent]
       { players, reserves, totalValue, totalValueFormatted, pendingValuations }
  -> lib/squad/index.ts: assembleSquad(valued, formation)  [pure, per-request, uncached]
       - lib/squad/formations.ts   resolveFormation -> slots
       - lib/squad/roles.ts        rank by commits -> starters/bench/mvp/captain
       - lib/squad/customLayout.ts  optional drag-layout override
  -> Squad (lib/squad/types.ts)
  -> app/squad/[owner]/[repo]/page.tsx or app/api/og/squad/*  or app/api/svg/squad/*
```

The split between `computeValuedSquad` (expensive, cached, formation-independent) and `assembleSquad` (cheap, pure,
runs every request) is the key architectural decision here — see [`caching-and-rate-limits.md`](caching-and-rate-limits.md)
for why, and [`squad.md`](squad.md) for the tier/valuation details.

## Request → response, end to end (Repo Squad export)

1. Browser requests `/api/og/squad/torvalds/linux?format=portrait&formation=442`.
2. Route handler parses `format`/`theme`/`formation`/`base`/`layout` from the query string.
3. `getSquadFromParams(owner, repo, params)` (`lib/squad/index.ts`) resolves the query into a `Squad` — this is the
   single function every route and the live page call, so a shared link is reproducible (WYSIWYG).
4. Internally this hits `getCachedValuedSquad` (Next Data Cache, 6h TTL) — a warm cache skips GitHub entirely; a
   cold one fans out to GitHub REST (1 contributors request) + a light aliased-batch GraphQL fetch for tier 1 only
   (up to 10 logins per request, 3 chunks run concurrently — see [`data-pipeline.md`](data-pipeline.md)). Both the
   REST call and every GraphQL chunk route through `withGithubGate` (`lib/githubGate.ts`), a process-wide
   concurrency cap (3) that exists to avoid tripping GitHub's secondary (burst) rate limit.
5. Avatars are fetched and inlined as base64 data URIs (`app/api/og/_shared/avatarBatch.ts`), since Satori/`next/og`
   can't fetch external images at render time.
6. `ImageResponse` (Satori) rasterizes the JSX tree to PNG, or (for `/api/svg/squad/...`) `renderSquadCardSvg`
   (`lib/svg-squad/render.ts`) hand-builds an SVG string directly — see [`exports.md`](exports.md) for why these two
   routes use different rendering engines.
7. Response ships with `Cache-Control: s-maxage=...` so GitHub's camo proxy (README embeds) or a CDN can serve
   repeat hits without hitting the route at all.

## Key files

| Concern | File |
|---|---|
| GitHub GraphQL/REST client, rate-limit tracking | [`lib/github.ts`](../lib/github.ts) |
| Process-wide GitHub request concurrency gate | [`lib/githubGate.ts`](../lib/githubGate.ts) |
| Market value formula | [`lib/valuation.ts`](../lib/valuation.ts) |
| Repo Squad orchestration | [`lib/squad/index.ts`](../lib/squad/index.ts) |
| Squad (light-batch) valuation | [`lib/squad/valuation.ts`](../lib/squad/valuation.ts) |
| Formation tables | [`lib/squad/formations.ts`](../lib/squad/formations.ts) |
| Pitch coordinate math (shared client/server) | [`lib/squad/pitchLayout.ts`](../lib/squad/pitchLayout.ts) |
| Player SVG renderer | [`lib/svg-card/render.ts`](../lib/svg-card/render.ts) |
| Squad SVG renderer | [`lib/svg-squad/render.ts`](../lib/svg-squad/render.ts) |
| Squad PNG/OG routes | [`app/api/og/squad/[owner]/[repo]/route.tsx`](../app/api/og/squad/%5Bowner%5D/%5Brepo%5D/route.tsx) |
| Squad interactive UI (drag, formation, export) | [`components/squad/SquadInteractive.tsx`](../components/squad/SquadInteractive.tsx) |
| Home page | [`app/page.tsx`](../app/page.tsx), [`components/home/`](../components/home/) |

## Home page — `/`

Composed in `app/page.tsx` from `components/home/`, top to bottom: `HeroShowcase` (a draggable 3D card ring — pure
CSS `rotateY`/`translateZ`, no live data, images are pre-generated exports) alongside `OmniSearch` (one search box
that detects whether the query looks like a GitHub username or an `owner/repo` slug via
`lib/parseRepoSlug.ts`'s `detectQueryKind`, and routes to `/[username]` or `/squad/[owner]/[repo]` accordingly),
`SigningsTicker` (scrolling strip of the top 20 `data/legends.json` entries), `MostValuablePlayers` (top 8 legends
as a ranked table, links to `/hall-of-fame`), `SquadOfTheDay` (one curated repo from
`lib/squad/featuredRepos.ts`'s `FEATURED_REPOS`, picked deterministically by a hash of the UTC date, rendered as a
static pitch preview via the same `getRepoSquad`/`pitchLayout.ts` the live squad page uses, cached 24h keyed by
calendar day), and `HowItWorks`. See [`design-brief-home.md`](design-brief-home.md) for how this compares to the
original redesign brief.

See also: [`squad.md`](squad.md), [`market-value.md`](market-value.md), [`exports.md`](exports.md),
[`caching-and-rate-limits.md`](caching-and-rate-limits.md), [`formations.md`](formations.md),
[`data-pipeline.md`](data-pipeline.md).
