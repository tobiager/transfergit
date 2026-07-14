import { ImageResponse } from "next/og";
import { loadOgFonts } from "../../_shared/fonts";
import { loadOgPlayer } from "../../_shared/data";
import { OG_COLORS as C } from "../../_shared/theme";
import { OgTrendArrow } from "../../_shared/OgTrendArrow";
import { formatCardName } from "../../_shared/cardContent";
import { getSiteHost } from "@/lib/site-url";
import { percentileTier } from "@/lib/ranking";
import { computeMarketValueTrend } from "@/lib/format";
import { abbreviatePosition } from "@/lib/positions";
import { LanguageBadge } from "../../_shared/languageIcon";
import { FlagBadge, flagUrl } from "../../_shared/flagIcon";

export const runtime = "edge";

// 900x1200 (3:4): the same identity + 3-stat-grid anatomy as the 1:1 card,
// just narrower and taller — for slots that want a classic portrait crop.
const WIDTH = 900;
const HEIGHT = 1200;
const CACHE_CONTROL = "public, max-age=0, s-maxage=86400, stale-while-revalidate";

function NotFoundImage() {
  return (
    <div
      style={{
        width: WIDTH,
        height: HEIGHT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: C.pitch,
        color: C.foreground,
        fontFamily: "Archivo Black",
        fontSize: 32,
        textAlign: "center",
      }}
    >
      Player not found
    </div>
  );
}

function Divider() {
  return <div style={{ display: "flex", width: 1, height: 52, backgroundColor: C.border }} />;
}

export async function GET(_request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const fonts = await loadOgFonts();
  const player = await loadOgPlayer(username);

  if (!player) {
    return new ImageResponse(<NotFoundImage />, {
      width: WIDTH,
      height: HEIGHT,
      fonts,
      status: 404,
      headers: { "Cache-Control": "public, max-age=0, s-maxage=60" },
    });
  }

  const currentSeason = player.seasons[0];
  const tier = percentileTier({
    stars: player.trophies.stars,
    commits: currentSeason?.commits ?? 0,
    followers: player.trophies.followers,
  });
  const siteHost = getSiteHost();
  const trend = computeMarketValueTrend(player.marketValueHistory);
  const displayName = formatCardName(player.name, player.login);
  const hasFlag = Boolean(flagUrl(player.nationalityIso2));

  return new ImageResponse(
    (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: C.pitch,
          backgroundImage: "radial-gradient(circle at 50% -10%, rgba(0,230,118,0.12), transparent 55%)",
          padding: 48,
          position: "relative",
          fontFamily: "Archivo",
          borderWidth: 3,
          borderStyle: "solid",
          borderColor: "rgba(0,230,118,0.45)",
          boxShadow: "0 0 80px rgba(0,230,118,0.25)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontFamily: "Barlow Condensed",
              fontSize: 20,
              color: C.foreground,
              textTransform: "uppercase",
              letterSpacing: 3,
            }}
          >
            <div style={{ display: "flex", width: 9, height: 9, borderRadius: 5, backgroundColor: C.green, marginRight: 8 }} />
            Transfergit
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Archivo Black",
              fontSize: 18,
              color: C.green,
              borderWidth: 2,
              borderStyle: "solid",
              borderColor: C.green,
              borderRadius: 999,
              padding: "5px 16px",
              letterSpacing: 1,
            }}
          >
            {tier}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- Satori (ImageResponse) only renders native <img>, not next/image. */}
          <img
            src={player.avatarUrl}
            alt=""
            width={496}
            height={496}
            style={{
              borderRadius: 36,
              borderWidth: 3,
              borderStyle: "solid",
              borderColor: C.green,
              boxShadow: "0 0 44px rgba(0,230,118,0.35)",
            }}
          />

          <div
            style={{
              display: "flex",
              fontFamily: "Archivo Black",
              fontSize: 50,
              color: C.foreground,
              marginTop: 36,
              textAlign: "center",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {displayName}
          </div>
          {displayName !== `@${player.login}` && (
            <div style={{ display: "flex", fontSize: 26, color: C.green, marginTop: 10 }}>@{player.login}</div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          <div style={{ display: "flex", width: "100%", height: 1, backgroundColor: C.border }} />

          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              width: "100%",
              justifyContent: "space-around",
              marginTop: 36,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <LanguageBadge language={player.provider} size={52} />
              <div style={{ display: "flex", fontFamily: "Archivo Black", fontSize: 18, color: C.foreground, marginTop: 8, textTransform: "uppercase" }}>
                {player.provider}
              </div>
              <div style={{ display: "flex", fontSize: 13, color: C.muted, textTransform: "uppercase", letterSpacing: 2, marginTop: 4 }}>
                Stack
              </div>
            </div>

            <Divider />

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <FlagBadge iso2={player.nationalityIso2} size={32} />
              <div
                style={{
                  display: "flex",
                  fontFamily: "Archivo Black",
                  fontSize: 36,
                  color: C.foreground,
                  marginTop: hasFlag ? 8 : 0,
                }}
              >
                {abbreviatePosition(player.position.main)}
              </div>
              <div style={{ display: "flex", fontSize: 13, color: C.muted, textTransform: "uppercase", letterSpacing: 2, marginTop: 4 }}>
                Position
              </div>
            </div>

            <Divider />

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                <div style={{ display: "flex", fontFamily: "Archivo Black", fontSize: 38, color: C.green }}>
                  {player.marketValueFormatted}
                </div>
                {trend && trend.direction !== "flat" && (
                  <div style={{ display: "flex", marginLeft: 6 }}>
                    <OgTrendArrow direction={trend.direction} size={20} color={trend.direction === "up" ? C.green : C.red} />
                  </div>
                )}
              </div>
              <div style={{ display: "flex", fontSize: 13, color: C.muted, textTransform: "uppercase", letterSpacing: 2, marginTop: 4 }}>
                Value
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 18, color: C.muted }}>
          {siteHost}/{player.login}
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT, fonts, headers: { "Cache-Control": CACHE_CONTROL } }
  );
}
