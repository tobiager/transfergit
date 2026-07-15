import { buildChartGeometry, buildSparklinePaths } from "@/app/api/og/_shared/sparkline";
import { formatCardName } from "@/app/api/og/_shared/cardContent";
import { getLanguageIcon } from "@/app/api/og/_shared/languageIcon";
import { evaluateAchievements, topTrophies } from "@/lib/achievements";
import { computeMarketValueTrend, formatCompactNumber, formatCompactValue, formatNumber } from "@/lib/format";
import { abbreviatePosition } from "@/lib/positions";
import { percentileTier } from "@/lib/ranking";
import type { ReadmeCardData } from "./types";
import { CARD_CONTENT_WIDTH, CARD_HEIGHT, CARD_INSET, CARD_WIDTH, FONT_DISPLAY, FONT_SANS, SVG_COLORS as C } from "./theme";

// GitHub's camo proxy serves this SVG raw inside an <img> tag — CSS
// animations run there (same trick github-readme-stats uses), but any
// dynamic text must be escaped since it's interpolated straight into markup.
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

let sectionIndex = 0;
function nextReveal(): string {
  const delay = (sectionIndex * 90).toString();
  sectionIndex += 1;
  return delay;
}

// No canvas/DOM text metrics are available server-side for a plain-string
// SVG, so icon placement after variable-width text uses the same rough
// per-character estimate the trophy pills already rely on (label.length *
// factor) rather than pulling in a font-metrics dependency.
function estimateTextWidth(text: string, fontSize: number, factor = 0.52): number {
  return text.length * fontSize * factor;
}

