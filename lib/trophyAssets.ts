import "server-only";
import fs from "node:fs";
import path from "node:path";

const TROPHIES_DIR = path.join(process.cwd(), "public", "trophies");

// Prefers a real /public/trophies/{id}.png artwork when one exists, falling
// back to the bundled {id}.svg icon set. Resolved server-side (not via
// <img onError>) so the client never renders a broken-image icon while a
// 404 round-trips.
export function resolveTrophyIconSrc(id: string): string {
  if (fs.existsSync(path.join(TROPHIES_DIR, `${id}.png`))) {
    return `/trophies/${id}.png`;
  }
  return `/trophies/${id}.svg`;
}
