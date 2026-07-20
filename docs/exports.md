# Exports

Covers the **Repo Squad** export system (`SquadExportPanel`) — 4 formats. The player-card export system
(`ExportPanel`) is a separate, older set of 5 formats (README·Full 4:5, Player card 1:1, Portrait 3:4, Story 9:16,
Banner 16:9) following the same WYSIWYG/theme/Satori rules; see [`components/ExportPanel.tsx`](../components/ExportPanel.tsx)
and [`app/api/og/[username]/`](../app/api/og/%5Busername%5D/) if you need that one.

## The 4 squad formats

| Format | Route | Size | Engine |
|---|---|---|---|
| README (`format=portrait`) | `/api/og/squad/[owner]/[repo]` | 1200×1500 (4:5) | Satori (`ImageResponse`) |
| Social (`format=landscape`) | `/api/og/squad/[owner]/[repo]` | 1200×630 (~16:9) | Satori |
| Full squad (`format=full`) | `/api/og/squad/[owner]/[repo]` | 1200×1800 (2:3) | Satori |
| SVG (README only) | `/api/svg/squad/[owner]/[repo]` | 1200×1500 | **hand-built XML**, no Satori |

Selector: [`components/squad/SquadExportPanel.tsx`](../components/squad/SquadExportPanel.tsx). The README format is
the only one with an SVG/PNG toggle — Social and Full squad are PNG-only (no dynamic SVG variant exists for them).

## Params every export route accepts

- `format` — `portrait` (default) / `landscape` / `full`. SVG route has no `format` (it's always the README shape).
- `theme` — `floodlight` (default, dark) / `grass` (green pitch, gold accents). Same two themes, same palette
  intent, on both the PNG (`app/api/og/_shared/squadTheme.ts`) and SVG (`lib/svg-squad/render.ts`'s `palette()`)
  renderers — kept in sync by hand, not shared code (see Findings).
- `formation`, `base`, `layout` — WYSIWYG state, see below.
- `animate` — SVG only, `?animate=false` strips the `<style>`/`@keyframes` block (e.g. for a static download).

## WYSIWYG via `?formation=&base=&layout=`

Every export route resolves through `getSquadFromParams` ([`lib/squad/index.ts`](../lib/squad/index.ts)), the exact
same function the live page uses — this is what guarantees an exported image matches what's on screen:

- No `formation` param → default formation (`resolveFormation`'s first option, `433` at full strength).
- `formation=442` (or any standard name) → that formation's role/slot assignment, freshly resolved server-side.
- `formation=custom&base=433&layout=GK:50.0,0.0;...` → starts from `base`'s role assignment, then overrides each
  starter's `x`/`y` per the decoded layout. `base` is required for custom — without it there's no source
  role/slot assignment to override.

`SquadInteractive` ([`components/squad/SquadInteractive.tsx`](../components/squad/SquadInteractive.tsx)) builds this
exact query string client-side (`formationQuery`) from live drag state and hands it to `SquadExportPanel`, so the
preview `<img>`, "Copy Markdown", "Download", and the page's own share link all carry an in-progress custom drag,
not just a saved formation.

## Satori restrictions (PNG routes only)

`next/og`'s `ImageResponse` renders via Satori, which is **not a browser** — several constraints shape the JSX in
[`app/api/og/squad/[owner]/[repo]/route.tsx`](../app/api/og/%5Bowner%5D/%5Brepo%5D/route.tsx):

- No external image fetches at render time — every avatar/logo must already be a base64 data URI
  (`app/api/og/_shared/avatarBatch.ts`, `logo.ts`).
- No glyph fallback for characters outside the loaded fonts — the MVP star is drawn as an inline SVG `<path>`, not
  the `★` character, because none of the loaded Archivo fonts include it (`MvpBadge` in the squad route).
- `display: flex` must be explicit on every container Satori lays out — there's no implicit block layout.
- No CSS `repeating-linear-gradient` support — the grass theme's mow-stripe background
  (`app/api/og/_shared/squadTheme.ts` `mowStripes()`) builds an explicit `linear-gradient` with repeated hard
  color stops instead.

## The SVG route is NOT Satori

`app/api/svg/squad/[owner]/[repo]/route.ts` calls `renderSquadCardSvg` ([`lib/svg-squad/render.ts`](../lib/svg-squad/render.ts)),
which builds the entire SVG document as a template string — no React, no Satori. This is deliberate: GitHub's
README camo proxy re-serves this SVG raw inside an `<img>`, and only a real SVG document (with a `<style>` block)
can carry CSS `@keyframes` fade-in animations through camo. Every dynamic value interpolated into the markup
(usernames, repo names) **must** go through the local `esc()` HTML-entity escaper first — this is the project's
one hand-rolled injection boundary; skipping it on a new field is a real XSS/broken-SVG risk, not just a lint nit.

## Themes

`floodlight` (dark, green accents — the site's default) and `grass` (green pitch, white lines, gold accents,
looks like a broadcast graphic). Defined twice, once per renderer:
[`app/api/og/_shared/squadTheme.ts`](../app/api/og/_shared/squadTheme.ts) (`SQUAD_THEMES`, for Satori) and inline
`palette()` in [`lib/svg-squad/render.ts`](../lib/svg-squad/render.ts) (for the hand-built SVG).
