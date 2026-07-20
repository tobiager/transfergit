**Title:** Fix hardcoded plurals that don't use `pluralize()`
**Labels:** `good first issue`, `bug`, `area:squad`
**Estimate:** S (~1-2 hours)

## Context

[`lib/format.ts`](../../lib/format.ts) has a `pluralize(count, singular, plural?)` helper, and most player-facing
counts already use it (e.g. `pluralize(player.commits, "commit")` in
[`components/squad/PlayerChip.tsx`](../../components/squad/PlayerChip.tsx) and
[`components/squad/SquadReserves.tsx`](../../components/squad/SquadReserves.tsx),
`pluralize(playerCount, "player")` in [`components/squad/SquadHeader.tsx`](../../components/squad/SquadHeader.tsx)).

But not everywhere — two confirmed, real inconsistencies:

- `app/api/og/squad/[owner]/[repo]/route.tsx`'s `CardHeader` component renders
  `<div>{playerCount} players</div>` unconditionally — a 1-contributor squad (the minimum is 3, so this specific
  case can't happen today, but the pattern is wrong regardless) would read "1 players".
- `lib/svg-squad/render.ts`'s header renders `>${playerCount} players</text>` the same way, hardcoded.

## Files involved

- [`app/api/og/squad/[owner]/[repo]/route.tsx`](../../app/api/og/squad/%5Bowner%5D/%5Brepo%5D/route.tsx) —
  `CardHeader`'s `{playerCount} players` text.
- [`lib/svg-squad/render.ts`](../../lib/svg-squad/render.ts) — the header's `${playerCount} players` template
  string.
- Both already import from `lib/format.ts` in nearby code (`pluralize` is used elsewhere in
  `lib/svg-squad/render.ts` for commit counts) — this is a one-line fix in each place, not a new import.

## Acceptance criteria

- [ ] Both spots use `pluralize(playerCount, "player")` instead of a hardcoded `"players"`.
- [ ] Do a broader pass: grep the codebase (`components/`, `app/api/og/`, `lib/svg-card/`, `lib/svg-squad/`) for
      other `${count} word` patterns that should go through `pluralize` but don't, and fix any real ones you find.
      Not every count needs this — a label like `"Bench · {squad.bench.length}"` (a fixed UI label, not a sentence)
      is fine as-is; use judgment.
- [ ] `npm test` still passes — if you touch `lib/svg-squad/render.test.ts`'s expectations, make sure the fix is
      reflected there too.

## Notes

Small, contained, good for a first PR — but still needs `npm run build`/`lint`/`test` all green, same as any other
change.
