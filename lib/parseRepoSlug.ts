// Shared by SquadSearchInput-style forms and the home OmniSearch: turns
// "owner/repo" or a github.com repo URL (with or without protocol, www,
// trailing slash or ".git") into { owner, repo }.
export function parseRepoSlug(input: string): { owner: string; repo: string } | null {
  const trimmed = input.trim().replace(/\.git$/i, "").replace(/\/+$/, "");
  const urlMatch = trimmed.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s]+)\/([^/\s]+)/i);
  const slugMatch = trimmed.match(/^([^/\s]+)\/([^/\s]+)$/);
  const match = urlMatch ?? slugMatch;
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

export type QueryKind = "player" | "squad";

// A bare token ("torvalds") is a player; anything with a slash or a
// github.com URL is a squad. Empty/whitespace-only input has no kind yet.
export function detectQueryKind(query: string): QueryKind | null {
  const trimmed = query.trim();
  if (!trimmed) return null;
  return trimmed.includes("/") || trimmed.toLowerCase().includes("github.com") ? "squad" : "player";
}
