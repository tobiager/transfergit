// Regenerate the static "legends" dataset: ~50 well-known GitHub accounts,
// pre-scored through the same buildPlayer() pipeline as any visited profile.
// Powers the profile page's ranking circles, the landing ticker, and
// /hall-of-fame. No database involved — this JSON file plus the daily
// .github/workflows/update-legends.yml Action is the entire "backend".
//
// Usage (from the repo root, with a valid .env.local / GITHUB_TOKEN):
//   npm run build:legends
// (stub-server-only.cjs works around the "server-only" package, which
// throws unconditionally outside a Next.js server bundle.)
//
// Rerun whenever the valuation/rating formulas change so the reference set
// stays comparable to live profiles. Output: data/legends.json. Usernames to
// track live in data/legends-list.json — edit that file to add/remove
// legends. `trend` is computed once here, at snapshot time, from that
// legend's own valuation timeline — it's real data, just frozen until the
// next regen. Some usernames may 404/timeout on a given run (huge profiles
// can trip GitHub's GraphQL cost limits) — those are skipped with a
// warning, not fatal.

import fs from "node:fs";
import path from "node:path";
import { fetchGithubProfile } from "../lib/github";
import { buildPlayer } from "../lib/player";
import { computeMarketValueTrend } from "../lib/format";
import { abbreviatePosition } from "../lib/positions";
import { ACHIEVEMENTS, evaluateAchievements } from "../lib/achievements";
import LEGEND_USERNAMES from "../data/legends-list.json";

interface LegendEntry {
  login: string;
  name: string;
  avatarUrl: string;
  marketValue: number;
  marketValueFormatted: string;
  position: string;
  positionAbbrev: string;
  country: string;
  countryIso2: string | null;
  club: string;
  trend: { direction: "up" | "down" | "flat"; pct: number } | null;
  followers: number;
  stars: number;
  commitsThisSeason: number;
  generatedAt: string;
}

async function main() {
  const entries: LegendEntry[] = [];
  const seen = new Set<string>();
  const unlockCounts: Record<string, number> = Object.fromEntries(
    ACHIEVEMENTS.map((a) => [a.id, 0])
  );
  let legendCount = 0;
  const generatedAt = new Date().toISOString();

  for (const username of LEGEND_USERNAMES as string[]) {
    if (seen.has(username.toLowerCase())) continue;
    seen.add(username.toLowerCase());

    try {
      const profile = await fetchGithubProfile(username);
      if (!profile) {
        console.warn(`skip ${username}: not found`);
        continue;
      }
      const player = buildPlayer(profile);
      entries.push({
        login: player.login,
        name: player.name,
        avatarUrl: player.avatarUrl,
        marketValue: player.marketValue,
        marketValueFormatted: player.marketValueFormatted,
        position: player.position.main,
        positionAbbrev: abbreviatePosition(player.position.main),
        country: player.nationalityName,
        countryIso2: player.nationalityIso2,
        club: player.currentClub,
        trend: computeMarketValueTrend(player.marketValueHistory),
        followers: player.trophies.followers,
        stars: player.trophies.stars,
        commitsThisSeason: player.seasons[0]?.commits ?? 0,
        generatedAt,
      });
      legendCount++;
      for (const result of evaluateAchievements(player)) {
        if (result.unlocked) unlockCounts[result.achievement.id]++;
      }
      console.log(`ok ${username}: ${player.marketValueFormatted}`);
    } catch (err) {
      console.warn(`skip ${username}: ${(err as Error).message}`);
    }
  }

  entries.sort((a, b) => b.marketValue - a.marketValue);

  const outPath = path.join(process.cwd(), "data", "legends.json");
  fs.writeFileSync(outPath, JSON.stringify(entries, null, 2) + "\n");
  console.log(`\nWrote ${entries.length} entries to ${outPath}`);

  // Achievement rarity (% of legends unlocked) — used to break ties when
  // picking the Overview cabinet's top 5 (rarer trophies surface first).
  const rarity: Record<string, number> = {};
  for (const [id, count] of Object.entries(unlockCounts)) {
    rarity[id] = legendCount > 0 ? Math.round((count / legendCount) * 1000) / 10 : 0;
  }
  const rarityPath = path.join(process.cwd(), "lib", "achievementRarity.json");
  fs.writeFileSync(rarityPath, JSON.stringify(rarity, null, 2) + "\n");
  console.log(`Wrote achievement rarity (${legendCount} legends) to ${rarityPath}`);
}

main();
