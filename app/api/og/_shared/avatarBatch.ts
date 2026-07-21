import { fetchAvatarDataUri } from "@/lib/svg-card/avatar";

const CONCURRENCY = 4;

// Fetches many avatars to base64 data URIs with bounded concurrency —
// Satori needs every image inlined (no external fetch during rasterization),
// and firing all 11+ requests at once would both hammer GitHub's CDN and
// hold the route open longer than a few staggered batches would.
export async function fetchAvatarsBatch(urls: string[], size: number): Promise<Map<string, string | null>> {
  const result = new Map<string, string | null>();
  let next = 0;

  async function worker() {
    while (next < urls.length) {
      const url = urls[next++];
      result.set(url, await fetchAvatarDataUri(url, size));
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, urls.length) }, worker));
  return result;
}
