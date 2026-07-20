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
  `data/legends-list.json` (same script the daily cron runs, see [`.github/workflows/update-legends.yml`](.github/workflows/update-legends.yml))
- Copy `.env.example` → `.env.local` and set `GITHUB_TOKEN` (read-only PAT, no special scopes) before running anything
  that touches GitHub's API.

Before finishing any task: `npm run build`, `npm run lint`, and `npm test` must all be green.

## Architecture map

- `app/[username]/` — individual player profile page. `app/squad/[owner]/[repo]/` — Repo Squad page.
- `app/api/og/` — PNG exports via `next/og` (`ImageResponse`, Satori under the hood). `_shared/` holds
  fonts/avatars/theme/data helpers reused across all OG routes, including `squadTheme.ts`.
- `app/api/svg/` — dynamic, self-animating SVG exports (README embeds). **Not** Satori — see GOTCHAS.
- `lib/` — pure data/domain logic. `lib/github.ts` (GraphQL+REST client), `lib/valuation.ts` (market-value formula),
  `lib/player.ts` (assembles a `Player` from a `GithubProfile`), `lib/ranking.ts`, `lib/positions.ts`,
  `lib/achievements.ts`, `lib/injuries.ts`, `lib/ratings.ts`, `lib/scoutReport.ts`.
- `lib/squad/` — Repo Squad pipeline: `contributors.ts` (REST contributor fetch + bot filter), `valuation.ts`
  (per-contributor valuation with caching/fallback), `formations.ts` (formation tables + degrade table),
  `roles.ts` (rank → slot assignment, captain/MVP), `pitchLayout.ts` (pure coordinate math, shared client+server),
  `customLayout.ts` (drag-and-drop layout encode/decode), `index.ts` (`getRepoSquad` / `getSquadFromParams` —
  the orchestrator every caller goes through).
- `lib/svg-card/` — player SVG renderer (hand-built markup). `lib/svg-squad/` — squad SVG renderer, reuses
  `lib/svg-card/theme.ts` tokens.
- `components/squad/` — Repo Squad UI (`SquadInteractive` owns formation/drag state, `SquadPitch` handles
  pointer-based drag, `SquadExportPanel`, `FormationSelector`). Other `components/` are the player-profile UI.
- `scripts/build-legends.ts` — offline script (run via `tsx` + a `server-only` stub, see
  `scripts/stub-server-only.cjs`) that re-fetches every username in `data/legends-list.json` and writes
  `data/legends.json`, used for percentile ranking on the player card.

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
- **Valuation caching is shared and global, with a short negative-cache for failures.** A repo's valued roster
  (not the formation) is cached once (`unstable_cache`, 6h) and per-contributor valuations are cached 24h; a login
  that's currently failing is retried at most every 10 minutes (negative cache), not on every render. See
  `docs/caching-and-rate-limits.md`.
- **GitHub API budget is logged and guarded.** `lib/github.ts` tracks the last-seen rate-limit headers;
  `lib/squad/valuation.ts` stops starting new GraphQL fetches once <10% of the hourly budget remains and falls
  back to a cheaper REST lookup instead.
- **A squad's total value is computed exactly once, in `computeValuedSquad`** (`lib/squad/index.ts`), and carried
  on the cached object. No route or component ever re-derives it by summing partial valuations — that's what
  previously caused the live page and an export to show different totals.
