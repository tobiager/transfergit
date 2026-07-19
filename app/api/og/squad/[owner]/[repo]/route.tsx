import { ImageResponse } from "next/og";
import { loadOgFonts } from "../../../_shared/fonts";
import { loadOgLogoDataUri } from "../../../_shared/logo";
import { fetchAvatarsBatch } from "../../../_shared/avatarBatch";
import { SQUAD_THEMES, type SquadTheme, type SquadThemeName } from "../../../_shared/squadTheme";
import {
  getSquadFromParams,
  RepoNotFoundError,
  NotEnoughPlayersError,
  type SquadFormationParams,
  type Starter,
  type SquadPlayer,
} from "@/lib/squad";
import { pitchPosition, pitchPositionHorizontal } from "@/lib/squad/pitchLayout";
import { isSmallSided, chipScale, formationLabel } from "@/lib/squad/formations";
import { fitUsername } from "@/lib/squad/textFit";
import { getSiteHost } from "@/lib/site-url";
import { pluralize } from "@/lib/format";

type Format = "portrait" | "landscape" | "full";

const PORTRAIT_SIZE = { width: 1200, height: 1500 };
const LANDSCAPE_SIZE = { width: 1200, height: 630 };
const FULL_SQUAD_SIZE = { width: 1200, height: 1800 };

const PITCH_W = 760;
const PITCH_H = 1174;
// Small-sided (<=7 players) gets a wider, shorter half-pitch instead of the
// full vertical one stretched thin over a mostly-empty court.
const PITCH_W_SMALL = 1000;
const PITCH_H_SMALL = 750;
const PITCH_CHIP_W = 140;

// The 630px canvas is short — a 4-a-side line (e.g. a back four) needs real
// vertical room between members, so header/footer/padding are trimmed to
// the minimum that still fits their own content, and the chip itself
// (avatar+tag+nameplate) is sized to actually fit within the resulting
// per-member gap. Verified against real renders; tune these together, not
// independently, if either the header/footer content or the chip design
// changes.
const LANDSCAPE_PAD = 16;
const LANDSCAPE_HEADER_H = 74;
const LANDSCAPE_FOOTER_H = 22;
const LANDSCAPE_GAP = 6;
// A 4-member line (e.g. a back four) needs 4 chips to fit vertically inside
// the pitch box without touching — smaller than the portrait/full-squad
// chip so that's actually achievable on this canvas's short 630px height;
// see lib/squad/pitchLayout.test.ts's landscape collision test, which this
// was sized against together with the zigzag offset (pitchLayout.ts).
// Wider than tall on purpose: the horizontal gap between the def/mid/fwd
// lines (~25% of the pitch width) has room to spare, so widening the chip
// buys the nameplate enough width to show full/near-full usernames instead of
// "Laks…7089", without growing the chip's HEIGHT — the tight axis, where a
// 4-member line (back four) must stack inside the 630px canvas. Font scale is
// nudged up only slightly for the same reason (height stays ~constant).
const LANDSCAPE_CHIP_W = 130;
const LANDSCAPE_AVATAR_SIZE = 50;
// The chip is taller than it is wide (tag + avatar + nameplate stacked) —
// vertical clamping against LANDSCAPE_CHIP_W alone let the nameplate of the
// bottom-most chip in a line overflow past the pitch box into the footer.
// Height stays close to the old value on purpose: the tight axis is the
// vertical one (a back four stacking on the 630px canvas), so the extra room
// for bigger avatars + fuller names is spent on WIDTH (plenty of horizontal
// gap between lines), not height.
const LANDSCAPE_CHIP_H = 104;
const LANDSCAPE_EDGE_MARGIN = 3;
const LANDSCAPE_FONT_SCALE = 0.64;

const FULL_SQUAD_PAD = 40;
const FULL_SQUAD_PITCH_CHIP_W = 108;
const FULL_SQUAD_BENCH_AVATAR = 56;
const FULL_SQUAD_BENCH_COLS = 3;

// Elastic layout: header and footer are fixed blocks, everything left over
// (FULL_SQUAD_SIZE.height minus those, minus the two gaps around the pitch)
// is split between the pitch and the bench BEFORE anything renders, based on
// how many bench players there actually are — a full 19-player bench (the
// TIER1_SIZE=30 cap minus an 11-player XI) gets ~45% of that space, an empty
// bench gets none of it (the whole section is skipped and the pitch takes
// 100%). No leftover dead space at the bottom regardless of squad size.
const FULL_SQUAD_HEADER_H = 140;
const FULL_SQUAD_FOOTER_H = 80;
const FULL_SQUAD_SECTION_GAP = 24;
const FULL_SQUAD_MAX_BENCH_FOR_SCALE = 19;
const FULL_SQUAD_BENCH_FRACTION_MIN = 0.1;
const FULL_SQUAD_BENCH_FRACTION_MAX = 0.45;

