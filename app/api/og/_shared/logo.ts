import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Satori has no DOM/base URL to resolve a relative <img src>, and there's no reason to
// round-trip the site's own logo through a network fetch — read it straight
// off disk and inline it as a data URI, same idea as loadOgFonts().
export async function loadOgLogoDataUri(): Promise<string> {
  const buffer = await readFile(join(process.cwd(), "public", "transfergit", "tg.png"));
  return `data:image/png;base64,${buffer.toString("base64")}`;
}
