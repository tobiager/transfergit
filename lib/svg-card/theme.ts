// Same tokens and layout constants as the "README · Full" PNG card
// (app/api/og/[username]/readme/route.tsx + app/api/og/_shared/theme.ts),
// copied here so the SVG card stays visually identical without importing
// across the og/ route tree.
export const SVG_COLORS = {
  pitch: "#060a12",
  border: "rgba(255,255,255,0.08)",
  foreground: "#e7ecf5",
  muted: "#8a94a6",
  green: "#00e676",
  gold: "#ffc400",
  red: "#e5484d",
} as const;

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 1500;
export const CARD_PAD = 56;
// The PNG card's outer <div> has both a 3px border and 56px padding, and
// Satori/Yoga (like the rest of this codebase's flex layouts) sizes with
// border-box: the padding is measured from the border's inner edge, not
// from the card's outer edge. So content actually starts CARD_PAD + 3px in,
// not just CARD_PAD — CARD_INSET is that real margin from the outer edge.
export const CARD_BORDER = 3;
export const CARD_INSET = CARD_PAD + CARD_BORDER;
export const CARD_CONTENT_WIDTH = CARD_WIDTH - CARD_INSET * 2;

// GitHub's camo proxy re-serves the SVG but never fetches anything the SVG
// itself references (fonts, images), so only generic system font stacks are
// safe here — no @font-face url()/external <image>.
export const FONT_SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
export const FONT_DISPLAY = "'Segoe UI Black', -apple-system, BlinkMacSystemFont, system-ui, sans-serif";
