// Same tokens as lib/svg-card/theme.ts (the individual player card) so a
// repo's squad card and its contributors' profile cards read as the same
// visual system. Single dark theme, no floodlight/grass toggle — same
// choice the profile SVG card already makes.
export { SVG_COLORS, FONT_SANS, FONT_DISPLAY } from "../svg-card/theme.ts";

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 1500;
export const CARD_PAD = 56;

// Mirrors the OG PNG portrait's pitch box sizing (app/api/og/squad/.../route.tsx)
// so the SVG and PNG portrait exports read as the same layout.
export const PITCH_W = 760;
export const PITCH_H = 1174;
export const PITCH_W_SMALL = 1000;
export const PITCH_H_SMALL = 750;
export const PITCH_CHIP_W = 140;
export const HEADER_H = 160;
export const FOOTER_H = 50;
