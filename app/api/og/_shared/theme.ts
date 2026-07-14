// Same tokens as app/globals.css' dark set, hardcoded: Satori doesn't read
// custom properties from an external stylesheet. OG cards are always dark,
// regardless of the viewer's theme.
export const OG_COLORS = {
  pitch: "#060a12",
  pitchElevated: "#0d1420",
  surface: "#0b111c",
  surfaceElevated: "#111a28",
  border: "rgba(255,255,255,0.08)",
  foreground: "#e7ecf5",
  muted: "#8a94a6",
  navy: "#1a3151",
  blueBright: "#4d9fff",
  green: "#00e676",
  gold: "#ffc400",
  red: "#e5484d",
} as const;
