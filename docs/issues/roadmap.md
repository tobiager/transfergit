**Title:** Roadmap
**Labels:** none required, but `pinned` if your tracker distinguishes it
**Pin this issue** after creating it (`gh issue pin` or the "Pin issue" button on GitHub) — it's meant to be the
first thing a new contributor sees.

---

## Where things stand

- ✅ Player cards — market value, transfer history, injuries, trophy cabinet, scouting metrics, season stats,
  Hall of Fame ranking.
- ✅ Repo Squad — GitHub repo contributors fielded as a football squad, tiered valuation, formations (standard +
  degrade table for small squads), captain/MVP, custom drag-and-drop layouts.
- ✅ Exports — 5 player-card formats + 4 squad formats (PNG via Satori, plus dynamic self-animating SVG for both),
  WYSIWYG with whatever's on screen, floodlight/grass themes.
- ✅ Dynamic SVG README embeds — auto-update via GitHub's camo proxy `Cache-Control` behavior, no cron needed for
  freshness (the legends dataset cron is separate — see [`docs/caching-and-rate-limits.md`](../caching-and-rate-limits.md)).

## What's next

Roughly ordered by what actually moves the project forward vs. what's a nice-to-have:

- Optional GitHub OAuth login so a signed-in visitor's lookups use their own rate-limit budget instead of the
  shared one (see [issue: OAuth rate-limit boost](01-oauth-rate-limit-boost.md)).
- More export themes beyond floodlight/grass (chalkboard is in progress/proposed — see
  [issue: chalkboard theme](02-chalkboard-export-theme.md)).
- Broader language coverage in the position/stack mapping (see
  [issue: more languages](07-more-languages-position-mapping.md)).
- Home page redesign as a proper "transfer market front page" — see the design brief:
  [`docs/design-brief-home.md`](../design-brief-home.md) (not yet implemented, no code exists for this yet).
- Roadmap items from the README itself: Versus mode (head-to-head card comparison), Tournament mode
  (4/8/16/32-player brackets), a global leaderboard, a transfer rumors generator, org/team cards.

See the full [`good first issue`](https://github.com/tobiager/transfergit/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
label for concrete, scoped starting points, several with acceptance criteria already written up in
[`docs/issues/`](.).

## A note on response time

I'm a student maintaining this in my spare time — response may take a day or two, longer during exam weeks.
PRs are very welcome; please don't read a slow reply as disinterest.
