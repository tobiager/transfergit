import { OG_COLORS } from "./theme";

export type SquadThemeName = "floodlight" | "grass";

export interface SquadTheme {
  background: string;
  backgroundImage: string;
  pitchBg: string;
  pitchBorder: string;
  pitchLine: string;
  chipBg: string;
  chipBorder: string;
  foreground: string;
  muted: string;
  accent: string;
  gold: string;
}

// Mow-stripe effect: a single linear-gradient with repeated hard color
// stops reads as alternating bands — more reliable in Satori than a CSS
// `repeating-linear-gradient`, which it doesn't consistently support.
function mowStripes(colorA: string, colorB: string, stripes: number, angleDeg: number): string {
  const step = 100 / stripes;
  const stops: string[] = [];
  for (let i = 0; i < stripes; i++) {
    const color = i % 2 === 0 ? colorA : colorB;
    stops.push(`${color} ${(i * step).toFixed(2)}%`, `${color} ${((i + 1) * step).toFixed(2)}%`);
  }
  return `linear-gradient(${angleDeg}deg, ${stops.join(", ")})`;
}

export const SQUAD_THEMES: Record<SquadThemeName, SquadTheme> = {
  floodlight: {
    background: OG_COLORS.pitch,
    backgroundImage: "radial-gradient(circle at 50% -10%, rgba(0,230,118,0.10), transparent 55%)",
    pitchBg: OG_COLORS.pitchElevated,
    pitchBorder: "rgba(255,255,255,0.10)",
    pitchLine: "rgba(255,255,255,0.16)",
    chipBg: "rgba(255,255,255,0.05)",
    chipBorder: "rgba(255,255,255,0.10)",
    foreground: OG_COLORS.foreground,
    muted: OG_COLORS.muted,
    accent: OG_COLORS.green,
    gold: OG_COLORS.gold,
  },
  grass: {
    background: "#0d3a1c",
    backgroundImage: mowStripes("#1f6b34", "#195c2b", 14, 180),
    pitchBg: "#1a5e2f",
    pitchBorder: "rgba(255,255,255,0.35)",
    pitchLine: "rgba(255,255,255,0.85)",
    chipBg: "rgba(6,20,10,0.55)",
    chipBorder: "rgba(255,255,255,0.25)",
    foreground: "#ffffff",
    muted: "rgba(255,255,255,0.7)",
    accent: "#ffd400",
    gold: "#ffd400",
  },
};
