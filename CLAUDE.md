@AGENTS.md

# Transfergit

Turns any GitHub profile into a football player card (market value, transfer history, injuries, trophies) and any
GitHub repo into a fielded "Repo Squad" (top contributors as a starting XI, valued and ranked by commits). Next.js
15 App Router + TypeScript, no database — everything is fetched live from the GitHub REST/GraphQL API and cached.

Full docs live in [`/docs`](docs/) — read the relevant one before touching that area. See also
[CONTRIBUTING.md](CONTRIBUTING.md).

## Commands

- `npm run dev` — dev server
- `npm run build` — production build (also type-checks)
- `npm run lint` — ESLint (`eslint-config-next` core-web-vitals + typescript)
- `npm test` — `node --conditions=react-server --test lib/**/*.test.ts` (no framework, plain `node:test`; requires
  `react-server` condition because several libs import `server-only`)
- `npm run build:legends` — regenerates `data/legends.json` + `lib/achievementRarity.json` from
  `data/legends-list.json` (`scripts/build-legends.ts`). No automated cron currently runs this — run it by hand
  after editing `data/legends-list.json` and commit the regenerated output. (`.github/workflows/` only has
  `warm-squad-of-the-day.yml`, which warms the Squad of the Day cache, not the legends dataset.)
- Copy `.env.example` → `.env.local` and set `GITHUB_TOKEN` (read-only PAT, no special scopes) before running anything
  that touches GitHub's API.

Before finishing any task: `npm run build`, `npm run lint`, and `npm test` must all be green.

## Architecture map

- `app/[username]/` — individual player profile page. `app/squad/[owner]/[repo]/` — Repo Squad page.
- `app/api/og/` — PNG exports via `next/og` (`ImageResponse`, Satori under the hood). `_shared/` holds
  fonts/avatars/theme/data helpers reused across all OG routes, including `squadTheme.ts`.
- `app/api/svg/` — dynamic, self-animating SVG exports (README embeds). **Not** Satori — see GOTCHAS.
- `lib/` — pure data/domain logic. `lib/github.ts` (GraphQL+REST client — chunked/bisected profile pipeline,
  complete/partial/degraded status, plus the separate light aliased-batch fetch squad valuation uses),
  `lib/githubGate.ts` (process-wide GitHub request concurrency gate, see GOTCHAS), `lib/valuation.ts`
  (market-value formula), `lib/player.ts` (assembles a `Player` from a `GithubProfile`), `lib/ranking.ts`,
  `lib/positions.ts`, `lib/achievements.ts`, `lib/injuries.ts`, `lib/ratings.ts`, `lib/scoutReport.ts`. Full
  pipeline detail: [`docs/data-pipeline.md`](docs/data-pipeline.md).
- `lib/squad/` — Repo Squad pipeline: `contributors.ts` (REST contributor fetch + bot filter), `valuation.ts`
  (light aliased-batch valuation via `lib/github.ts`'s `fetchLightSquadProfiles`, with caching/fallback —
  deliberately NOT the deep per-year profile pipeline, see GOTCHAS), `formations.ts` (formation tables + degrade
  table), `roles.ts` (rank → slot assignment, captain/MVP), `pitchLayout.ts` (pure coordinate math, shared
  client+server), `customLayout.ts` (drag-and-drop layout encode/decode), `index.ts` (`getRepoSquad` /
  `getSquadFromParams` — the orchestrator every caller goes through).
- `lib/svg-card/` — player SVG renderer (hand-built markup). `lib/svg-squad/` — squad SVG renderer, reuses
  `lib/svg-card/theme.ts` tokens.
- `components/squad/` — Repo Squad UI (`SquadInteractive` owns formation/drag state, `SquadPitch` handles
  pointer-based drag, `SquadExportPanel`, `FormationSelector`). `components/home/` — home page UI (`OmniSearch`,
  `HeroShowcase`, `SigningsTicker`, `MostValuablePlayers`, `SquadOfTheDay`, `HowItWorks`; see
  [`docs/architecture.md`](docs/architecture.md#home-page--)). Other `components/` are the player-profile UI.
- `scripts/build-legends.ts` — offline script (run via `tsx` + a `server-only` stub, see
  `scripts/stub-server-only.cjs`) that re-fetches every username in `data/legends-list.json` and writes
  `data/legends.json`, used for percentile ranking on the player card. Run manually (`npm run build:legends`) —
  see Commands above.

## Hard rules

- TypeScript `strict: true`, zero `any` (verified: none in `lib/` or `app/`). Don't introduce one.
- No new dependencies without a critical justification — check `package.json` first; this is a small, deliberately
  dependency-light project.
- `import "server-only"` on any module that fetches, reads env vars, or otherwise must never reach the client
  bundle (`lib/github.ts`, `lib/squad/{index,contributors,valuation}.ts`, `lib/svg-card/avatar.ts`, `lib/svg-card/flag.ts`,
  `lib/trophyAssets.ts`). Pure/computational modules (formulas, formatting, formation tables) deliberately omit it.
- UI copy is English only, no exceptions (this file and PR/commit conversation may be in Spanish).
- Branches are `feature/*` → PR into `develop`, never merge locally. `develop` merges into `main` for release.
- `npm run build`, `npm run lint`, and `npm test` must be green before considering any task done.

## Gotchas

- **The SVG export routes (`app/api/svg/**`) do NOT use Satori.** They're hand-built XML template strings
  (`lib/svg-card/render.ts`, `lib/svg-squad/render.ts`) with base64 data-URI avatars and a manual `esc()` escaper —
  every dynamic string interpolated into markup **must** be escaped or it's an XSS/broken-SVG bug. This is
  deliberate: GitHub's README camo proxy re-serves the raw SVG (CSS `@keyframes` included) inside an `<img>`,
  which only works for a plain SVG document, not a Satori-rendered PNG.
- **README images go through GitHub's camo proxy.** No external resources (fonts/images must be inlined as data
  URIs), and camo respects `Cache-Control` — `s-maxage`/`stale-while-revalidate` on the route response is what
  makes an embedded README card "auto-update" without a re-commit. See `docs/caching-and-rate-limits.md`.
- **Exports are WYSIWYG via `?formation=&base=&layout=`.** Every export route (OG PNG, dynamic SVG) and the live
  page all resolve through `getSquadFromParams` (`lib/squad/index.ts`) so a shared/exported link reproduces exactly
  what's on screen, including an in-progress custom drag.
- **Valuation caching is shared and global.** A repo's valued roster (not the formation) is cached once
  (`unstable_cache`, 6h, `getCachedValuedSquad`) and the light per-batch profile fetch behind it is cached 24h
  (`cachedLightProfileBatch` in `lib/github.ts`). A batch that hard-fails isn't durably negative-cached — it just
  isn't written, so the next request retries it (in-process `lastKnownGood` in `lib/squad/valuation.ts` covers the
  gap in the meantime). See `docs/caching-and-rate-limits.md`.
