<!-- Banner -->
<p align="center">
  <a href="https://github.com/tobiager/transfergit">
    <img src="public/transfergit/contribution-banner.png" style="border-radius: 10px;" alt="Contribution Guide" width="1000">
  </a>
</p>

<div align="center">

# 🤝 Contributing to Transfergit

Thanks for wanting to help build the developer transfer market. This guide gets you from clone to merged PR.

</div>

---

## Project philosophy

Read this before anything else, it's short:

- The joke is the presentation, not the data. Every commit, star, follower, and market value on a card is real,
  pulled live from the GitHub API — no mocked numbers, no fake profiles.
- Football is the language, not a costume. Positions, formations, transfer fees, injuries — every mechanic should
  map to something real about a GitHub profile or repo, not just look football-shaped.
- Keep it small. This is a deliberately dependency-light project (see the rules below) — the funniest, most
  shippable version of an idea beats the most complete one.
- It's a parody of Transfermarkt, not affiliated with it. Keep that boundary in mind for anything branding-adjacent.

## Setup

```bash
git clone https://github.com/YOUR_USERNAME/transfergit.git
cd transfergit
npm install
cp .env.example .env.local
```

Open `.env.local` and set `GITHUB_TOKEN` — a GitHub Personal Access Token with **zero scopes** (classic) or no
permissions (fine-grained) is enough, since everything fetched is public data. It exists to raise your rate limit
from 60 requests/hour (unauthenticated) to 5,000/hour, not to grant access to anything private. Create one at
[github.com/settings/tokens](https://github.com/settings/tokens). Full details, including why it's required and
what it costs per page load, are in `.env.example` and [`docs/caching-and-rate-limits.md`](docs/caching-and-rate-limits.md).

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), try your own username or `/squad/vercel/next.js`.

## Workflow

1. **Fork** the repo and clone your fork.
2. Branch off `develop`, not `main`: `git checkout -b feature/short-description develop`.
3. Make your change. Keep the diff focused — one PR, one concern.
4. Before opening the PR, run all three locally:
   ```bash
   npm run build
   npm run lint
   npm test
   ```
5. Open the PR **against `develop`**, not `main` — `main` only receives merges from `develop` at release time.
6. CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs `lint`, `test`, and `build` on every PR — it
   has to be green before merge. If it's red, the logs on the PR tell you exactly which of the three failed.

### PR checklist

The [PR template](.github/PULL_REQUEST_TEMPLATE.md) walks you through this automatically, but in short:

- [ ] `npm run build`, `npm run lint`, and `npm test` all pass locally.
- [ ] UI copy is in English (see rules below).
- [ ] If it touches UI: a before/after screenshot (or a short screen recording for anything interactive, like
      dragging a squad chip).
- [ ] If it touches `lib/squad/`, `lib/valuation.ts`, or anything else with existing `*.test.ts` coverage: the tests
      still reflect the new behavior, not just "still pass by accident."

## Project rules

The full, longer version of these lives in [`CLAUDE.md`](CLAUDE.md) — this is the summary:

- **TypeScript `strict: true`, zero `any`.** If you're reaching for `any`, the type is telling you something —
  model it properly instead.
- **No new dependencies without a real reason.** Check `package.json` first; this repo is deliberately small. "It
  would save me 20 lines" is not a reason — "there is no reasonable way to do this without it" is.
- **`import "server-only"` on anything that fetches data or reads env vars.** Pure/computational modules
  (formulas, formatting, formation tables) don't need it — see `docs/architecture.md` for the actual split.
- **UI copy is English, always** — this repo targets an international audience. (This file, issue/PR discussion,
  and commit conversation can be in whatever language works for you.)

## Where to start

- Read [`docs/`](docs/) for how the codebase actually works: [architecture](docs/architecture.md),
  [Repo Squad pipeline](docs/squad.md), [market value formula](docs/market-value.md),
  [exports](docs/exports.md), [caching & rate limits](docs/caching-and-rate-limits.md),
  [formations](docs/formations.md).
- Browse issues labeled [`good first issue`](https://github.com/tobiager/transfergit/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) —
  each one has context, the files it touches, and acceptance criteria, so you don't have to reverse-engineer scope
  from a one-line title.
- Check the pinned **Roadmap** issue for what's already planned vs. genuinely up for grabs.
- Anything else you want to build? Open an issue first with what you're proposing before sinking time into a PR —
  saves us both a rewrite if the direction doesn't fit.

---

I'm a student maintaining this in my spare time — review may take a day or two, especially during exam weeks.
That's not a reflection of how much I want your PR; it just means please don't take the silence personally. 🇦🇷⚽
