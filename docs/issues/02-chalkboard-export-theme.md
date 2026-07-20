**Title:** New squad export theme: "Chalkboard" (tactical blackboard)
**Labels:** `good first issue`, `enhancement`, `area:exports`
**Estimate:** M (~1 day)

## Context

Repo Squad exports currently support two themes, `floodlight` (dark, green accents) and `grass` (green pitch,
gold accents) — defined in two places that must stay in sync by hand (see Findings in
[`docs/exports.md`](../exports.md)):

- [`app/api/og/_shared/squadTheme.ts`](../../app/api/og/_shared/squadTheme.ts) (`SQUAD_THEMES`, used by the Satori
  PNG routes).
- `palette()` in [`lib/svg-squad/render.ts`](../../lib/svg-squad/render.ts) (used by the hand-built SVG route).

The ask: add a third theme, **"chalkboard"** — a tactics-board look (dark board background, white/chalk-colored
pitch lines and text, like a coach's whiteboard diagram) as a third selectable option everywhere `floodlight`/
`grass` are selectable today.

## Files involved

- `app/api/og/_shared/squadTheme.ts` — add a `chalkboard` entry to `SquadThemeName` and `SQUAD_THEMES`.
- `lib/svg-squad/render.ts` — add the matching case to `palette()`.
- `components/squad/SquadExportPanel.tsx` — `THEME_META` record and the theme selector UI (`Theme` type,
  currently `"floodlight" | "grass"`).
- `app/api/og/squad/[owner]/[repo]/route.tsx` and `app/api/svg/squad/[owner]/[repo]/route.ts` —
  `parseTheme()`/theme query parsing (currently `value === "grass" ? "grass" : "floodlight"` — needs a third branch).

## Acceptance criteria

- [ ] `?theme=chalkboard` works on both the PNG route (`/api/og/squad/...`) and the SVG route
      (`/api/svg/squad/...`), producing a visually coherent "coach's blackboard" look on both.
- [ ] The new theme is selectable in `SquadExportPanel`'s theme pills, alongside Floodlight/Grass.
- [ ] Falls back sanely (to `floodlight`) on an unrecognized `?theme=` value, same as today.
- [ ] Colors/contrast are checked against both the portrait and landscape formats — a palette that reads fine on
      the tall portrait pitch can still clip/clash on the short 630px landscape header (see the sizing constants'
      comments in the OG route for why landscape is the tight case).

## Notes

Reuse `mowStripes()` in `squadTheme.ts` if the board look benefits from a subtle texture — but a flat background is
also a perfectly fine v1.
