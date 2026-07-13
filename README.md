# Transfergit ⚽

**Your GitHub, valued like a football player.**

Turn any GitHub profile into a Transfermarkt-style player card — with a night-broadcast sports aesthetic: Transfermarkt's editorial seriousness with Champions League production value. Market value calculated from your real activity (commits, stars, pull requests, followers), transfer history, injuries (commit-free streaks), season-by-season stats, and scouting metrics.

Try it with [`/torvalds`](https://transfergit.com/torvalds), [`/gaearon`](https://transfergit.com/gaearon), or your own username.

## How it works

1. Enter a GitHub username.
2. `lib/github.ts` fetches your full public profile via the GitHub GraphQL API (contributions per year, repos, orgs, activity calendar).
3. `lib/player.ts` and the rest of `lib/` translate that data into football terms:
   - **Market value** (`lib/valuation.ts`): a formula based on commits, stars, followers, pull requests, and repos with traction, with multipliers for account age and recent form.
   - **Position** (`lib/positions.ts`): based on the dominant language/category across your repos (frontend → Right Winger, backend → Midfielder, devops → Goalkeeper, etc.).
   - **Injuries** (`lib/injuries.ts`): activity-free streaks over the last year.
   - **Transfers**: dominant-language changes season to season + organization joins.
   - **Scouting metrics**: commits, stars, PRs, code reviews, and activity streak, normalized to a 0-99 scale.
4. Everything renders on a Transfermarkt-style card, exportable as an image for READMEs or social media.

No manual inputs or edits: everything is read live from your public profile.

## Highlighted features

- **Trophy Cabinet** (`lib/achievements.ts`, `components/TrophyCabinetGrid.tsx`): 14 rule-based achievements (Repositories, Impact, Career, Medical Record, Dev Culture), across squad/international/ballon-dor tiers. Locked ones show grayscale with a progress bar; ballon-dor tier trophies get a pulsing gold glow.
- **Ranking** (`lib/ranking.ts`): benchmarks your market value against `data/legends.json`, a static snapshot of real GitHub profiles kept fresh by a daily GitHub Action (regenerable locally with `npm run build:legends`).
- **Position in Detail** (`components/PositionPitch.tsx`, `PositionDetailCard.tsx`): a mini-pitch diagram placing your football position based on the dominant language/category.
- **Light/dark theme toggle** via `next-themes` (`components/ThemeProvider.tsx`).

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (design tokens via `@theme inline` in `app/globals.css`, no `tailwind.config`)
- **GSAP** for entrance animations (profile and landing reveal)
- **Recharts** for the market value evolution chart
- **next-themes** for the light/dark theme toggle
- **next/og** (`ImageResponse`, Satori) for the image export endpoints — run on Edge Runtime
- Fonts: **Archivo Black** / **Archivo** / **Barlow Condensed**, loaded with `next/font/google` on the web and as raw `.ttf` buffers (`assets/fonts/`) for Satori

## Design system

Background with depth (never flat): radial gradient + SVG noise texture (`feTurbulence`) + a subtle pitch pattern on the landing's edges.

| Token | Use |
|---|---|
| `--pitch` `#0a0e1a` → `--pitch-elevated` `#141b2e` | Base background |
| `--tm-blue-deep` `#1a3151` (Transfermarkt navy) | Section and table headers |
| `--value-green` `#00c853` | **Exclusive** to market value, trend arrows, and primary CTAs |
| `--gold` `#ffc400` | Record markers and special highlights |

Cards with a 6% white border, double shadow (ambient + contact) — `.tm-card` utility class in `globals.css`. Subtle 3D tilt on hover for the main card (`components/TiltCard.tsx`).

## Animations (GSAP)

- **`components/ProfileReveal.tsx`**: orchestrates the profile's entrance — main card → sidebar in stagger → chart → scouting bars growing from 0 → season table. Also migrates the market value count-up from `requestAnimationFrame` to GSAP.
- **`components/LandingReveal.tsx`**: headline reveal via `clip-path` line by line, subtitle/input with fade+rise, card fan entering with stagger and rotation, generated-cards counter.
- Everything respects `prefers-reduced-motion`: if enabled, the final state is applied instantly, with no animation.

## Export your card

From `/[username]` there's an export panel (`components/ExportPanel.tsx`) with:

- **Live preview** of two variants — *Full card* (1200×630, for OG/README) and *Compact* (900×1200, vertical collectible card).
- **Copy Markdown**: copies an embedded image linking to your card — paste it into your GitHub README.
- **Download PNG** of the selected variant.
- **Share on X / LinkedIn**.

The endpoints (`app/api/og/[username]/route.tsx` and `.../card/route.tsx`) generate the images on Edge Runtime with `next/og`, share the same color/typography tokens as the web, and cache with `s-maxage=86400, stale-while-revalidate`.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in GITHUB_TOKEN with a Personal Access Token (no special scopes, public read-only)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `GITHUB_TOKEN` | Yes | GitHub Personal Access Token, only used to read public profiles via GraphQL |
| `NEXT_PUBLIC_SITE_URL` | No | Public site URL, used in OG tags and export panel links. Falls back to `VERCEL_URL` or `http://localhost:3000` if unset |

## Project structure

```
app/
  page.tsx                 # Landing
  [username]/page.tsx      # Player card
  api/og/[username]/       # Image export endpoints (next/og)
components/                # Card, landing, and export panel UI
lib/                       # Data fetching (GitHub GraphQL) and football-terms translation logic
assets/fonts/              # .ttf files used by Satori (can't be loaded via CSS)
public/fan-cards/          # Pre-rendered cards of well-known devs for the landing fan
```

## Build

```bash
npm run build
npm run start
```

---

Made by [@tobiager](https://github.com/tobiager).
