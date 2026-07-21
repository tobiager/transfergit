<div align="center">

<img src="public/transfergit/signboard.png" width="500" alt="Transfergit">

**Your GitHub, valued like a football player.**
Market value, transfer history, injuries — the whole file.

[![GitHub stars](https://img.shields.io/github/stars/tobiager/transfergit?style=flat-square&color=00c853)](https://github.com/tobiager/transfergit/stargazers)
[![License: MIT](https://img.shields.io/badge/license-MIT-1a3151?style=flat-square)](LICENSE)
[![Deployed on Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black?style=flat-square&logo=vercel)](https://transfergit.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-ffc400?style=flat-square)](#contributing--roadmap)

### **[⚽ Get your card →](https://transfergit.com)**

<a href="https://transfergit.com/torvalds"><img src="https://www.transfergit.com/api/og/torvalds/portrait" width="240" alt="Transfergit card"></a>


</div>

---

## Get yours in 10 seconds

1. Go to **[transfergit.com](https://transfergit.com)** and type your username.
2. Hit **Copy Markdown** and paste it into your GitHub profile README.

```md
[![Transfergit card](https://transfergit.com/api/svg/YOUR_USERNAME/readme)](https://transfergit.com/YOUR_USERNAME)
```

That's it. Your README now has a transfer fee — the card is a live SVG, so it updates and animates on its own, no re-commit needed.

## What you get

-  **Market value in euros** — real formula, deliberately absurd inputs
-  **Transfer history** — pulled from the orgs you've actually joined
-  **Injury history** — burnout streaks detected from your commit calendar
-  **Trophy cabinet** — 14 achievements across squad / international / Ballon d'Or tiers
-  **Scouting metrics** — commits, stars, PRs, reviews, streaks, normalized 0-99
-  **Season-by-season stats** — one row per year you've shown up
-  **Rank vs. legends** — percentile tier from PROSPECT to TOP 0.1%
-  **Hall of Fame** — see where you land next to torvalds, gaearon, and co.
-  **5 export formats** — README · Full (4:5), Player card (1:1), Player card · Portrait (3:4), Story (9:16), Banner (16:9)

<details>
  <summary><b>⚽ View TransferGit profile and market statistics (Click to expand)</b></summary>
  <br>
  <p align="center">
    <a href="https://transfergit.com/torvalds">
      <img src="https://www.transfergit.com/api/og/torvalds/readme" width="800" alt="Transfergit card">
    </a>
  </p>
</details>

## How the market value works

```
value = 50,000
      + commits        × €800
      + stars          × €4,000
      + followers      × €6,000
      + pull requests  × €2,500
      + repos >10★     × €25,000

× form multiplier   (up to +50%, based on last 12 months' commits)
× age multiplier    (0.8× under 2 years, 1.1× over 6 — young prospect vs. veteran)
```

| ⚽ Football | 🐙 GitHub |
|---|---|
| Goals | Commits |
| Assists | Pull requests |
| Yellow cards | Issues opened |
| Caps / appearances | Repos with traction |
| Transfer fee | Market value |
| Injury | 14+ day commit-free streak |
| Preferred foot | Typed language (right) vs. dynamic (left) |
| Position | Dominant language category |

Is it scientific? No. Is your value higher than Messi's? Probably. ⚽

## Stack & self-hosting

**Next.js 15 · TypeScript · Tailwind v4 · GSAP + Lenis · @vercel/og · GitHub GraphQL API**

```bash
git clone https://github.com/tobiager/transfergit.git
cd transfergit
cp .env.example .env.local   # fill in GITHUB_TOKEN (read-only PAT, no special scopes)
npm i && npm run dev
```

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tobiager/transfergit)

The **legends dataset** (`data/legends.json`) is a snapshot of real profiles used for percentile ranking. Run `npm run build:legends` to re-fetch everyone in `data/legends-list.json` and regenerate the snapshot (no automated cron currently runs this — see [Contributing + roadmap](#contributing--roadmap) below).

## Documentation

Deep-dive docs live in [`/docs`](docs/): [architecture](docs/architecture.md), [Repo Squad pipeline](docs/squad.md),
[market value formula](docs/market-value.md), [exports](docs/exports.md),
[caching & rate limits](docs/caching-and-rate-limits.md), and [formations](docs/formations.md). Contributor
guidelines live in [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Contributing + roadmap

Want a legend added to the ranking? Add their username to [`data/legends-list.json`](data/legends-list.json), run `npm run build:legends` to regenerate `data/legends.json`, and open a PR with both files changed. Easiest way to get a merged PR here.

Roadmap:

- [ ] Versus mode — head-to-head card comparison
- [ ] Tournament mode — 4 / 8 / 16 / 32 player brackets
- [ ] Global leaderboard
- [ ] Transfer rumors generator
- [ ] Org / team cards

Looking for a place to start? Check issues labeled **[`good first issue`](https://github.com/tobiager/transfergit/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)**.

---

<div align="center">

Built by [@tobiager](https://github.com/tobiager) in Argentina 🇦🇷 during the 2026 World Cup

*Transfergit is a parody project, not affiliated with or endorsed by Transfermarkt GmbH & Co. KG. All GitHub data is public; nothing is stored beyond a cached snapshot. No sign-up, no tracking.*

</div>
