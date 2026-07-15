import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

// Flags in public/flags/*.svg are already circle-masked (see the mask def
// inside each file), so embedding one verbatim as a data URI needs no extra
// clipPath — same file the client-side <Flag> component points at, just
// read straight off disk (no network fetch, no timeout) since this runs
// server-side in the same deployment that serves those static assets.
const flagCache = new Map<string, string | null>();

export async function getFlagDataUri(iso2: string | null): Promise<string | null> {
  if (!iso2) return null;
  const key = iso2.toLowerCase();
  if (flagCache.has(key)) return flagCache.get(key) ?? null;

  try {
    const filePath = path.join(process.cwd(), "public", "flags", `${key}.svg`);
    const svg = await readFile(filePath, "utf8");
    const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
    flagCache.set(key, dataUri);
    return dataUri;
  } catch {
    flagCache.set(key, null);
    return null;
  }
}