export function renderReadmeCardSvg(data: ReadmeCardData): string {
  sectionIndex = 0;
  const { player, siteHost, avatarDataUri, flagDataUri, animate } = data;

  const currentSeason = player.seasons[0];
  const tier = percentileTier({
    stars: player.trophies.stars,
    commits: currentSeason?.commits ?? 0,
    followers: player.trophies.followers,
  });
  const trend = computeMarketValueTrend(player.marketValueHistory);
  const displayName = formatCardName(player.name, player.login);
  const sparkline = buildSparklinePaths(player.marketValueHistory, 260, 60);

  const chartWidth = CARD_CONTENT_WIDTH;
  const chartHeight = 260;
  const chart = buildChartGeometry(player.marketValueHistory, chartWidth, chartHeight, 8);
  const values = player.marketValueHistory.map((p) => p.value);
  const minValue = values.length ? Math.min(...values) : 0;
  const maxValue = values.length ? Math.max(...values) : 0;
  const firstYear = player.marketValueHistory[0]?.year ?? "";
  const lastYear = player.marketValueHistory[player.marketValueHistory.length - 1]?.year ?? "";

  const top5 = topTrophies(evaluateAchievements(player), 5);
  const recentSeasons = player.seasons.slice(0, 6);
  const totals = player.seasons.reduce(
    (acc, s) => ({
      commits: acc.commits + s.commits,
      pullRequests: acc.pullRequests + s.pullRequests,
      totalContributions: acc.totalContributions + s.totalContributions,
    }),
    { commits: 0, pullRequests: 0, totalContributions: 0 }
  );

  let y = CARD_INSET;
  const x = CARD_INSET;

  // --- Header -------------------------------------------------------------
  const headerDelay = nextReveal();
  const headerTop = y;
  const avatarSize = 84;
  const avatarCx = x + avatarSize / 2;
  const avatarCy = headerTop + avatarSize / 2;
  const initial = esc(displayName.replace(/^@/, "")[0]?.toUpperCase() ?? "?");
  const avatarDefs = avatarDataUri
    ? `<clipPath id="avatarClip"><circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarSize / 2}" /></clipPath>`
    : "";
  const avatarMarkup = avatarDataUri
    ? `<image href="${avatarDataUri}" x="${x}" y="${headerTop}" width="${avatarSize}" height="${avatarSize}"
        clip-path="url(#avatarClip)" preserveAspectRatio="xMidYMid slice" />
      <circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarSize / 2}" fill="none" stroke="${C.border}" stroke-width="2" />`
    : `<circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarSize / 2}" fill="${C.pitch}" stroke="${C.border}" stroke-width="2" />
      <text x="${avatarCx}" y="${avatarCy + 14}" text-anchor="middle"
        font-family="${FONT_DISPLAY}" font-size="36" fill="${C.foreground}">${initial}</text>`;
  // Subtitle row: flag badge, position/club text, language badge, provider
  // text — laid out left to right like the PNG's flex row. There's no text
  // metrics API for a plain-string SVG, so icon x-offsets after variable
  // width text use estimateTextWidth's rough per-character estimate.
  const subtitleY = headerTop + 68;
  const subtitleFontSize = 18;
  const iconY = (size: number) => subtitleY - 6 - size / 2;
  let cursorX = x + avatarSize + 20;

  const flagSize = 20;
  const flagMarkup = flagDataUri
    ? `<image href="${flagDataUri}" x="${cursorX}" y="${iconY(flagSize)}" width="${flagSize}" height="${flagSize}" />`
    : "";
  if (flagDataUri) cursorX += flagSize + 8;

  const subtitleText = `${player.position.main} (${abbreviatePosition(player.position.main)}) · ${player.currentClub}`;
  const subtitleTextX = cursorX;
  cursorX += estimateTextWidth(subtitleText, subtitleFontSize) + 16;

  const langIcon = getLanguageIcon(player.provider);
  const langSize = 22;
  const langMarkup = langIcon
    ? `<rect x="${cursorX}" y="${iconY(langSize)}" width="${langSize}" height="${langSize}" rx="${langSize * 0.28}"
        fill="${langIcon.color}26" stroke="${langIcon.color}" stroke-width="2" />
      <g transform="translate(${cursorX + langSize * 0.25}, ${iconY(langSize) + langSize * 0.25}) scale(${
        (langSize * 0.5) / 24
      })">
        <path d="${langIcon.path}" fill="${langIcon.color}" />
      </g>`
    : "";
  if (langIcon) cursorX += langSize + 8;
  const providerTextX = cursorX;

  const header = `
    <g class="reveal" style="animation-delay:${headerDelay}ms">
      ${avatarMarkup}
      <text x="${x + avatarSize + 20}" y="${headerTop + 38}" font-family="${FONT_DISPLAY}" font-size="40"
        fill="${C.foreground}" letter-spacing="1">${esc(displayName.toUpperCase())}</text>
      ${flagMarkup}
      <text x="${subtitleTextX}" y="${subtitleY}" font-family="${FONT_SANS}" font-size="${subtitleFontSize}" fill="${C.muted}">${esc(subtitleText)}</text>
      ${langMarkup}
      <text x="${providerTextX}" y="${subtitleY}" font-family="${FONT_SANS}" font-size="${subtitleFontSize}" fill="${C.muted}">${esc(player.provider)}</text>
      <rect x="${CARD_WIDTH - CARD_INSET - 150}" y="${headerTop + 30}" width="150" height="40" rx="20"
        fill="none" stroke="${C.green}" stroke-width="2" />
      <text x="${CARD_WIDTH - CARD_INSET - 75}" y="${headerTop + 56}" text-anchor="middle"
        font-family="${FONT_DISPLAY}" font-size="20" fill="${C.green}">${tier}</text>
    </g>`;
  y += avatarSize + 34;

  // --- Market value box -----------------------------------------------------
  const mvDelay = nextReveal();
  const mvBoxHeight = 96;
  // Sits right after the value text, not at a fixed offset — otherwise it
  // drifts away from short values and collides with long ones. Factor is
  // higher than the default estimate: this is a bold/"Black" display face,
  // which runs wider per character than the regular sans used elsewhere.
  const valueWidth = estimateTextWidth(player.marketValueFormatted, 44, 0.66);
  const trendX = x + 24 + valueWidth + 24;
  const trendMarkup =
    trend && trend.direction !== "flat"
      ? `<path d="${
          trend.direction === "up" ? "M6 1.5 L11 9.5 L1 9.5 Z" : "M6 10.5 L1 2.5 L11 2.5 Z"
        }" fill="${trend.direction === "up" ? C.green : C.red}"
          transform="translate(${trendX}, ${y + 46}) scale(1.8)" />
        <text x="${trendX + 28}" y="${y + 60}" font-family="${FONT_SANS}" font-size="20"
          fill="${trend.direction === "up" ? C.green : C.red}">${Math.abs(trend.pct).toFixed(1)}%</text>`
      : "";
  const marketValueBox = `
    <g class="reveal" style="animation-delay:${mvDelay}ms">
      <rect x="${x}" y="${y}" width="${CARD_CONTENT_WIDTH}" height="${mvBoxHeight}" rx="16"
        fill="rgba(0,230,118,0.05)" stroke="rgba(0,230,118,0.3)" stroke-width="1" />
      <text x="${x + 24}" y="${y + 30}" font-family="${FONT_SANS}" font-size="15" fill="${C.muted}"
        letter-spacing="2">MARKET VALUE</text>
      <text x="${x + 24}" y="${y + 68}" font-family="${FONT_DISPLAY}" font-size="44" fill="${C.green}">
        ${esc(player.marketValueFormatted)}</text>
      ${trendMarkup}
      <g transform="translate(${x + CARD_CONTENT_WIDTH - 280}, ${y + 18})">
        <path d="${sparkline.area}" fill="rgba(0,230,118,0.18)" />
        <path class="draw-line" d="${sparkline.line}" pathLength="1" stroke="${C.green}" stroke-width="3" fill="none" />
      </g>
    </g>`;
  y += mvBoxHeight + 34;

  // --- Trophy cabinet ---------------------------------------------------
  const trophyDelay = nextReveal();
  let trophyX = x;
  const trophyY = y;
  const trophyPills =
    top5.length === 0
      ? `<text x="${x}" y="${trophyY + 48}" font-family="${FONT_SANS}" font-size="16" fill="${C.muted}">No honours yet</text>`
      : top5
          .map((r) => {
            const label = esc(r.achievement.name);
            const pillWidth = label.length * 8.5 + 28;
            const pill = `
        <g>
          <rect x="${trophyX}" y="${trophyY + 16}" width="${pillWidth}" height="32" rx="8"
            fill="rgba(255,196,0,0.06)" stroke="rgba(255,196,0,0.35)" stroke-width="1" />
          <text x="${trophyX + pillWidth / 2}" y="${trophyY + 37}" text-anchor="middle"
            font-family="${FONT_SANS}" font-size="14" fill="${C.gold}">${label}</text>
        </g>`;
            trophyX += pillWidth + 12;
            return pill;
          })
          .join("");
  const trophySection = `
    <g class="reveal" style="animation-delay:${trophyDelay}ms">
      <text x="${x}" y="${trophyY}" font-family="${FONT_SANS}" font-size="18" fill="${C.muted}"
        letter-spacing="3">TROPHY CABINET</text>
      ${trophyPills}
    </g>`;
  y += 16 + 48 + 34;

  // --- Market value evolution chart ---------------------------------------
  const chartDelay = nextReveal();
  const chartY = y;
  const chartSection =
    chart.line.length > 0
      ? `
    <g class="reveal" style="animation-delay:${chartDelay}ms">
      <text x="${x}" y="${chartY}" font-family="${FONT_SANS}" font-size="18" fill="${C.muted}"
        letter-spacing="3">MARKET VALUE EVOLUTION</text>
      <g transform="translate(${x}, ${chartY + 24})">
        <path d="${chart.area}" fill="rgba(0,230,118,0.15)" />
        <path class="draw-line" d="${chart.line}" pathLength="1" stroke="${C.green}" stroke-width="3" fill="none" />
      </g>
      <text x="${x}" y="${chartY + 24 + chartHeight + 22}" font-family="${FONT_SANS}" font-size="14" fill="${C.muted}">
        ${firstYear} · ${formatCompactValue(minValue)}</text>
      <text x="${x + CARD_CONTENT_WIDTH}" y="${chartY + 24 + chartHeight + 22}" text-anchor="end"
        font-family="${FONT_SANS}" font-size="14" fill="${C.muted}">${lastYear} · ${formatCompactValue(maxValue)}</text>
    </g>`
      : "";
  y += chart.line.length > 0 ? 24 + chartHeight + 22 + 34 : 0;

  // --- Scouting metrics (rating bars) --------------------------------------
  const ratingsDelay = nextReveal();
  const colWidth = CARD_CONTENT_WIDTH / 2 - 20;
  const rowHeight = 58;
  const rows = Math.ceil(player.ratings.length / 2);
  const ratingBars = player.ratings
    .map((rating, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const barX = x + col * (colWidth + 40);
      const barY = y + 34 + row * rowHeight;
      const pct = Math.min(99, rating.score) / 100;
      // Baked into the width attribute (not a CSS transform) so the bar
      // reads correctly even when ?animate=false drops the <style> block.
      const filledWidth = colWidth * pct;
      return `
      <g>
        <text x="${barX}" y="${barY - 10}" font-family="${FONT_SANS}" font-size="16" fill="${C.foreground}">${esc(
        rating.label
      )}</text>
        <text x="${barX + colWidth}" y="${barY - 10}" text-anchor="end" font-family="${FONT_DISPLAY}" font-size="18"
          fill="${C.green}">${rating.score}</text>
        <rect x="${barX}" y="${barY}" width="${colWidth}" height="8" rx="4" fill="rgba(255,255,255,0.08)" />
        <rect class="bar-fill" x="${barX}" y="${barY}" width="${filledWidth}" height="8" rx="4" fill="${C.green}"
          style="animation-delay:${ratingsDelay}ms" />
      </g>`;
    })
    .join("");
  const ratingsSection = `
    <g class="reveal" style="animation-delay:${ratingsDelay}ms">
      <text x="${x}" y="${y}" font-family="${FONT_SANS}" font-size="18" fill="${C.muted}"
        letter-spacing="3">SCOUTING METRICS</text>
      ${ratingBars}
    </g>`;
  y += 34 + rows * rowHeight + 20;

  // --- Season stats table ---------------------------------------------------
  const seasonsDelay = nextReveal();
  const seasonHeaderY = y;
  const colXs = [x, x + CARD_CONTENT_WIDTH * 0.44, x + CARD_CONTENT_WIDTH * 0.68, x + CARD_CONTENT_WIDTH * 0.94];
  const seasonHeader = `
    <text x="${colXs[0]}" y="${seasonHeaderY}" font-family="${FONT_SANS}" font-size="13" fill="${C.muted}">SEASON</text>
    <text x="${colXs[1]}" y="${seasonHeaderY}" text-anchor="end" font-family="${FONT_SANS}" font-size="13" fill="${C.muted}">COMMITS</text>
    <text x="${colXs[2]}" y="${seasonHeaderY}" text-anchor="end" font-family="${FONT_SANS}" font-size="13" fill="${C.muted}">PRS</text>
    <text x="${colXs[3]}" y="${seasonHeaderY}" text-anchor="end" font-family="${FONT_SANS}" font-size="13" fill="${C.muted}">CONTRIBUTIONS</text>`;
  const seasonRowHeight = 42;
  let seasonY = seasonHeaderY + 26;
  const seasonRows = recentSeasons
    .map((s) => {
      const rowY = seasonY;
      seasonY += seasonRowHeight;
      return `
      <line x1="${x}" y1="${rowY - 24}" x2="${x + CARD_CONTENT_WIDTH}" y2="${rowY - 24}" stroke="${C.border}" />
      <text x="${colXs[0]}" y="${rowY}" font-family="${FONT_SANS}" font-size="15" fill="${C.foreground}">${s.year}</text>
      <text x="${colXs[1]}" y="${rowY}" text-anchor="end" font-family="${FONT_SANS}" font-size="15" fill="${C.green}">${formatNumber(
        s.commits
      )}</text>
      <text x="${colXs[2]}" y="${rowY}" text-anchor="end" font-family="${FONT_SANS}" font-size="15" fill="${C.foreground}">${formatNumber(
        s.pullRequests
      )}</text>
      <text x="${colXs[3]}" y="${rowY}" text-anchor="end" font-family="${FONT_SANS}" font-size="15" fill="${C.foreground}">${formatNumber(
        s.totalContributions
      )}</text>`;
    })
    .join("");
  const totalRowY = seasonY;
  const totalRow = `
    <line x1="${x}" y1="${totalRowY - 24}" x2="${x + CARD_CONTENT_WIDTH}" y2="${totalRowY - 24}" stroke="${C.border}" />
    <text x="${colXs[0]}" y="${totalRowY}" font-family="${FONT_DISPLAY}" font-size="15" fill="${C.foreground}">Total</text>
    <text x="${colXs[1]}" y="${totalRowY}" text-anchor="end" font-family="${FONT_DISPLAY}" font-size="15" fill="${C.green}">${formatNumber(
    totals.commits
  )}</text>
    <text x="${colXs[2]}" y="${totalRowY}" text-anchor="end" font-family="${FONT_DISPLAY}" font-size="15" fill="${C.foreground}">${formatNumber(
    totals.pullRequests
  )}</text>
    <text x="${colXs[3]}" y="${totalRowY}" text-anchor="end" font-family="${FONT_DISPLAY}" font-size="15" fill="${C.foreground}">${formatNumber(
    totals.totalContributions
  )}</text>`;
  const seasonsSection = `
    <g class="reveal" style="animation-delay:${seasonsDelay}ms">
      <text x="${x}" y="${y - 16}" font-family="${FONT_SANS}" font-size="18" fill="${C.muted}"
        letter-spacing="3">SEASON STATS</text>
      ${seasonHeader}
      ${seasonRows}
      ${totalRow}
    </g>`;
  y = totalRowY + 30;

  // --- Footer -----------------------------------------------------------
  // Anchored to the bottom edge (like the PNG's flex:1 spacer + footer),
  // not stacked right after the season stats — the gap this leaves above
  // the footer is where the "breathing room" from the PNG layout lives.
  const footerDelay = nextReveal();
  const contentEndY = y;
  const FOOTER_BLOCK_HEIGHT = 40; // border line + text clearance
  const height = Math.max(CARD_HEIGHT, contentEndY + FOOTER_BLOCK_HEIGHT + CARD_INSET);
  const footerY = height - CARD_INSET;
  const footer = `
    <g class="reveal" style="animation-delay:${footerDelay}ms">
      <line x1="${x}" y1="${footerY - 20}" x2="${x + CARD_CONTENT_WIDTH}" y2="${footerY - 20}" stroke="${C.border}" />
      <text x="${x}" y="${footerY}" font-family="${FONT_SANS}" font-size="16" fill="${C.muted}">${esc(
    siteHost
  )}/${esc(player.login)}</text>
      <text x="${x + CARD_CONTENT_WIDTH}" y="${footerY}" text-anchor="end" font-family="${FONT_SANS}" font-size="16"
        fill="${C.muted}">${formatCompactNumber(player.trophies.followers)} followers</text>
    </g>`;

  const styleBlock = animate
    ? `<style>
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes growLine {
      from { stroke-dashoffset: 1; }
      to { stroke-dashoffset: 0; }
    }
    @keyframes growBar {
      from { transform: scaleX(0); }
      to { transform: scaleX(1); }
    }
    .reveal { opacity: 0; animation: fadeInUp 0.5s ease-out forwards; }
    .bar-fill { transform-box: fill-box; transform-origin: 0% 50%; animation: growBar 0.9s ease-out both; }
    .draw-line { stroke-dasharray: 1; stroke-dashoffset: 1; animation: growLine 1.1s ease-out forwards; animation-delay: 0.3s; }
    @media (prefers-reduced-motion: reduce) {
      .reveal { opacity: 1; animation: none; transform: none; }
      .draw-line { stroke-dashoffset: 0; animation: none; }
      .bar-fill { animation: none; transform: none; }
    }
  </style>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${height}" viewBox="0 0 ${CARD_WIDTH} ${height}">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="-10%" r="65%">
      <stop offset="0%" stop-color="rgba(0,230,118,0.10)" />
      <stop offset="100%" stop-color="rgba(0,230,118,0)" />
    </radialGradient>
    ${avatarDefs}
  </defs>
  ${styleBlock}
  <rect x="0" y="0" width="${CARD_WIDTH}" height="${height}" fill="${C.pitch}" />
  <rect x="0" y="0" width="${CARD_WIDTH}" height="${height}" fill="url(#bgGlow)" />
  <rect x="1.5" y="1.5" width="${CARD_WIDTH - 3}" height="${height - 3}" fill="none"
    stroke="rgba(0,230,118,0.45)" stroke-width="3" />
  ${header}
  ${marketValueBox}
  ${trophySection}
  ${chartSection}
  ${ratingsSection}
  ${seasonsSection}
  ${footer}
</svg>`;
}

// Same dark/green theme as the main card, sized down — used when the
// username doesn't resolve to a GitHub profile. Served with status 200 so a
// README <img> never shows a broken-image icon.
export function renderErrorCardSvg(message: string): string {
  const height = 220;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${height}" viewBox="0 0 ${CARD_WIDTH} ${height}">
  <rect x="0" y="0" width="${CARD_WIDTH}" height="${height}" fill="${C.pitch}" />
  <rect x="1.5" y="1.5" width="${CARD_WIDTH - 3}" height="${height - 3}" fill="none"
    stroke="rgba(0,230,118,0.45)" stroke-width="3" />
  <text x="${CARD_WIDTH / 2}" y="${height / 2 + 12}" text-anchor="middle"
    font-family="${FONT_DISPLAY}" font-size="32" fill="${C.foreground}">${esc(message)}</text>
</svg>`;
}
