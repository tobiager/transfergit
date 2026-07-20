**Title:** "New Signing" card — maintainer export for a contributor's first merged PR
**Labels:** `good first issue`, `enhancement`, `area:exports`, `area:squad`
**Estimate:** L (~2-3 days) — new export format + new UI surface, biggest item in this batch.

## Context

Idea: when a contributor lands their first significant PR on a repo, the repo's maintainer can generate a
Real-Madrid-presentation-style card to post: *"🚨 OFFICIAL DEAL: @username joins the @owner/repo squad! Transfer
Fee: €75k. Welcome to the pitch!"* — a shareable, celebratory image, distinct from the existing squad exports which
show the whole XI, not one new signing.

This is genuinely new surface area, not a variant of an existing route — scope it as such rather than trying to
force-fit it into the existing `SquadExportPanel`.

## Files involved (starting points, not a fixed list — this needs its own design)

- New render function, likely `lib/svg-squad/render.ts` (or a new `renderNewSigningCard`) and/or a new OG route
  under `app/api/og/squad/[owner]/[repo]/signing/` (or similar) — model the params/caching approach on
  [`app/api/og/squad/[owner]/[repo]/route.tsx`](../../app/api/og/squad/%5Bowner%5D/%5Brepo%5D/route.tsx).
- "Transfer Fee" needs a real number — the obvious source is the player's own `marketValue`
  (`lib/squad/valuation.ts`), not an arbitrary constant; decide how (full value? a fraction, echoing the existing
  "transfer fee" flavor text elsewhere in the app — see `README.md`'s football↔GitHub mapping table) and document
  the choice.
- New UI entry point for triggering this — where a maintainer generates it (e.g. from the squad page, gated to
  "the person is in this squad"). No auth/maintainer-identity system exists in this project yet — the first version
  can be a plain, unauthenticated generator (like every other export) rather than gated to "verified maintainers";
  note that tradeoff explicitly in the PR.

## Acceptance criteria

- [ ] Given an `owner/repo` and a contributor `login` already in that squad, produces a shareable image in the
      existing visual language (fonts/colors/theme system) announcing the "signing."
- [ ] A real, explained number for "Transfer Fee" — not a placeholder.
- [ ] Has a Copy Markdown / Download / Share flow consistent with `SquadExportPanel`'s existing pattern (reuse
      those components/patterns rather than inventing new ones).
- [ ] `docs/exports.md` gets a section for this new format.

## Notes

This is the most open-ended issue in the batch — comment on the issue with your proposed approach (route shape,
where the fee number comes from, where the trigger UI lives) before investing in a full implementation, so scope
doesn't drift.
