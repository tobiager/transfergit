// Fits a username into a fixed pixel width without ever wrapping or
// trailing-truncating mid-word: first shrink the (monospace) font size down
// to MIN_FONT_PX, and only if it still doesn't fit at the floor, fall back
// to a middle-ellipsis ("365dias…prog") that keeps both ends of the name
// readable. Pure math, no DOM/canvas measurement — safe to call during SSR
// and to unit test directly, since the font is monospace (a fixed
// fraction of font-size per character, unlike a proportional font where
// width genuinely depends on which characters are in the string).
const MONO_CHAR_WIDTH_FACTOR = 0.6;

export const USERNAME_MAX_FONT_PX = 12;
export const USERNAME_MIN_FONT_PX = 10;

export interface FitUsernameResult {
  text: string;
  fontSizePx: number;
}

function widthAt(charCount: number, fontSizePx: number): number {
  return charCount * fontSizePx * MONO_CHAR_WIDTH_FACTOR;
}

function middleEllipsis(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  if (maxChars < 3) return text.slice(0, Math.max(1, maxChars));
  const keep = maxChars - 1; // reserve one character for the ellipsis glyph
  const head = Math.ceil(keep / 2);
  const tail = Math.floor(keep / 2);
  return `${text.slice(0, head)}…${text.slice(text.length - tail)}`;
}

export function fitUsername(
  username: string,
  maxWidthPx: number,
  maxFontSizePx: number = USERNAME_MAX_FONT_PX,
  minFontSizePx: number = USERNAME_MIN_FONT_PX
): FitUsernameResult {
  if (widthAt(username.length, maxFontSizePx) <= maxWidthPx) {
    return { text: username, fontSizePx: maxFontSizePx };
  }

  const neededFontSize = maxWidthPx / (username.length * MONO_CHAR_WIDTH_FACTOR);
  if (neededFontSize >= minFontSizePx) {
    return { text: username, fontSizePx: Math.floor(neededFontSize) };
  }

  const maxChars = Math.max(3, Math.floor(maxWidthPx / (minFontSizePx * MONO_CHAR_WIDTH_FACTOR)));
  return { text: middleEllipsis(username, maxChars), fontSizePx: minFontSizePx };
}
