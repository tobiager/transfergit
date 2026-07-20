**Title:** Improve the "not enough players" empty state for small repos
**Labels:** `good first issue`, `enhancement`, `area:squad`
**Estimate:** S-M (~half a day)

## Context

A repo with fewer than 3 human contributors (`MIN_HUMAN_CONTRIBUTORS` in
[`lib/squad/contributors.ts`](../../lib/squad/contributors.ts)) throws `NotEnoughPlayersError`, caught in
[`app/squad/[owner]/[repo]/page.tsx`](../../app/squad/%5Bowner%5D/%5Brepo%5D/page.tsx) and rendered as
[`components/squad/SquadEmptyState.tsx`](../../components/squad/SquadEmptyState.tsx) — today, that's just:

```tsx
<p>🟥</p>
<h1>Not enough players to field a squad</h1>
<p>{owner}/{repo} doesn't have enough human contributors for a matchday squad — at least 3 are needed to line up.
   Scout a bigger club.</p>
<Link href="/">Back to the market</Link>
```

It's a dead end — no suggestion of where to go next besides "back to the homepage." The same 200-status placeholder
problem exists on the export side: `renderSquadErrorCardSvg` in
[`lib/svg-squad/render.ts`](../../lib/svg-squad/render.ts) and the OG route's `ErrorImage` show a generic message
("Not enough contributors to field a squad") with the same lack of a next step.

## Files involved

- `components/squad/SquadEmptyState.tsx` — the live-page empty state.
- `lib/svg-squad/render.ts` (`renderSquadErrorCardSvg`) and
  `app/api/og/squad/[owner]/[repo]/route.tsx` (`ErrorImage`) — the export-side placeholders, lower priority (small,
  fixed-size images have much less room for a next step than the live page).
- `components/SquadSearchInput.tsx` — the search box this empty state should likely funnel back into.

## Acceptance criteria

- [ ] `SquadEmptyState` gives the visitor an actual next action beyond "back to the market" — e.g. a
      `SquadSearchInput` right there to try another repo, and/or 2-3 example repo links (mirror the pattern
      `app/page.tsx`'s `TRY_USERNAMES` already uses for the player-card search).
- [ ] Tone stays consistent with the rest of the app's football framing (see "Project philosophy" in
      [`CONTRIBUTING.md`](../../CONTRIBUTING.md)) — don't just swap in generic empty-state copy.
- [ ] No change to the *logic* of when this state triggers (`NotEnoughPlayersError`, `MIN_HUMAN_CONTRIBUTORS = 3`)
      — this issue is presentation only.
- [ ] If you also touch the export-side placeholders, keep them simple — a fixed-size PNG/SVG doesn't have room
      for a search box, so "next step" there might just mean clearer copy, not new interactivity.

## Notes

Good first issue specifically because the trigger condition and data flow are already correct and well-tested
(see `lib/squad/contributors.test.ts`) — this is purely about what the human sees when it fires.
