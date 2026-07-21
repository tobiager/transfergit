# Design brief: home page redesign — "transfer market front page"

**Status: implemented, but diverged from this brief.** A home-page redesign shipped (`app/page.tsx` +
`components/home/`), and it keeps this brief's *goal* — read as a market's front page, sell both products, not
just a calculator — but several concrete mechanisms below describe an earlier direction that was superseded during
implementation. This file is kept as historical/aspirational context, not a living spec; **see
[`architecture.md`](architecture.md#home-page--) for what's actually on the page today.** Notably different from
what's written below:

- No `Player | Squad` hero toggle exists. Instead there's one `OmniSearch` box
  (`components/home/OmniSearch.tsx`) that auto-detects whether the typed query looks like a username or an
  `owner/repo` slug (`lib/parseRepoSlug.ts`) and routes accordingly — same end goal (one hero sells both
  products), different mechanism (detection instead of a manual toggle).
- The hero's visual is a draggable 3D card ring (`components/home/HeroShowcase.tsx`, pre-generated card images,
  CSS `rotateY`/`translateZ`), not the brief's `DevFan`/static-pitch-preview pairing.
- The ticker (`components/home/SigningsTicker.tsx`) sits inside the hero block itself (fills out the "one screen"
  hero + navbar), not moved to the very top of the page above the hero as the brief specifies.
- "Squad of the Day" was actually built ([`components/home/SquadOfTheDay.tsx`](../components/home/SquadOfTheDay.tsx))
  using the hand-curated-list approach this brief called out as the simplest option
  ([`lib/squad/featuredRepos.ts`](../lib/squad/featuredRepos.ts), UTC-date hash rotation) — that part landed
  close to spec.
- "Most Valuable Players" ([`components/home/MostValuablePlayers.tsx`](../components/home/MostValuablePlayers.tsx))
  also landed close to spec: top legends from `data/legends.json`, links to `/hall-of-fame`.
- One factual note unrelated to the redesign itself: the "What exists today" section below cites
  `.github/workflows/update-legends.yml` refreshing `data/legends.json` daily — that workflow file does not exist
  in the repo today; only `.github/workflows/warm-squad-of-the-day.yml` does, and it warms the squad cache, not
  the legends dataset. `npm run build:legends` currently has no automated cron trigger at all.

The rest of this document is preserved as originally written, for historical context on the brief's reasoning.

---

**Original status line: not implemented.** This was a brief for a pending redesign of
[`app/page.tsx`](../app/page.tsx), not a description of current code at the time it was written.

## Why

The home page currently sells one product (the player card: hero, search input, "how it works", ticker). Repo
Squad is a full second product with its own page, its own export system, and its own search
([`components/SquadSearchInput.tsx`](../components/SquadSearchInput.tsx)) — but the home page treats it as an
afterthought (a single small link under the main search box). The redesign should read as a market's front page:
somewhere to browse *today's* activity, not just a calculator you feed your own username into.

## What exists today (reuse, don't rebuild)

- **Ticker** ([`components/Ticker.tsx`](../components/Ticker.tsx)) — already a horizontally-scrolling strip of
  `data/legends.json` entries (login, value, trend arrow), already sits at the bottom of the home page. The brief
  below moves it to the top and keeps it as-is.
- **Legends dataset** ([`data/legends.json`](../data/legends.json), refreshed daily by
  [`.github/workflows/update-legends.yml`](../.github/workflows/update-legends.yml)) — already has
  `login, name, avatarUrl, marketValueFormatted, positionAbbrev, country, countryIso2, club, trend`. The Hall of
  Fame table ([`app/hall-of-fame/page.tsx`](../app/hall-of-fame/page.tsx)) is the existing reference implementation
  for rendering this as a ranked table — reuse its row shape/styling for the new "Most Valuable" section instead of
  inventing a new one.
- **`SearchInput`** / **`SquadSearchInput`** — both already exist and both already work; the brief only asks to
  re-lay-out where they sit, not to change how they behave.

## Sections, top to bottom

1. **Ticker** (moved from bottom to top of page) — no logic change, just placement. Gives the page an
   "always-live-data" feel before the user does anything.

2. **Hero with a Player/Squad toggle.** One hero block, two states:
   - **Player** (current default): today's headline (`THE DEV TRANSFER MARKET`), subtitle, `SearchInput`, "Try"
     chips (`torvalds`, `yyx990803`, `addyosmani`).
   - **Squad**: parallel headline oriented at repos (e.g. "FIELD YOUR REPO"), `SquadSearchInput`, and 2–3 example
     repo chips (pick well-known, contributor-rich repos — same pattern as `TRY_USERNAMES`, e.g. a link to
     `/squad/vercel/next.js`).
   - Toggle is a simple two-tab control above the headline (`Player | Squad`), client-side, no navigation — swaps
     which half of the hero renders. Keep `DevFan` (or an equivalent squad-flavored visual) on the Player side;
     Squad side can reuse the pitch/formation visual language from `components/squad/SquadPitch.tsx` for a small
     static preview graphic, not a live interactive pitch.

3. **"Squad of the Day"** — one featured repo, shown as a compact static squad preview (reuse the squad OG
   `format=landscape` image, e.g. `<img src="/api/og/squad/{owner}/{repo}?format=landscape">`, wrapped in a link to
   `/squad/{owner}/{repo}`) plus a one-line caption ("today's fielded repo: {owner}/{repo}, valued at {total}").
   **Needs a source for "which repo"** — out of scope for this brief to design a rotation/curation system; the
   simplest starting point is a small hand-curated list (mirrors how `data/legends-list.json` seeds the legends
   dataset) with a fixed daily rotation (`day-of-year % list.length`), no new backend.

4. **"Most Valuable Players" table** — top N (suggest 10, matching the ticker's `TICKER_ITEMS.slice(0, 20)` scale
   but tighter for a homepage teaser) rows from `data/legends.json`, styled like
   `app/hall-of-fame/page.tsx`'s existing table (`#`, avatar + login, club, value, trend), each row linking to
   `/{login}`. End the section with a "View full Hall of Fame →" link to `/hall-of-fame`. This is a straight reuse
   of existing data and an existing row pattern — no new fetching logic needed.

5. **"How the market works"** — keep as-is (`HOW_IT_WORKS` in `app/page.tsx`), it explains the mechanic and still
   applies to both products.

## Explicit non-goals

- No new API routes, no new data source beyond what's listed above (the Squad-of-the-Day rotation list is the one
  new *file*, not a new *system*).
- No changes to `SearchInput`/`SquadSearchInput` behavior, `Ticker`'s data logic, or the Hall of Fame page itself —
  this brief only asks for reuse/relayout on the home page.
- Not a redesign of the player or squad pages themselves.

## Open questions for whoever implements this

- Squad-of-the-Day source: hand-curated list (simple, matches existing `legends-list.json` precedent) vs. picking
  from repos already visited recently (needs a new tracking mechanism — out of scope unless explicitly requested).
- Whether the Player/Squad hero toggle should sync to a query param (`?mode=squad`) for shareable links, or stay
  pure client state. Lean toward query param since the rest of the codebase already treats the URL as the source
  of truth for view state (see `components/squad/SquadInteractive.tsx`).
