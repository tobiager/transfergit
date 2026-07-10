// Precomputed pixel heights for the full OG card's sections, so the canvas
// height passed to ImageResponse matches the actual content instead of a
// fixed guess (Satori/ImageResponse can't auto-size to content — the
// width/height must be known upfront).
const PADDING_Y = 56 * 2;
const HEADER_HEIGHT = 120;
const TROPHY_SECTION_HEIGHT = 32 + 24 + 38 + 6 + 30;
const CHART_SECTION_HEIGHT = 32 + 24 + 10 + 260 + 40;
const SCOUTING_ROW_HEIGHT = 52;
const SCOUTING_SECTION_BASE = 32 + 24 + 10;
const SEASON_HEADER_HEIGHT = 44;
const SEASON_ROW_HEIGHT = 34;
const SEASON_TOTAL_ROW_HEIGHT = 36;
const SEASON_SECTION_BASE = 32 + 24 + 10;
const FOOTER_HEIGHT = 32 + 28 + 24;
// Safety margin for font metric/line-height variance across renderers.
const SAFETY_BUFFER = 24;

export function computeFullCardHeight({
  trophyCount,
  ratingsCount,
  seasonsShown,
}: {
  trophyCount: number;
  ratingsCount: number;
  seasonsShown: number;
}): number {
  const trophyHeight = trophyCount >= 3 ? TROPHY_SECTION_HEIGHT : 0;
  const scoutingRows = Math.ceil(ratingsCount / 2);
  const scoutingHeight = SCOUTING_SECTION_BASE + scoutingRows * SCOUTING_ROW_HEIGHT;
  const seasonHeight =
    SEASON_SECTION_BASE + SEASON_HEADER_HEIGHT + seasonsShown * SEASON_ROW_HEIGHT + SEASON_TOTAL_ROW_HEIGHT;

  return (
    PADDING_Y +
    HEADER_HEIGHT +
    trophyHeight +
    CHART_SECTION_HEIGHT +
    scoutingHeight +
    seasonHeight +
    FOOTER_HEIGHT +
    SAFETY_BUFFER
  );
}