- **GitHub API budget is logged and guarded, but only on the deep profile pipeline.** `lib/github.ts` tracks the
  last-seen rate-limit headers (`getLastGithubRateLimitStatus`); `fetchGithubProfile` (the `/[username]` pipeline)
  refuses to start new GraphQL fan-out once <10% of the hourly budget remains (`RATE_LIMIT_BUDGET_FLOOR`) and falls
  back to a REST-degraded profile instead. Squad valuation's light batch fetch doesn't re-check this itself — its
  fan-out is tiny (3 GraphQL requests per 30-contributor squad) — but shares the same gated request pipeline.
- **A squad's total value is computed exactly once, in `computeValuedSquad`** (`lib/squad/index.ts`), and carried
  on the cached object. No route or component ever re-derives it by summing partial valuations — that's what
  previously caused the live page and an export to show different totals.
- **GitHub's secondary (anti-abuse) rate limit is a different failure from the primary points budget** — it
  triggers on request *concurrency/burst*, not remaining points, and can fire even with >90% of the hourly budget
  left. This is why `lib/githubGate.ts`'s `withGithubGate` (process-wide concurrency cap, `MAX_CONCURRENT = 3`)
  exists, and why it wraps every GitHub call in the codebase, not just the profile pipeline. Retry handling also
  differs: primary-limit retries honor GitHub's `Retry-After` verbatim; secondary-limit retries deliberately
  *ignore* `Retry-After` (GitHub's own header for it is often a conservative flat 60s) and use a fixed
  `[5000, 15000, 45000]`ms backoff ladder instead (`lib/github.ts`, `SECONDARY_RATE_LIMIT_BACKOFFS_MS`).
- **`contributionsCollection` (GitHub's GraphQL contribution-history field) only accepts windows of at most one
  year.** This is why the player profile pipeline fetches one GraphQL request per calendar year instead of one
  query for the whole account history — see `docs/data-pipeline.md`. A single year that's still too expensive for
  one request gets bisected (year → semester → quarter, up to 2 levels deep) rather than given up on.
- **Squad valuation uses a separate, deliberately lightweight fetch — never the deep per-profile pipeline.**
  `lib/squad/valuation.ts` gets its data from `lib/github.ts`'s `fetchLightSquadProfiles` (followers/stars/
  top-language/account-age only, up to 10 logins per aliased GraphQL request), NOT `getGithubProfile`/
  `fetchGithubProfile` (the deep, year-chunked pipeline `/[username]` uses). There's an explicit guard comment
  in `lib/github.ts` (above `LightGithubProfile`) warning against merging these: the deep pipeline fans out into
  ~15-20 requests per contributor for yearly chunks, which is fine for one profile page but would make a
  30-contributor squad cost hundreds of requests instead of 3. A squad contributor's `commitsTotal`/`prsTotal`/
  `commitsLast12Months` are always `0` as a result — the market-value formula's `formMultiplier` never applies to
  a squad valuation.
- **The home page's sticky navbar has no background of its own at rest** (`components/NavbarClient.tsx`) — on
  every other route that's invisible (same navy background either side), but the home page's `<main
  className="tg-home">` paints its own, deliberately different near-black background starting at its own box.
  Without `body:has(.tg-home) { background: var(--tg-bg); ... }` in `app/globals.css`, the body's default navy
  background peeks through right above the hero, producing a visible horizontal seam exactly at the navbar's
  bottom edge. If you touch home-page theming, keep that `:has()` rule (and its scrolled-state
  `--nav-scrolled-bg`/`--nav-scrolled-border` overrides) in sync with `.tg-home`'s own tokens.
- **A global unlayered `:focus-visible` rule can beat Tailwind v4 utilities regardless of selector specificity.**
  `app/globals.css` wraps the shared focus-outline rule in `@layer base` specifically so a component that opts out
  with its own `focus:outline-none` (e.g. the home page's omnibox, which shows focus via its own glow) can still
  win — Tailwind v4 orders utility layers after base, but only within the layer system; an unlayered base rule
  always wins outside of it, which is what caused the outline to show through `focus:outline-none` before this
  was fixed.
