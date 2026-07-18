import { isSmallSided, chipScale, formationLabel } from "../squad/formations.ts";
import { pluralize } from "../format.ts";
import { pitchPosition } from "../squad/pitchLayout.ts";
import {
  SVG_COLORS as C,
  FONT_SANS,
  FONT_DISPLAY,
  CARD_WIDTH,
  CARD_HEIGHT,
  CARD_PAD,
  PITCH_W,
  PITCH_H,
  PITCH_W_SMALL,
  PITCH_H_SMALL,
  PITCH_CHIP_W,
  HEADER_H,
  FOOTER_H,
} from "./theme.ts";
import type { SquadCardData } from "./types.ts";

// GitHub's camo proxy serves this SVG raw inside an <img> tag — CSS
// animations run there, but any dynamic text must be escaped since it's
// interpolated straight into markup.
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// Satori's text layout isn't in play for a plain-string SVG either way, but
// a long unbroken GitHub username (no spaces) can still render wider than
// its chip — truncate server-side instead of trusting CSS.
function truncateName(name: string, max: number): string {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

export function renderSquadCardSvg(data: SquadCardData): string {
  const { squad, siteHost, avatarDataUris, animate, logoDataUri } = data;
  const playerCount = squad.starters.length + squad.bench.length;
  const small = isSmallSided(squad.starters.length);
  const scale = chipScale(squad.starters.length);
  const pitchW = small ? PITCH_W_SMALL : PITCH_W;
  const pitchH = small ? PITCH_H_SMALL : PITCH_H;
  const pitchX = (CARD_WIDTH - pitchW) / 2;
  const availableH = CARD_HEIGHT - HEADER_H - FOOTER_H;
  const pitchY = HEADER_H + Math.max(0, (availableH - pitchH) / 2);

  let revealIndex = 0;
  function nextDelay(): number {
    const delay = revealIndex * 70;
    revealIndex += 1;
    return delay;
  }

  // --- Header ---------------------------------------------------------
  // Same shape/order as the PNG exports' CardHeader: logo + "REPO SQUAD ·
  // formation" + owner/repo on the left, value + player count on the right.
  const LOGO_SIZE = 52;
  const logoY = CARD_PAD - 6;
  const textX = CARD_PAD + LOGO_SIZE + 20;
  const headerDelay = nextDelay();
  const header = `
    <g class="reveal" style="animation-delay:${headerDelay}ms">
      <clipPath id="logoClip"><rect x="${CARD_PAD}" y="${logoY}" width="${LOGO_SIZE}" height="${LOGO_SIZE}" rx="12" /></clipPath>
      <image href="${logoDataUri}" x="${CARD_PAD}" y="${logoY}" width="${LOGO_SIZE}" height="${LOGO_SIZE}" clip-path="url(#logoClip)" />
      <text x="${textX}" y="${logoY + 22}" font-family="${FONT_SANS}" font-size="16" fill="${C.muted}"
        letter-spacing="3">REPO SQUAD</text>
      <text x="${textX + 128}" y="${logoY + 22}" font-family="${FONT_DISPLAY}" font-size="18"
        fill="${C.green}">${esc(formationLabel(squad.formation))}</text>
      <text x="${textX}" y="${logoY + 62}" font-family="${FONT_DISPLAY}" font-size="38" fill="${C.foreground}">${esc(
    squad.owner
  )}/${esc(squad.repo)}</text>
      <text x="${CARD_WIDTH - CARD_PAD}" y="${logoY + 26}" text-anchor="end" font-family="${FONT_DISPLAY}" font-size="44"
        fill="${C.green}">${esc(squad.totalValueFormatted)}</text>
      <text x="${CARD_WIDTH - CARD_PAD}" y="${logoY + 54}" text-anchor="end" font-family="${FONT_SANS}" font-size="18"
        fill="${C.muted}">${playerCount} players</text>
    </g>`;

  // --- Pitch ------------------------------------------------------------
  const pitchDelay = nextDelay();
  const pitchLines = small
    ? `<svg x="${pitchX}" y="${pitchY}" width="${pitchW}" height="${pitchH}" viewBox="0 0 68 51">
        <g fill="none" stroke="${C.border}" stroke-width="0.5">
          <rect x="1" y="1" width="66" height="49" rx="2" />
          <line x1="1" y1="3" x2="67" y2="3" />
          <path d="M 20 3 A 14 14 0 0 0 48 3" />
          <rect x="13.85" y="34.5" width="40.3" height="16.5" />
          <rect x="24.85" y="45" width="18.3" height="6" />
        </g>
      </svg>`
    : `<svg x="${pitchX}" y="${pitchY}" width="${pitchW}" height="${pitchH}" viewBox="0 0 68 105">
        <g fill="none" stroke="${C.border}" stroke-width="0.5">
          <rect x="1" y="1" width="66" height="103" rx="2" />
          <line x1="1" y1="52.5" x2="67" y2="52.5" />
          <circle cx="34" cy="52.5" r="9.15" />
          <circle cx="34" cy="52.5" r="0.4" fill="${C.border}" />
          <rect x="13.85" y="88.5" width="40.3" height="16.5" />
          <rect x="24.85" y="99" width="18.3" height="6" />
          <rect x="13.85" y="0" width="40.3" height="16.5" />
          <rect x="24.85" y="0" width="18.3" height="6" />
        </g>
      </svg>`;
  const pitchBox = `
    <g class="reveal" style="animation-delay:${pitchDelay}ms">
      <rect x="${pitchX}" y="${pitchY}" width="${pitchW}" height="${pitchH}" rx="24"
        fill="rgba(255,255,255,0.03)" stroke="${C.border}" stroke-width="2" />
      ${pitchLines}
    </g>`;

  // --- Chips --------------------------------------------------------------
  const chipW = Math.round(PITCH_CHIP_W * scale);
  const avatarSize = Math.round(94 * scale);
  const maxChars = Math.floor(chipW / 10);
  const EDGE_MARGIN = 10;
  const defs: string[] = [];

  const chips = squad.starters
    .map((player, i) => {
      const pos = pitchPosition(player.position.x, player.position.y);
      const left = clamp(
        pitchX + (pos.left / 100) * pitchW - chipW / 2,
        pitchX + EDGE_MARGIN,
        pitchX + pitchW - chipW - EDGE_MARGIN
      );
      const top = clamp(
        pitchY + (pos.top / 100) * pitchH - chipW / 2,
        pitchY + EDGE_MARGIN,
        pitchY + pitchH - chipW - EDGE_MARGIN
      );
      const avatarCx = left + chipW / 2;
      const avatarCy = top + avatarSize / 2;
      const isCaptain = player.login === squad.captain.login;
      const isMvp = player.login === squad.mvp.login;
      const avatarUri = avatarDataUris.get(player.avatarUrl) ?? null;
      const clipId = `avatarClip${i}`;
      const ringColor = isMvp ? C.gold : C.green;

      let avatarMarkup: string;
      if (avatarUri) {
        defs.push(`<clipPath id="${clipId}"><circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarSize / 2}" /></clipPath>`);
        avatarMarkup = `
        <image href="${avatarUri}" x="${avatarCx - avatarSize / 2}" y="${top}" width="${avatarSize}" height="${avatarSize}"
          clip-path="url(#${clipId})" preserveAspectRatio="xMidYMid slice" />
        <circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarSize / 2}" fill="none" stroke="${ringColor}" stroke-width="3" />`;
      } else {
        avatarMarkup = `
        <circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarSize / 2}" fill="${C.pitch}" stroke="${ringColor}" stroke-width="3" />
        <text x="${avatarCx}" y="${avatarCy + Math.round(12 * scale)}" text-anchor="middle"
          font-family="${FONT_DISPLAY}" font-size="${Math.round(30 * scale)}" fill="${C.foreground}">${esc(
          player.login[0]?.toUpperCase() ?? "?"
        )}</text>`;
      }

      const badgeMarkup = `
        ${
          isCaptain
            ? `<circle cx="${avatarCx + avatarSize / 2 - 4}" cy="${top + 4}" r="11" fill="#4d9fff" stroke="${C.pitch}" stroke-width="2" />
        <text x="${avatarCx + avatarSize / 2 - 4}" y="${top + 8}" text-anchor="middle" font-family="${FONT_DISPLAY}" font-size="11" fill="${C.pitch}">C</text>`
            : ""
        }
        ${
          isMvp
            ? `<circle cx="${avatarCx + avatarSize / 2 - 4}" cy="${top + avatarSize - 4}" r="11" fill="${C.gold}" stroke="${C.pitch}" stroke-width="2" />
        <text x="${avatarCx + avatarSize / 2 - 4}" y="${top + avatarSize}" text-anchor="middle" font-family="${FONT_DISPLAY}" font-size="12" fill="${C.pitch}">★</text>`
            : ""
        }`;

      const nameY = top + avatarSize + Math.round(22 * scale);
      const valueY = nameY + Math.round(20 * scale);
      const commitsY = valueY + Math.round(16 * scale);
      const delay = nextDelay();

      // Opaque backing behind the nameplate — without it this text is
      // unreadable over the pitch's grass lines/center circle, the same
      // legibility fix the PNG exports' Nameplate component already has.
      const backingPad = Math.round(4 * scale);
      const backingY = top + avatarSize + Math.round(2 * scale);
      const backingHeight = commitsY - backingY + Math.round(8 * scale);

      return `
      <g class="reveal" style="animation-delay:${delay}ms">
        ${avatarMarkup}
        ${badgeMarkup}
        <rect x="${avatarCx - chipW / 2 + backingPad}" y="${backingY}" width="${chipW - backingPad * 2}" height="${backingHeight}"
          rx="8" fill="rgba(0,0,0,0.6)" />
        <text x="${avatarCx}" y="${nameY}" text-anchor="middle" font-family="${FONT_DISPLAY}" font-size="${Math.round(
        18 * scale
      )}" fill="${C.foreground}">${esc(truncateName(player.login, maxChars))}</text>
        <text x="${avatarCx}" y="${valueY}" text-anchor="middle" font-family="${FONT_SANS}" font-size="${Math.round(
        16 * scale
      )}" fill="${C.green}">${esc(player.marketValueFormatted)}</text>
        <text x="${avatarCx}" y="${commitsY}" text-anchor="middle" font-family="${FONT_SANS}" font-size="${Math.round(
        12 * scale
      )}" fill="${C.muted}">${pluralize(player.commits, "commit")}</text>
      </g>`;
    })
    .join("");

  // --- Footer -------------------------------------------------------------
  const FOOTER_LOGO_SIZE = 22;
  const footerDelay = nextDelay();
  const footerY = CARD_HEIGHT - CARD_PAD;
  const footerLogoY = footerY - FOOTER_LOGO_SIZE + 4;
  const footer = `
    <g class="reveal" style="animation-delay:${footerDelay}ms">
      <line x1="${CARD_PAD}" y1="${footerY - 24}" x2="${CARD_WIDTH - CARD_PAD}" y2="${footerY - 24}" stroke="${C.border}" />
      <clipPath id="footerLogoClip"><rect x="${CARD_PAD}" y="${footerLogoY}" width="${FOOTER_LOGO_SIZE}" height="${FOOTER_LOGO_SIZE}" rx="5" /></clipPath>
      <image href="${logoDataUri}" x="${CARD_PAD}" y="${footerLogoY}" width="${FOOTER_LOGO_SIZE}" height="${FOOTER_LOGO_SIZE}" clip-path="url(#footerLogoClip)" />
      <text x="${CARD_PAD + FOOTER_LOGO_SIZE + 10}" y="${footerY}" font-family="${FONT_SANS}" font-size="16" fill="${C.muted}">${esc(
    siteHost
  )}/squad/${esc(squad.owner)}/${esc(squad.repo)}</text>
    </g>`;

  const styleBlock = animate
    ? `<style>
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .reveal { opacity: 0; animation: fadeInUp 0.5s ease-out forwards; }
    @media (prefers-reduced-motion: reduce) {
      .reveal { opacity: 1; animation: none; transform: none; }
    }
  </style>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}">
  <defs>${defs.join("")}</defs>
  ${styleBlock}
  <rect x="0" y="0" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="${C.pitch}" />
  <rect x="1.5" y="1.5" width="${CARD_WIDTH - 3}" height="${CARD_HEIGHT - 3}" fill="none"
    stroke="rgba(0,230,118,0.45)" stroke-width="3" />
  ${header}
  ${pitchBox}
  ${chips}
  ${footer}
</svg>`;
}

// Same dark theme, sized down — used when the repo doesn't exist or doesn't
// have enough contributors to field a squad. Served with status 200 so a
// README <img> never shows a broken-image icon.
export function renderSquadErrorCardSvg(message: string): string {
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
