**Title:** Recruitment CTA in the dynamic squad SVG footer
**Labels:** `good first issue`, `enhancement`, `area:exports`
**Estimate:** S (~2-3 hours)

## Context

The dynamic squad SVG (embedded in READMEs, auto-updating, served by
[`app/api/svg/squad/[owner]/[repo]/route.ts`](../../app/api/svg/squad/%5Bowner%5D/%5Brepo%5D/route.ts)) currently
ends with a plain footer: logo + `{siteHost}/squad/{owner}/{repo}` (see the `footer` template in
[`lib/svg-squad/render.ts`](../../lib/svg-squad/render.ts)). The ask: add a short, actionable line beneath/beside
it — something like *"Want to join the Starting XI? Open a Pull Request and earn your spot on the pitch ➔"* — that
turns viewers of a README badge into potential contributors of *that* repo.

## Files involved

- [`lib/svg-squad/render.ts`](../../lib/svg-squad/render.ts) — the `footer` template string (`FOOTER_H` constant
  in [`lib/svg-squad/theme.ts`](../../lib/svg-squad/theme.ts) currently reserves `50`px; the new line needs either
  more footer height or to share the existing line — check both fit before deciding).
- Any dynamic text (repo/owner names are already handled, but if the CTA links anywhere) **must** go through the
  existing `esc()` escaper in the same file — see the "GOTCHAS" section of [`CLAUDE.md`](../../CLAUDE.md) and the
  security note in [`docs/exports.md`](../exports.md#the-svg-route-is-not-satori).

## Acceptance criteria

- [ ] The SVG footer includes a short recruitment line, visually consistent with the rest of the card (same font
      tokens from `lib/svg-squad/theme.ts` / `lib/svg-card/theme.ts`).
- [ ] Doesn't visually collide with the existing logo/URL line or overflow the card's bottom edge — check both the
      full-pitch and small-sided (`isSmallSided`) card heights.
- [ ] Since GitHub's camo proxy re-serves this SVG raw (no live click tracking possible through an `<img>` in a
      README), this is styling/copy only — it does not need to be a real clickable `<a>` inside the SVG; the site
      URL already in the footer is the de facto destination. Decide whether the CTA text mentions the site URL
      explicitly or relies on the existing footer link being nearby, and note your reasoning in the PR.
- [ ] `lib/svg-squad/render.test.ts` updated to cover the new footer content (there's already a test asserting the
      SVG "embeds the logo (header + footer), not just squad content" — extend it, don't skip it).

## Notes

Keep the copy short — this renders inside a fixed-width card at a small font size, not a full paragraph.
