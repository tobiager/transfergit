// Curated pool for the home page's "Squad of the day" — no repo list like
// this exists elsewhere in the repo (data/legends-list.json is usernames,
// not repos). Picked for name recognition + a healthy 11+ contributor count
// so they always resolve to a full 4-3-3.
export const FEATURED_REPOS = [
  { owner: "rust-lang", repo: "rust" },
  { owner: "facebook", repo: "react" },
  { owner: "vercel", repo: "next.js" },
  { owner: "sveltejs", repo: "svelte" },
  { owner: "vuejs", repo: "core" },
  { owner: "microsoft", repo: "typescript" },
  { owner: "supabase", repo: "supabase" },
  { owner: "tailwindlabs", repo: "tailwindcss" },
  { owner: "nodejs", repo: "node" },
  { owner: "denoland", repo: "deno" },
  { owner: "withastro", repo: "astro" },
  { owner: "torvalds", repo: "linux" },
  { owner: "golang", repo: "go" },
] as const;

// Simple string hash (djb2-ish) over "YYYY-MM-DD" — deterministic, no crypto
// needed for a cosmetic daily pick. UTC so the "same repo all day for
// everyone" holds regardless of the viewer's timezone.
function simpleHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function isoDateUTC(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function pickFeaturedRepo(date: Date = new Date()): { owner: string; repo: string } {
  const index = simpleHash(isoDateUTC(date)) % FEATURED_REPOS.length;
  return FEATURED_REPOS[index];
}