function benchHeightFraction(benchCount: number): number {
  const t = clamp(benchCount / FULL_SQUAD_MAX_BENCH_FOR_SCALE, 0, 1);
  return FULL_SQUAD_BENCH_FRACTION_MIN + t * (FULL_SQUAD_BENCH_FRACTION_MAX - FULL_SQUAD_BENCH_FRACTION_MIN);
}

// XI avatars (portrait/landscape/full-squad pitch half). Bench avatars in
// the Full Squad format fetch at a smaller BENCH_AVATAR_SIZE instead — up
// to 30 avatars total in one response, so the bench half deliberately
// costs less per avatar to keep the rendered PNG's payload down (see the
// GET handler's size logging).
const AVATAR_SIZE = 96;
const BENCH_AVATAR_SIZE = 64;

const CACHE_CONTROL = "public, max-age=0, s-maxage=86400, stale-while-revalidate";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseFormat(value: string | null): Format {
  if (value === "landscape") return "landscape";
  if (value === "full") return "full";
  return "portrait";
}

function parseTheme(value: string | null): SquadThemeName {
  return value === "grass" ? "grass" : "floodlight";
}

function ErrorImage({ width, height, theme, message }: { width: number; height: number; theme: SquadTheme; message: string }) {
  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.background,
        color: theme.foreground,
        fontFamily: "Archivo Black",
        fontSize: 40,
        textAlign: "center",
        padding: 80,
      }}
    >
      {message}
    </div>
  );
}

// --- Pitch backgrounds ------------------------------------------------

// Real pitch proportions (68m wide x 105m long).
function PitchLines({ color, width, height }: { color: string; width: number; height: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 68 105" style={{ position: "absolute", top: 0, left: 0 }}>
      <g fill="none" stroke={color} strokeWidth="0.5">
        <rect x="1" y="1" width="66" height="103" rx="2" />
        <line x1="1" y1="52.5" x2="67" y2="52.5" />
        <circle cx="34" cy="52.5" r="9.15" />
        <circle cx="34" cy="52.5" r="0.4" fill={color} />
        <rect x="13.85" y="88.5" width="40.3" height="16.5" />
        <rect x="24.85" y="99" width="18.3" height="6" />
        <rect x="13.85" y="0" width="40.3" height="16.5" />
        <rect x="24.85" y="0" width="18.3" height="6" />
      </g>
    </svg>
  );
}

// Small-sided half-pitch (futsal-style): one goal box at the bottom, the
// halfway line + center circle near the top instead of a second box — same
// shape the live small-sided pitch uses (components/squad/SquadPitch.tsx).
function SmallPitchLines({ color, width, height }: { color: string; width: number; height: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 68 51" style={{ position: "absolute", top: 0, left: 0 }}>
      <g fill="none" stroke={color} strokeWidth="0.5">
        <rect x="1" y="1" width="66" height="49" rx="2" />
        <line x1="1" y1="3" x2="67" y2="3" />
        <path d="M 20 3 A 14 14 0 0 0 48 3" />
        <rect x="13.85" y="34.5" width="40.3" height="16.5" />
        <rect x="24.85" y="45" width="18.3" height="6" />
      </g>
    </svg>
  );
}

// Natural (broadcast) pitch orientation for the landscape export: goal boxes
// on the left and right ends, halfway line vertical through the middle.
function LandscapePitchLines({ color, width, height }: { color: string; width: number; height: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 105 68" style={{ position: "absolute", top: 0, left: 0 }}>
      <g fill="none" stroke={color} strokeWidth="0.5">
        <rect x="1" y="1" width="103" height="66" rx="2" />
        <line x1="52.5" y1="1" x2="52.5" y2="67" />
        <circle cx="52.5" cy="34" r="9.15" />
        <circle cx="52.5" cy="34" r="0.4" fill={color} />
        <rect x="0" y="13.85" width="16.5" height="40.3" />
        <rect x="0" y="24.85" width="6" height="18.3" />
        <rect x="88.5" y="13.85" width="16.5" height="40.3" />
        <rect x="99" y="24.85" width="6" height="18.3" />
      </g>
    </svg>
  );
}

