// ▲/▼ glyphs are missing from the bundled Archivo/Barlow Condensed font
// files, so Satori renders tofu boxes for them — draw the arrow as an SVG
// path instead (same shape as components/TrendArrow.tsx).
export function OgTrendArrow({ direction, size, color }: { direction: "up" | "down"; size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12">
      <path d={direction === "up" ? "M6 1.5 L11 9.5 L1 9.5 Z" : "M6 10.5 L1 2.5 L11 2.5 Z"} fill={color} />
    </svg>
  );
}
