import { ImageResponse } from "next/og";
import { loadOgFonts } from "../../../_shared/fonts";
import { loadOgLogoDataUri } from "../../../_shared/logo";
import { fetchAvatarsBatch } from "../../../_shared/avatarBatch";
import { SQUAD_THEMES, type SquadTheme, type SquadThemeName } from "../../../_shared/squadTheme";
import { getRepoSquad, RepoNotFoundError, NotEnoughPlayersError, type Starter } from "@/lib/squad";
import { pitchPosition } from "@/lib/squad/pitchLayout";
import { getSiteHost } from "@/lib/site-url";

type Format = "portrait" | "landscape";

const PORTRAIT_SIZE = { width: 1200, height: 1500 };
const LANDSCAPE_SIZE = { width: 1200, height: 630 };
const PITCH_W = 760;
const PITCH_H = 1174;
const PITCH_CHIP_W = 140;
const AVATAR_SIZE = 96;
const CACHE_CONTROL = "public, max-age=0, s-maxage=86400, stale-while-revalidate";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// Satori's text layout doesn't reliably wrap a single unbroken word (no
// spaces in a GitHub username), so a long login can render wider than its
// box and bleed past it — truncate server-side instead of trusting CSS.
function truncateName(name: string, max: number): string {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

function parseFormat(value: string | null): Format {
  return value === "landscape" ? "landscape" : "portrait";
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

// Real pitch proportions (68m wide x 105m long).
function PitchLines({ color }: { color: string }) {
  return (
    <svg
      width={PITCH_W}
      height={PITCH_H}
      viewBox="0 0 68 105"
      style={{ position: "absolute", top: 0, left: 0 }}
    >
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

function PitchChip({
  player,
  theme,
  isCaptain,
  isMvp,
  avatarDataUri,
}: {
  player: Starter;
  theme: SquadTheme;
  isCaptain: boolean;
  isMvp: boolean;
  avatarDataUri: string | null;
}) {
  const pos = pitchPosition(player.position.x, player.position.y);
  // pitchPosition()'s inset was tuned for the live page's much smaller chip
  // — this OG chip is wide enough that a straight percentage->pixel
  // conversion can push it past the pitch edge at the extreme x/y slots
  // (e.g. the left-back). Clamp the final pixel box to stay fully inside,
  // with a small margin so it never sits flush against the pitch border.
  const EDGE_MARGIN = 10;
  const left = clamp((pos.left / 100) * PITCH_W - PITCH_CHIP_W / 2, EDGE_MARGIN, PITCH_W - PITCH_CHIP_W - EDGE_MARGIN);
  const top = clamp((pos.top / 100) * PITCH_H - PITCH_CHIP_W / 2, EDGE_MARGIN, PITCH_H - PITCH_CHIP_W - EDGE_MARGIN);

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: PITCH_CHIP_W,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", position: "relative" }}>
        {avatarDataUri ? (
          // eslint-disable-next-line @next/next/no-img-element -- Satori (ImageResponse) only renders native <img>.
          <img
            src={avatarDataUri}
            width={94}
            height={94}
            alt=""
            style={{
              borderRadius: 47,
              borderWidth: 3,
              borderStyle: "solid",
              borderColor: isMvp ? theme.gold : theme.accent,
            }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              width: 94,
              height: 94,
              borderRadius: 47,
              backgroundColor: theme.chipBg,
              borderWidth: 3,
              borderStyle: "solid",
              borderColor: isMvp ? theme.gold : theme.accent,
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Archivo Black",
              fontSize: 34,
              color: theme.foreground,
            }}
          >
            {player.login[0]?.toUpperCase()}
          </div>
        )}
        {isCaptain && (
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: -4,
              right: -4,
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: "#4d9fff",
              color: "#060a12",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Archivo Black",
              fontSize: 13,
            }}
          >
            C
          </div>
        )}
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 8,
          fontFamily: "Archivo Black",
          fontSize: 20,
          color: theme.foreground,
          width: PITCH_CHIP_W,
          textAlign: "center",
          justifyContent: "center",
        }}
      >
        {truncateName(player.login, 9)}
      </div>
      <div style={{ display: "flex", marginTop: 2, fontFamily: "Archivo", fontSize: 18, color: theme.accent }}>
        {player.marketValueFormatted}
      </div>
    </div>
  );
}

async function renderPortrait(
  owner: string,
  repo: string,
  theme: SquadTheme,
  siteHost: string,
  logoDataUri: string
) {
  const squad = await getRepoSquad(owner, repo);
  const playerCount = squad.starters.length + squad.bench.length;
  const avatarMap = await fetchAvatarsBatch(
    squad.starters.map((p) => p.avatarUrl),
    AVATAR_SIZE
  );

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
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: PITCH_W,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- Satori (ImageResponse) only renders native <img>. */}
          <img src={logoDataUri} width={52} height={52} alt="" style={{ borderRadius: 12 }} />
          <div style={{ display: "flex", flexDirection: "column", marginLeft: 16 }}>
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
            <div style={{ display: "flex", fontFamily: "Archivo Black", fontSize: 34, color: theme.foreground }}>
              {owner}/{repo}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <div style={{ display: "flex", fontFamily: "Archivo Black", fontSize: 44, color: theme.accent }}>
            {squad.totalValueFormatted}
          </div>
          <div style={{ display: "flex", fontSize: 18, color: theme.muted }}>{playerCount} players</div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          position: "relative",
          width: PITCH_W,
          height: PITCH_H,
          marginTop: 30,
          borderRadius: 28,
          borderWidth: 2,
          borderStyle: "solid",
          borderColor: theme.pitchBorder,
          backgroundColor: theme.pitchBg,
        }}
      >
        <PitchLines color={theme.pitchLine} />
        {squad.starters.map((player) => (
          <PitchChip
            key={player.login}
            player={player}
            theme={theme}
            isCaptain={player.login === squad.captain.login}
            isMvp={player.login === squad.mvp.login}
            avatarDataUri={avatarMap.get(player.avatarUrl) ?? null}
          />
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginTop: "auto",
          paddingBottom: 40,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori (ImageResponse) only renders native <img>. */}
        <img src={logoDataUri} width={22} height={22} alt="" style={{ borderRadius: 5 }} />
        <div style={{ display: "flex", fontSize: 18, color: theme.muted, marginLeft: 10 }}>
          {siteHost}/squad/{owner}/{repo}
        </div>
      </div>
    </div>
  );
}