// --- Shared chip pieces (v2 design: position tag, avatar, C/MVP badges,
// nameplate) — the same visual language as the live page's PlayerChip,
// translated to Satori. One component used by the portrait pitch, the
// landscape pitch, and the Full Squad format's compressed pitch half. ---

function AvatarCircle({
  avatarDataUri,
  size,
  borderColor,
  theme,
  login,
}: {
  avatarDataUri: string | null;
  size: number;
  borderColor: string;
  theme: SquadTheme;
  login: string;
}) {
  if (avatarDataUri) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Satori (ImageResponse) only renders native <img>.
      <img
        src={avatarDataUri}
        width={size}
        height={size}
        alt=""
        style={{ borderRadius: size / 2, borderWidth: 3, borderStyle: "solid", borderColor }}
      />
    );
  }
  return (
    <div
      style={{
        display: "flex",
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.chipBg,
        borderWidth: 3,
        borderStyle: "solid",
        borderColor,
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Archivo Black",
        fontSize: Math.round(size * 0.36),
        color: theme.foreground,
      }}
    >
      {login[0]?.toUpperCase()}
    </div>
  );
}

// Badges scale with the chip (via `scale`, the chip's fontScale) so they stay
// proportional to the avatar. On the small landscape avatar the old fixed 26px
// badges were oversized enough that the captain (top-right) and MVP
// (bottom-right) circles collided into one blob and the MVP star read as
// missing — scaling them down to the avatar keeps both clearly visible.
function CaptainBadge({ scale = 1 }: { scale?: number }) {
  const size = Math.round(26 * scale);
  const offset = Math.round(-3 * scale);
  return (
    <div
      style={{
        display: "flex",
        position: "absolute",
        top: offset,
        right: offset,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#4d9fff",
        color: "#060a12",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Archivo Black",
        fontSize: Math.round(13 * scale),
      }}
    >
      C
    </div>
  );
}

function MvpBadge({ theme, scale = 1 }: { theme: SquadTheme; scale?: number }) {
  const size = Math.round(26 * scale);
  const offset = Math.round(-3 * scale);
  const star = Math.round(size * 0.66);
  return (
    <div
      style={{
        display: "flex",
        position: "absolute",
        bottom: offset,
        right: offset,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.gold,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Drawn as an SVG path, NOT a "★" text glyph: Satori only has the
          fonts we load (Archivo/Archivo Black/…), none of which include the
          star glyph, so the character rendered as a tofu box and the MVP mark
          read as missing. */}
      <svg width={star} height={star} viewBox="0 0 24 24" fill="#060a12">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z" />
      </svg>
    </div>
  );
}

// Small monospace-ish pill above the avatar, showing the formation slot's
// role (GK/CB/CM/...) — see lib/squad/formations.ts's FORMATIONS table for
// the per-slot role mapping.
function PositionTag({ role, theme, fontScale }: { role: string; theme: SquadTheme; fontScale: number }) {
  return (
    <div
      style={{
        display: "flex",
        backgroundColor: "rgba(255,255,255,0.08)",
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: theme.chipBorder,
        borderRadius: 20,
        paddingLeft: 8,
        paddingRight: 8,
        paddingTop: 2,
        paddingBottom: 2,
        fontFamily: "Archivo Black",
        fontSize: Math.max(9, Math.round(11 * fontScale)),
        color: theme.muted,
        letterSpacing: 1,
      }}
    >
      {role.toUpperCase()}
    </div>
  );
}

// Opaque, rounded backing behind username/value/commits — without it this
// text is unreadable over the pitch's grass lines/center circle (the same
// legibility problem the live page's nameplate fixes). Username is fit via
// the same auto-shrink-then-middle-ellipsis math the live page uses
// (lib/squad/textFit.ts): never wraps, never trailing-truncates mid-word.
function Nameplate({
  player,
  theme,
  chipWidth,
  fontScale,
}: {
  player: SquadPlayer;
  theme: SquadTheme;
  chipWidth: number;
  fontScale: number;
}) {
  const innerWidth = chipWidth - 12;
  const fit = fitUsername(player.login, innerWidth, Math.round(18 * fontScale), Math.max(10, Math.round(11 * fontScale)));
  const valueColor = player.marketValue === null ? theme.muted : theme.accent;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: 6,
        backgroundColor: "rgba(0,0,0,0.6)",
        borderRadius: 8,
        paddingLeft: 8,
        paddingRight: 8,
        paddingTop: 4,
        paddingBottom: 4,
      }}
    >
      <div style={{ display: "flex", fontFamily: "Archivo Black", fontSize: fit.fontSizePx, color: theme.foreground }}>
        {fit.text}
      </div>
      <div
        style={{
          display: "flex",
          fontFamily: "Archivo",
          fontSize: Math.max(10, Math.round(13 * fontScale)),
          color: valueColor,
          marginTop: 2,
        }}
      >
        {player.marketValueFormatted}
      </div>
      <div
        style={{
          display: "flex",
          fontFamily: "Archivo",
          fontSize: Math.max(9, Math.round(10 * fontScale)),
          color: theme.muted,
          marginTop: 1,
        }}
      >
        {pluralize(player.commits, "commit")}
      </div>
    </div>
  );
}

