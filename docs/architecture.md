# Architecture

Transfergit has no database. Every page and every export route re-derives its data from the GitHub API through a
caching layer (Next.js's `fetch`/`unstable_cache` Data Cache), plus one static snapshot file
(`data/legends.json`) refreshed daily by a cron job.

## Two pipelines

### 1. Player profile — `/[username]`

```
GitHub GraphQL (lib/github.ts: fetchGithubProfile)
  -> GithubProfile (lib/types.ts)
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

`data/legends.json` (built by [`scripts/build-legends.ts`](../scripts/build-legends.ts)) is only consulted for the
Hall of Fame page ([`app/hall-of-fame/page.tsx`](../app/hall-of-fame/page.tsx)) — the per-profile percentile tier
(`lib/ranking.ts`) is a fixed log curve, independent of that dataset.

### 2. Repo Squad — `/squad/[owner]/[repo]`

```
GitHub REST contributors (lib/squad/contributors.ts: fetchTopContributors)
  -> Contributor[] (bots filtered, sorted by commits, capped at 100)
  -> split: tier 1 (top 30, positions 1-30) / tier 2 (31-100, reserves)
  -> lib/squad/valuation.ts: valuateContributors(tier1)   [GraphQL, per-login, cached]
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
   cold one fans out to GitHub REST (contributors) + GraphQL (per-contributor valuation, tier 1 only, concurrency 6).
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
| Market value formula | [`lib/valuation.ts`](../lib/valuation.ts) |
| Repo Squad orchestration | [`lib/squad/index.ts`](../lib/squad/index.ts) |
| Formation tables | [`lib/squad/formations.ts`](../lib/squad/formations.ts) |
| Pitch coordinate math (shared client/server) | [`lib/squad/pitchLayout.ts`](../lib/squad/pitchLayout.ts) |
| Player SVG renderer | [`lib/svg-card/render.ts`](../lib/svg-card/render.ts) |
| Squad SVG renderer | [`lib/svg-squad/render.ts`](../lib/svg-squad/render.ts) |
| Squad PNG/OG routes | [`app/api/og/squad/[owner]/[repo]/route.tsx`](../app/api/og/squad/%5Bowner%5D/%5Brepo%5D/route.tsx) |
| Squad interactive UI (drag, formation, export) | [`components/squad/SquadInteractive.tsx`](../components/squad/SquadInteractive.tsx) |

See also: [`squad.md`](squad.md), [`market-value.md`](market-value.md), [`exports.md`](exports.md),
[`caching-and-rate-limits.md`](caching-and-rate-limits.md), [`formations.md`](formations.md).
