import { readFile } from "node:fs/promises";
import { join } from "node:path";

// These routes run on the Node.js runtime (Edge's 1 MB Vercel function limit
// is too small once 5 font files are bundled). Node reads the .ttf files
// straight off disk instead of the Edge-only `fetch(new URL(...))` trick.
export interface OgFont {
  name: string;
  data: Buffer;
  weight: 400 | 500 | 600 | 700;
  style: "normal";
}

export async function loadOgFonts(): Promise<OgFont[]> {
  const fontsDir = join(process.cwd(), "assets", "fonts");
  const [archivoRegular, archivoSemiBold, archivoBold, archivoBlack, barlowCondensedSemiBold] =
    await Promise.all([
      readFile(join(fontsDir, "Archivo-Regular.ttf")),
      readFile(join(fontsDir, "Archivo-SemiBold.ttf")),
      readFile(join(fontsDir, "Archivo-Bold.ttf")),
      readFile(join(fontsDir, "ArchivoBlack-Regular.ttf")),
      readFile(join(fontsDir, "BarlowCondensed-SemiBold.ttf")),
    ]);

  return [
    { name: "Archivo", data: archivoRegular, weight: 400, style: "normal" },
    { name: "Archivo", data: archivoSemiBold, weight: 600, style: "normal" },
    { name: "Archivo", data: archivoBold, weight: 700, style: "normal" },
    { name: "Archivo Black", data: archivoBlack, weight: 400, style: "normal" },
    { name: "Barlow Condensed", data: barlowCondensedSemiBold, weight: 600, style: "normal" },
  ];
}