async function renderLandscape(
  owner: string,
  repo: string,
  theme: SquadTheme,
  siteHost: string,
  logoDataUri: string
) {
  const squad = await getRepoSquad(owner, repo);
  const playerCount = squad.starters.length + squad.bench.length;
  const avatarMap = await fetchAvatarsBatch(
    squad.starters.map((p) => p.avatarUrl),
    AVATAR_SIZE
  );

  return (
    <div
      style={{
        width: LANDSCAPE_SIZE.width,
        height: LANDSCAPE_SIZE.height,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.background,
        backgroundImage: theme.backgroundImage,
        fontFamily: "Archivo",
        padding: 56,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", width: 360, flexShrink: 0, height: "100%" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- Satori (ImageResponse) only renders native <img>. */}
          <img src={logoDataUri} width={40} height={40} alt="" style={{ borderRadius: 10 }} />
          <div
            style={{
              display: "flex",
              fontFamily: "Barlow Condensed",
              fontSize: 16,
              color: theme.muted,
              textTransform: "uppercase",
              letterSpacing: 3,
              marginLeft: 12,
            }}
          >
            Repo Squad
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "Archivo Black",
            fontSize: 30,
            color: theme.foreground,
            marginTop: 14,
            maxWidth: 360,
          }}
        >
          {owner}/{repo}
        </div>
        <div style={{ display: "flex", fontFamily: "Archivo Black", fontSize: 56, color: theme.accent, marginTop: 20 }}>
          {squad.totalValueFormatted}
        </div>
        <div style={{ display: "flex", fontSize: 18, color: theme.muted, marginTop: 4 }}>
          {playerCount} players · squad value
        </div>
        <div style={{ display: "flex", fontSize: 16, color: theme.muted, marginTop: "auto" }}>
          {siteHost}/squad/{owner}/{repo}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignContent: "center",
          flex: 1,
          height: "100%",
          marginLeft: 48,
          gap: 14,
        }}
      >
        {squad.starters.map((player) => {
          const isCaptain = player.login === squad.captain.login;
          const isMvp = player.login === squad.mvp.login;
          const avatarDataUri = avatarMap.get(player.avatarUrl) ?? null;
          return (
            <div
              key={player.login}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 92 }}
            >
              <div style={{ display: "flex", position: "relative" }}>
                {avatarDataUri ? (
                  // eslint-disable-next-line @next/next/no-img-element -- Satori (ImageResponse) only renders native <img>.
                  <img
                    src={avatarDataUri}
                    width={72}
                    height={72}
                    alt=""
                    style={{
                      borderRadius: 36,
                      borderWidth: 3,
                      borderStyle: "solid",
                      borderColor: isMvp ? theme.gold : theme.accent,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      display: "flex",
                      width: 72,
                      height: 72,
                      borderRadius: 36,
                      backgroundColor: theme.chipBg,
                      borderWidth: 3,
                      borderStyle: "solid",
                      borderColor: isMvp ? theme.gold : theme.accent,
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "Archivo Black",
                      fontSize: 26,
                      color: theme.foreground,
                    }}
                  >
                    {player.login[0]?.toUpperCase()}
                  </div>
                )}
                {isCaptain && (
                  <div
                    style={{
                      display: "flex",
                      position: "absolute",
                      top: -4,
                      right: -4,
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: "#4d9fff",
                      color: "#060a12",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "Archivo Black",
                      fontSize: 11,
                    }}
                  >
                    C
                  </div>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  marginTop: 6,
                  fontFamily: "Archivo",
                  fontSize: 14,
                  color: theme.foreground,
                  width: 92,
                  textAlign: "center",
                  justifyContent: "center",
                }}
              >
                {truncateName(player.login, 11)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const { owner, repo } = await params;
  const { searchParams } = new URL(request.url);
  const format = parseFormat(searchParams.get("format"));
  const themeName = parseTheme(searchParams.get("theme"));
  const theme = SQUAD_THEMES[themeName];
  const size = format === "portrait" ? PORTRAIT_SIZE : LANDSCAPE_SIZE;

  const fonts = await loadOgFonts();
  const siteHost = getSiteHost();
  const logoDataUri = await loadOgLogoDataUri();

  try {
    const image =
      format === "portrait"
        ? await renderPortrait(owner, repo, theme, siteHost, logoDataUri)
        : await renderLandscape(owner, repo, theme, siteHost, logoDataUri);

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
