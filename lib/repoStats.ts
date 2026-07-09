// Public REST call (no auth needed) for the navbar's "Star on GitHub" count.
// Cached for 1h; returns null on any failure so the caller can hide the count.
export async function fetchRepoStarCount(): Promise<number | null> {
  try {
    const res = await fetch("https://api.github.com/repos/tobiager/transfergit", {
      next: { revalidate: 3600 },
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { stargazers_count?: number };
    return data.stargazers_count ?? null;
  } catch {
    return null;
  }
}