function SquadChip({
  player,
  theme,
  isCaptain,
  isMvp,
  avatarDataUri,
  left,
  top,
  chipWidth,
  avatarSize,
  fontScale = 1,
}: {
  player: Starter;
  theme: SquadTheme;
  isCaptain: boolean;
  isMvp: boolean;
  avatarDataUri: string | null;
  left: number;
  top: number;
  chipWidth: number;
  avatarSize: number;
  fontScale?: number;
}) {
  const ringColor = isMvp ? theme.gold : theme.accent;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: chipWidth,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <PositionTag role={player.position.role} theme={theme} fontScale={fontScale} />
      <div style={{ display: "flex", position: "relative", marginTop: 4 }}>
        <AvatarCircle avatarDataUri={avatarDataUri} size={avatarSize} borderColor={ringColor} theme={theme} login={player.login} />
        {isCaptain && <CaptainBadge scale={fontScale} />}
        {isMvp && <MvpBadge theme={theme} scale={fontScale} />}
      </div>
      <Nameplate player={player} theme={theme} chipWidth={chipWidth} fontScale={fontScale} />
    </div>
  );
}

function PortraitPitchChip({
  player,
  theme,
  isCaptain,
  isMvp,
  avatarDataUri,
  pitchW,
  pitchH,
  scale = 1,
}: {
  player: Starter;
  theme: SquadTheme;
  isCaptain: boolean;
  isMvp: boolean;
  avatarDataUri: string | null;
  pitchW: number;
  pitchH: number;
  scale?: number;
}) {
  const pos = pitchPosition(player.position.x, player.position.y);
  const chipW = Math.round(PITCH_CHIP_W * scale);
  const avatarSize = Math.round(94 * scale);
  // pitchPosition()'s inset was tuned for the live page's much smaller chip
  // — this OG chip is wide enough that a straight percentage->pixel
  // conversion can push it past the pitch edge at the extreme x/y slots
  // (e.g. the left-back). Clamp the final pixel box to stay fully inside,
  // with a small margin so it never sits flush against the pitch border.
  const EDGE_MARGIN = 10;
  const left = clamp((pos.left / 100) * pitchW - chipW / 2, EDGE_MARGIN, pitchW - chipW - EDGE_MARGIN);
  const top = clamp((pos.top / 100) * pitchH - chipW / 2, EDGE_MARGIN, pitchH - chipW - EDGE_MARGIN);

  return (
    <SquadChip
      player={player}
      theme={theme}
      isCaptain={isCaptain}
      isMvp={isMvp}
      avatarDataUri={avatarDataUri}
      left={left}
      top={top}
      chipWidth={chipW}
      avatarSize={avatarSize}
      fontScale={scale}
    />
  );
}

function LandscapePitchChip({
  player,
  theme,
  isCaptain,
  isMvp,
  avatarDataUri,
  pitchW,
  pitchH,
}: {
  player: Starter;
  theme: SquadTheme;
  isCaptain: boolean;
  isMvp: boolean;
  avatarDataUri: string | null;
  pitchW: number;
  pitchH: number;
}) {
  const pos = pitchPositionHorizontal(player.position.x, player.position.y);
  const left = clamp(
    (pos.left / 100) * pitchW - LANDSCAPE_CHIP_W / 2,
    LANDSCAPE_EDGE_MARGIN,
    pitchW - LANDSCAPE_CHIP_W - LANDSCAPE_EDGE_MARGIN
  );
  const top = clamp(
    (pos.top / 100) * pitchH - LANDSCAPE_CHIP_H / 2,
    LANDSCAPE_EDGE_MARGIN,
    pitchH - LANDSCAPE_CHIP_H - LANDSCAPE_EDGE_MARGIN
  );

  return (
    <SquadChip
      player={player}
      theme={theme}
      isCaptain={isCaptain}
      isMvp={isMvp}
      avatarDataUri={avatarDataUri}
      left={left}
      top={top}
      chipWidth={LANDSCAPE_CHIP_W}
      avatarSize={LANDSCAPE_AVATAR_SIZE}
      fontScale={LANDSCAPE_FONT_SCALE}
    />
  );
}

