import "server-only";

const AVATAR_TIMEOUT_MS = 3000;
// Same TTL as the GitHub GraphQL profile fetch (lib/github.ts) so the
// avatar and the rest of the player data go stale together.
const AVATAR_REVALIDATE_SECONDS = 86400;

// Explicit process-local cache on top of the `fetch` Data Cache above — a
// squad export panel renders up to 6 variants (3 formats × 2 themes) of the
// same roster, each a separate route invocation; this makes the 2nd-6th
// variant's avatars free in-process instead of depending on the Data
// Cache's own (less predictable, POST-adjacent) behavior. Keyed by URL+size
// since formats fetch different avatar sizes for the same login.
const AVATAR_CACHE_TTL_MS = AVATAR_REVALIDATE_SECONDS * 1000;
const avatarCache = new Map<string, { dataUri: string | null; expiresAt: number }>();

// Fetches the GitHub avatar server-side and inlines it as a data URI so the
// SVG never references an external image — required since GitHub's camo
// proxy re-serves this SVG raw and won't fetch anything it points to.
// Returns null on any failure so the caller can fall back to an initials
// circle instead of a broken image.
export async function fetchAvatarDataUri(avatarUrl: string, size = 128): Promise<string | null> {
  const cacheKey = `${avatarUrl}|${size}`;
  const cached = avatarCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.dataUri;

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
    const dataUri = `data:${contentType};base64,${Buffer.from(buffer).toString("base64")}`;
    avatarCache.set(cacheKey, { dataUri, expiresAt: Date.now() + AVATAR_CACHE_TTL_MS });
    return dataUri;
  } catch {
    return null;
  }
}
