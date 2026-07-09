// Satori no puede levantar Google Fonts por @import/CSS: necesita el buffer
// crudo de la fuente. Los .ttf viven en /assets/fonts.
//
// Importante: cada `new URL(literal, import.meta.url)` tiene que llevar un
// string LITERAL (no una variable) para que webpack lo detecte en build time
// y lo empaquete como asset servible. Si el path viene de un parámetro,
// queda como un fetch a una URL file:// en runtime, que el edge runtime no
// soporta ("not implemented... yet..."). Por eso no hay un helper genérico
// loadFont(path) acá: cada fetch está inline con su literal.
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