// --- Header/footer (shared shape across portrait/full-squad) ------------

function CardHeader({
  owner,
  repo,
  theme,
  logoDataUri,
  totalValue,
  playerCount,
  formation,
  width,
}: {
  owner: string;
  repo: string;
  theme: SquadTheme;
  logoDataUri: string;
  totalValue: string;
  playerCount: number;
  formation: string;
  width: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", width }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori (ImageResponse) only renders native <img>. */}
        <img src={logoDataUri} width={52} height={52} alt="" style={{ borderRadius: 12 }} />
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 16 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                fontFamily: "Barlow Condensed",
                fontSize: 18,
                color: theme.muted,
                textTransform: "uppercase",
                letterSpacing: 3,
              }}
            >
              Repo Squad
            </div>
            <div style={{ display: "flex", marginLeft: 12, fontFamily: "Archivo Black", fontSize: 16, color: theme.accent }}>
              {formationLabel(formation)}
            </div>
          </div>
          <div style={{ display: "flex", fontFamily: "Archivo Black", fontSize: 34, color: theme.foreground }}>
            {owner}/{repo}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <div style={{ display: "flex", fontFamily: "Archivo Black", fontSize: 44, color: theme.accent }}>{totalValue}</div>
        <div style={{ display: "flex", fontSize: 18, color: theme.muted }}>{playerCount} players</div>
      </div>
    </div>
  );
}

function CardFooter({ theme, logoDataUri, siteHost, owner, repo }: { theme: SquadTheme; logoDataUri: string; siteHost: string; owner: string; repo: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", paddingBottom: 40 }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- Satori (ImageResponse) only renders native <img>. */}
      <img src={logoDataUri} width={22} height={22} alt="" style={{ borderRadius: 5 }} />
      <div style={{ display: "flex", fontSize: 18, color: theme.muted, marginLeft: 10 }}>
        {siteHost}/squad/{owner}/{repo}
      </div>
    </div>
  );
}

// --- Portrait (4:5) -------------------------------------------------------

async function renderPortrait(
  owner: string,
  repo: string,
  theme: SquadTheme,
  siteHost: string,
  logoDataUri: string,
  formationParams: SquadFormationParams
) {
  const { squad } = await getSquadFromParams(owner, repo, formationParams);
  const playerCount = squad.starters.length + squad.bench.length;
  const avatarMap = await fetchAvatarsBatch(
    squad.starters.map((p) => p.avatarUrl),
    AVATAR_SIZE
  );

  const small = isSmallSided(squad.starters.length);
  const scale = chipScale(squad.starters.length);
  const pitchW = small ? PITCH_W_SMALL : PITCH_W;
  const pitchH = small ? PITCH_H_SMALL : PITCH_H;

  return (
    <div
      style={{
        width: PORTRAIT_SIZE.width,
        height: PORTRAIT_SIZE.height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: theme.background,
        backgroundImage: theme.backgroundImage,
        fontFamily: "Archivo",
        paddingTop: 52,
      }}
    >
      <CardHeader
        owner={owner}
        repo={repo}
        theme={theme}
        logoDataUri={logoDataUri}
        totalValue={squad.totalValueFormatted}
        playerCount={playerCount}
        formation={squad.formation}
        width={PITCH_W}
      />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, width: "100%" }}>
        <div
          style={{
            display: "flex",
            position: "relative",
            width: pitchW,
            height: pitchH,
            borderRadius: 28,
            borderWidth: 2,
            borderStyle: "solid",
            borderColor: theme.pitchBorder,
            backgroundColor: theme.pitchBg,
          }}
        >
          {small ? (
            <SmallPitchLines color={theme.pitchLine} width={pitchW} height={pitchH} />
          ) : (
            <PitchLines color={theme.pitchLine} width={pitchW} height={pitchH} />
          )}
          {squad.starters.map((player) => (
            <PortraitPitchChip
              key={player.login}
              player={player}
              theme={theme}
              isCaptain={player.login === squad.captain.login}
              isMvp={player.login === squad.mvp.login}
              avatarDataUri={avatarMap.get(player.avatarUrl) ?? null}
              pitchW={pitchW}
              pitchH={pitchH}
              scale={scale}
            />
          ))}
        </div>
      </div>

      <CardFooter theme={theme} logoDataUri={logoDataUri} siteHost={siteHost} owner={owner} repo={repo} />
    </div>
  );
}

