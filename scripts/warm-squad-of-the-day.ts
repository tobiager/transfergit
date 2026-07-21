// Run daily (see .github/workflows/warm-squad-of-the-day.yml) so tomorrow's
// "Squad of the day" repo already has a warm 6h getRepoSquad cache by the
// time anyone's browser hits the home page — the home never computes a
// squad from a cold cache in a live request (see components/home/
// SquadOfTheDay.tsx). Hitting the real /squad/[owner]/[repo] page (not a
// dedicated endpoint) is deliberate: it's the exact same code path a real
// visitor takes, so it warms the exact same cache entry.
import { pickFeaturedRepo } from "../lib/squad/featuredRepos.ts";
import { getSiteUrl } from "../lib/site-url.ts";

const tomorrow = new Date();
tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
const { owner, repo } = pickFeaturedRepo(tomorrow);

const url = `${getSiteUrl()}/squad/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
console.log(`Warming ${url} for tomorrow's Squad of the Day (${owner}/${repo})`);

const res = await fetch(url);
if (!res.ok) {
  console.error(`Warm-up request failed: ${res.status} ${res.statusText}`);
  process.exit(1);
}
console.log("Warmed successfully.");
