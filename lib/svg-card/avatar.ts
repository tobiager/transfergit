import "server-only";

const AVATAR_TIMEOUT_MS = 3000;
// Same TTL as the GitHub GraphQL profile fetch (lib/github.ts) so the
// avatar and the rest of the player data go stale together.
const AVATAR_REVALIDATE_SECONDS = 86400;

// Fetches the GitHub avatar server-side and inlines it as a data URI so the
// SVG never references an external image — required since GitHub's camo
// proxy re-serves this SVG raw and won't fetch anything it points to.
// Returns null on any failure so the caller can fall back to an initials
// circle instead of a broken image.
export async function fetchAvatarDataUri(avatarUrl: string, size = 128): Promise<string | null> {
  try {
    const url = new URL(avatarUrl);
    url.searchParams.set("size", String(size));

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(AVATAR_TIMEOUT_MS),
      next: { revalidate: AVATAR_REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "image/png";
    const buffer = await res.arrayBuffer();
    return `data:${contentType};base64,${Buffer.from(buffer).toString("base64")}`;
  } catch {
    return null;
  }
}