// --- Landscape (16:9) — broadcast pitch orientation, GK left, attack right

async function renderLandscape(
  owner: string,
  repo: string,
  theme: SquadTheme,
  siteHost: string,
  logoDataUri: string,
  formationParams: SquadFormationParams
) {
  const { squad } = await getSquadFromParams(owner, repo, formationParams);
  const playerCount = squad.starters.length + squad.bench.length;
  const avatarMap = await fetchAvatarsBatch(
    squad.starters.map((p) => p.avatarUrl),
    AVATAR_SIZE
  );

  const pitchW = LANDSCAPE_SIZE.width - LANDSCAPE_PAD * 2;
  const pitchH =
    LANDSCAPE_SIZE.height - LANDSCAPE_PAD * 2 - LANDSCAPE_HEADER_H - LANDSCAPE_FOOTER_H - LANDSCAPE_GAP * 2;

  return (
    <div
      style={{
        width: LANDSCAPE_SIZE.width,
        height: LANDSCAPE_SIZE.height,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        backgroundColor: theme.background,
        backgroundImage: theme.backgroundImage,
        fontFamily: "Archivo",
        padding: LANDSCAPE_PAD,
      }}
    >
      {/* Header — logo/REPO SQUAD/owner-repo left, value + "N players · formation" right */}
      <div style={{ display: "flex", height: LANDSCAPE_HEADER_H, flexShrink: 0 }}>
        <CardHeader
          owner={owner}
          repo={repo}
          theme={theme}
          logoDataUri={logoDataUri}
          totalValue={squad.totalValueFormatted}
          playerCount={playerCount}
          formation={squad.formation}
          width={pitchW}
        />
      </div>

      {/* Pitch — natural (broadcast) orientation: GK left, attack right */}
      <div
        style={{
          display: "flex",
          position: "relative",
          width: pitchW,
          height: pitchH,
          marginTop: LANDSCAPE_GAP,
          borderRadius: 24,
          borderWidth: 2,
          borderStyle: "solid",
          borderColor: theme.pitchBorder,
          backgroundColor: theme.pitchBg,
        }}
      >
        <LandscapePitchLines color={theme.pitchLine} width={pitchW} height={pitchH} />
        {squad.starters.map((player) => (
          <LandscapePitchChip
            key={player.login}
            player={player}
            theme={theme}
            isCaptain={player.login === squad.captain.login}
            isMvp={player.login === squad.mvp.login}
            avatarDataUri={avatarMap.get(player.avatarUrl) ?? null}
            pitchW={pitchW}
            pitchH={pitchH}
          />
        ))}
      </div>

      {/* Footer — branding + URL */}
      <div style={{ display: "flex", alignItems: "center", marginTop: LANDSCAPE_GAP, height: LANDSCAPE_FOOTER_H, flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori (ImageResponse) only renders native <img>. */}
        <img src={logoDataUri} width={20} height={20} alt="" style={{ borderRadius: 5 }} />
        <div style={{ display: "flex", fontSize: 16, color: theme.muted, marginLeft: 8 }}>
          {siteHost}/squad/{owner}/{repo}
        </div>
      </div>
    </div>
  );
}

// --- Full Squad (2:3) — compressed XI on top, full bench grid below -----

function BenchGridChip({
  player,
  theme,
  isCaptain,
  isMvp,
  avatarDataUri,
  cellWidth,
}: {
  player: SquadPlayer;
  theme: SquadTheme;
  isCaptain: boolean;
  isMvp: boolean;
  avatarDataUri: string | null;
  cellWidth: number;
}) {
  const ringColor = isMvp ? theme.gold : theme.chipBorder;
  const textWidth = cellWidth - FULL_SQUAD_BENCH_AVATAR - 34;
  const fit = fitUsername(player.login, textWidth, 17, 11);
  const valueColor = player.marketValue === null ? theme.muted : theme.accent;

  return (
    <div style={{ display: "flex", alignItems: "center", width: cellWidth, padding: 10 }}>
      <div style={{ display: "flex", position: "relative", flexShrink: 0 }}>
        <AvatarCircle avatarDataUri={avatarDataUri} size={FULL_SQUAD_BENCH_AVATAR} borderColor={ringColor} theme={theme} login={player.login} />
        {isCaptain && <CaptainBadge />}
        {isMvp && <MvpBadge theme={theme} />}
      </div>
      <div style={{ display: "flex", flexDirection: "column", marginLeft: 12 }}>
        <div style={{ display: "flex", fontFamily: "Archivo Black", fontSize: fit.fontSizePx, color: theme.foreground }}>
          {fit.text}
        </div>
        <div style={{ display: "flex", fontFamily: "Archivo", fontSize: 14, color: valueColor, marginTop: 2 }}>
          {player.marketValueFormatted}
        </div>
        <div style={{ display: "flex", fontFamily: "Archivo", fontSize: 12, color: theme.muted }}>
          {pluralize(player.commits, "commit")}
        </div>
      </div>
    </div>
  );
}

async function renderFullSquad(
  owner: string,
  repo: string,
  theme: SquadTheme,
  siteHost: string,
  logoDataUri: string,
  formationParams: SquadFormationParams
) {
  const { squad } = await getSquadFromParams(owner, repo, formationParams);
  const playerCount = squad.starters.length + squad.bench.length;
  const [xiAvatarMap, benchAvatarMap] = await Promise.all([
    fetchAvatarsBatch(
      squad.starters.map((p) => p.avatarUrl),
      AVATAR_SIZE
    ),
    fetchAvatarsBatch(
      squad.bench.map((p) => p.avatarUrl),
      BENCH_AVATAR_SIZE
    ),
  ]);

  const small = isSmallSided(squad.starters.length);
  const scale = chipScale(squad.starters.length) * 0.8;
  const contentW = FULL_SQUAD_SIZE.width - FULL_SQUAD_PAD * 2;
  const pitchW = small ? contentW : Math.round(contentW * 0.72);
  const cellWidth = Math.floor(contentW / FULL_SQUAD_BENCH_COLS);

  // Elastic split, computed before anything renders — see the constants'
  // comment above. hasBenchContent false (an XI-only squad — every
  // contributor is a starter) skips the section entirely and hands its
  // whole budget to the pitch instead of rendering an empty "Bench · 0".
  const hasBenchContent = squad.bench.length > 0 || squad.reserves.length > 0;
  const availableH = FULL_SQUAD_SIZE.height - FULL_SQUAD_PAD - FULL_SQUAD_HEADER_H - FULL_SQUAD_FOOTER_H - FULL_SQUAD_SECTION_GAP * (hasBenchContent ? 2 : 1);
  const benchH = hasBenchContent ? Math.round(availableH * benchHeightFraction(squad.bench.length)) : 0;
  const pitchH = availableH - benchH;

  return (
    <div
      style={{
        width: FULL_SQUAD_SIZE.width,
        height: FULL_SQUAD_SIZE.height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: theme.background,
        backgroundImage: theme.backgroundImage,
        fontFamily: "Archivo",
        paddingTop: FULL_SQUAD_PAD,
      }}
    >
      <div style={{ display: "flex", height: FULL_SQUAD_HEADER_H }}>
        <CardHeader
          owner={owner}
          repo={repo}
          theme={theme}
          logoDataUri={logoDataUri}
          totalValue={squad.totalValueFormatted}
          playerCount={playerCount}
          formation={squad.formation}
          width={contentW}
        />
      </div>

      {/* The pitch always starts below the header's own reserved block
          (never overlapping it, e.g. a striker chip near the goal line)
          — pitchPosition() below applies the exact same safe-area inset
          the live page uses (lib/squad/pitchLayout.ts), just scaled to
          this canvas's own chip size via the EDGE_MARGIN clamp. */}
      <div
        style={{
          display: "flex",
          position: "relative",
          width: pitchW,
          height: pitchH,
          marginTop: FULL_SQUAD_SECTION_GAP,
          borderRadius: 24,
          borderWidth: 2,
          borderStyle: "solid",
          borderColor: theme.pitchBorder,
          backgroundColor: theme.pitchBg,
        }}
      >
        {small ? (
          <SmallPitchLines color={theme.pitchLine} width={pitchW} height={pitchH} />
        ) : (
          <PitchLines color={theme.pitchLine} width={pitchW} height={pitchH} />
        )}
        {squad.starters.map((player) => {
          const pos = pitchPosition(player.position.x, player.position.y, small);
          const chipW = Math.round(FULL_SQUAD_PITCH_CHIP_W * scale);
          const avatarSize = Math.round(64 * scale);
          const EDGE_MARGIN = 8;
          const left = clamp((pos.left / 100) * pitchW - chipW / 2, EDGE_MARGIN, pitchW - chipW - EDGE_MARGIN);
          const top = clamp((pos.top / 100) * pitchH - chipW / 2, EDGE_MARGIN, pitchH - chipW - EDGE_MARGIN);
          return (
            <SquadChip
              key={player.login}
              player={player}
              theme={theme}
              isCaptain={player.login === squad.captain.login}
              isMvp={player.login === squad.mvp.login}
              avatarDataUri={xiAvatarMap.get(player.avatarUrl) ?? null}
              left={left}
              top={top}
              chipWidth={chipW}
              avatarSize={avatarSize}
              fontScale={scale}
            />
          );
        })}
      </div>

      {hasBenchContent && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: contentW,
            height: benchH,
            marginTop: FULL_SQUAD_SECTION_GAP,
          }}
        >
          <div style={{ display: "flex", fontFamily: "Barlow Condensed", fontSize: 18, color: theme.muted, textTransform: "uppercase", letterSpacing: 3 }}>
            Bench · {squad.bench.length}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", marginTop: 8 }}>
            {squad.bench.map((player) => (
              <BenchGridChip
                key={player.login}
                player={player}
                theme={theme}
                isCaptain={player.login === squad.captain.login}
                isMvp={player.login === squad.mvp.login}
                avatarDataUri={benchAvatarMap.get(player.avatarUrl) ?? null}
                cellWidth={cellWidth}
              />
            ))}
          </div>
          {/* Pinned right after the grid, not centered in leftover space —
              it's part of the bench's own content flow, not a floating
              footer of its own. */}
          {squad.reserves.length > 0 && (
            <div
              style={{
                display: "flex",
                alignSelf: "center",
                marginTop: 16,
                backgroundColor: theme.chipBg,
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: theme.chipBorder,
                borderRadius: 20,
                paddingLeft: 18,
                paddingRight: 18,
                paddingTop: 8,
                paddingBottom: 8,
                fontFamily: "Archivo Black",
                fontSize: 16,
                color: theme.muted,
              }}
            >
              +{squad.reserves.length} MORE CONTRIBUTORS
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", height: FULL_SQUAD_FOOTER_H }}>
        <CardFooter theme={theme} logoDataUri={logoDataUri} siteHost={siteHost} owner={owner} repo={repo} />
      </div>
    </div>
  );
}

export async function GET(request: Request, { params }: { params: Promise<{ owner: string; repo: string }> }) {
  const { owner, repo } = await params;
  const { searchParams } = new URL(request.url);
  const format = parseFormat(searchParams.get("format"));
  const themeName = parseTheme(searchParams.get("theme"));
  const theme = SQUAD_THEMES[themeName];
  const size = format === "portrait" ? PORTRAIT_SIZE : format === "landscape" ? LANDSCAPE_SIZE : FULL_SQUAD_SIZE;
  // WYSIWYG: no params -> the default formation, same as the live page.
  const formationParams: SquadFormationParams = {
    formation: searchParams.get("formation"),
    base: searchParams.get("base"),
    layout: searchParams.get("layout"),
  };

  const fonts = await loadOgFonts();
  const siteHost = getSiteHost();
  const logoDataUri = await loadOgLogoDataUri();

  try {
    const image =
      format === "portrait"
        ? await renderPortrait(owner, repo, theme, siteHost, logoDataUri, formationParams)
        : format === "landscape"
          ? await renderLandscape(owner, repo, theme, siteHost, logoDataUri, formationParams)
          : await renderFullSquad(owner, repo, theme, siteHost, logoDataUri, formationParams);

    return new ImageResponse(image, { ...size, fonts, headers: { "Cache-Control": CACHE_CONTROL } });
  } catch (err) {
    const message =
      err instanceof RepoNotFoundError
        ? "Repository not found"
        : err instanceof NotEnoughPlayersError
          ? "Not enough contributors to field a squad"
          : "Couldn't build this squad right now";

    return new ImageResponse(<ErrorImage {...size} theme={theme} message={message} />, {
      ...size,
      fonts,
      status: err instanceof RepoNotFoundError || err instanceof NotEnoughPlayersError ? 404 : 500,
      headers: { "Cache-Control": "public, max-age=0, s-maxage=60" },
    });
  }
}
