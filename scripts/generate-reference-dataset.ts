// Regenerate the static reference dataset used for the profile page's
// "ranking circles" (Block 8): a fixed set of well-known GitHub accounts,
// pre-scored through the same buildPlayer() pipeline as any visited profile.
//
// Usage (from the repo root, with a valid .env.local / GITHUB_TOKEN):
//   node --env-file=.env.local -r ./scripts/stub-server-only.cjs --import tsx scripts/generate-reference-dataset.ts
// (stub-server-only.cjs works around the "server-only" package, which
// throws unconditionally outside a Next.js server bundle.)
//
// Rerun whenever the valuation/rating formulas change so the reference set
// stays comparable to live profiles. Output: lib/referenceDataset.json.
// Some usernames may 404/timeout on a given run (huge profiles can trip
// GitHub's GraphQL cost limits) — those are skipped with a warning, not
// fatal.

import fs from "node:fs";
import path from "node:path";
import { fetchGithubProfile } from "../lib/github";
import { buildPlayer } from "../lib/player";

const REFERENCE_USERNAMES = [
  "torvalds", "gaearon", "sindresorhus", "tj", "addyosmani", "kentcdodds",
  "wesbos", "mdo", "defunkt", "mojombo", "yyx990803", "rich-harris",
  "ryanflorence", "mjackson", "jaredpalmer", "developit", "acdlite",
  "threepointone", "tannerlinsley", "paulirish", "jakearchibald",
  "getify", "substack", "isaacs", "feross", "fabpot", "taylorotwell",
  "egoist", "antfu", "swyx", "steveklabnik", "BurntSushi", "dtolnay",
  "alexcrichton", "tomchristie", "dhh", "matz", "jeresig", "vjeux",
  "gcanti", "sophiebits", "Rich-Harris", "shadcn", "leerob", "rauchg",
  "wycats", "jashkenas", "douglascrockford", "paulmillr", "ai",
];

interface ReferenceEntry {
  login: string;
  name: string;
  avatarUrl: string;
  marketValue: number;
  marketValueFormatted: string;
  position: string;
}

async function main() {
  const entries: ReferenceEntry[] = [];

  for (const username of REFERENCE_USERNAMES) {
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
      });
      console.log(`ok ${username}: ${player.marketValueFormatted}`);
    } catch (err) {
      console.warn(`skip ${username}: ${(err as Error).message}`);
    }
  }

  entries.sort((a, b) => b.marketValue - a.marketValue);

  const outPath = path.join(process.cwd(), "lib", "referenceDataset.json");
  fs.writeFileSync(outPath, JSON.stringify(entries, null, 2) + "\n");
  console.log(`\nWrote ${entries.length} entries to ${outPath}`);
}

main();
