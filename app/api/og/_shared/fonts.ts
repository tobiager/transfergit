// Satori can't load Google Fonts via @import/CSS: it needs the raw font
// buffer. The .ttf files live in /assets/fonts.
//
// Important: each `new URL(literal, import.meta.url)` must use a LITERAL
// string (not a variable) so webpack detects it at build time and bundles
// it as a servable asset. If the path comes from a parameter, it becomes a
// fetch to a file:// URL at runtime, which the edge runtime doesn't support
// ("not implemented... yet..."). That's why there's no generic
// loadFont(path) helper here: each fetch is inline with its literal.
export interface OgFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 500 | 600 | 700;
  style: "normal";
}

export async function loadOgFonts(): Promise<OgFont[]> {
  const [archivoRegular, archivoSemiBold, archivoBold, archivoBlack, barlowCondensedSemiBold] =
    await Promise.all([
      fetch(new URL("../../../../assets/fonts/Archivo-Regular.ttf", import.meta.url)).then((r) =>
        r.arrayBuffer()
      ),
      fetch(new URL("../../../../assets/fonts/Archivo-SemiBold.ttf", import.meta.url)).then((r) =>
        r.arrayBuffer()
      ),
      fetch(new URL("../../../../assets/fonts/Archivo-Bold.ttf", import.meta.url)).then((r) =>
        r.arrayBuffer()
      ),
      fetch(new URL("../../../../assets/fonts/ArchivoBlack-Regular.ttf", import.meta.url)).then((r) =>
        r.arrayBuffer()
      ),
      fetch(new URL("../../../../assets/fonts/BarlowCondensed-SemiBold.ttf", import.meta.url)).then(
        (r) => r.arrayBuffer()
      ),
    ]);

  return [
    { name: "Archivo", data: archivoRegular, weight: 400, style: "normal" },
    { name: "Archivo", data: archivoSemiBold, weight: 600, style: "normal" },
    { name: "Archivo", data: archivoBold, weight: 700, style: "normal" },
    { name: "Archivo Black", data: archivoBlack, weight: 400, style: "normal" },
    { name: "Barlow Condensed", data: barlowCondensedSemiBold, weight: 600, style: "normal" },
  ];
}
