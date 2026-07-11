import { ImageResponse } from "next/og";
import { loadOgFonts } from "../../_shared/fonts";
import { loadOgPlayer } from "../../_shared/data";
import { OG_COLORS as C } from "../../_shared/theme";
import { OgTrendArrow } from "../../_shared/OgTrendArrow";
import { formatCardName } from "../../_shared/cardContent";
import { getSiteHost } from "@/lib/site-url";
import { rankAgainstReference } from "@/lib/ranking";
import { computeMarketValueTrend, formatCompactNumber } from "@/lib/format";
import { abbreviatePosition } from "@/lib/positions";

export const runtime = "edge";

// 1200x630 (16:9): the "banner" format — photo left, name + stats center,
// value right — and the only variant wired into OG/Twitter meta tags
// (social platforms crop vertical images badly).
const WIDTH = 1200;
const HEIGHT = 630;
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
        fontSize: 40,
      }}
    >
      Player not found
    </div>
  );
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

  const rank = rankAgainstReference(player.login, player.marketValue).rank;
  const siteHost = getSiteHost();
  const trend = computeMarketValueTrend(player.marketValueHistory);
  const displayName = formatCardName(player.name, player.login);
  const countryCode = player.nationalityIso2 ? player.nationalityIso2.toUpperCase() : "??";

  return new ImageResponse(
    (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: C.pitch,
          backgroundImage: "radial-gradient(circle at 12% -10%, rgba(0,230,118,0.14), transparent 55%)",
          padding: 64,
          position: "relative",
          fontFamily: "Archivo",
          borderWidth: 2,
          borderStyle: "solid",
          borderColor: "rgba(0,230,118,0.35)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori (ImageResponse) only renders native <img>, not next/image. */}
        <img
          src={player.avatarUrl}
          alt=""
          width={220}
          height={220}
          style={{ borderRadius: 28, borderWidth: 3, borderStyle: "solid", borderColor: C.border, flexShrink: 0 }}
        />

        <div style={{ display: "flex", flexDirection: "column", marginLeft: 48, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                fontFamily: "Archivo Black",
                fontSize: 48,
                color: C.foreground,
                textTransform: "uppercase",
              }}
            >
              {displayName}
            </div>
            <div
              style={{
                display: "flex",
                fontFamily: "Archivo Black",
                fontSize: 16,
                color: C.green,
                borderWidth: 2,
                borderStyle: "solid",
                borderColor: C.green,
                borderRadius: 999,
                padding: "3px 14px",
                marginLeft: 16,
              }}
            >
              #{rank}
            </div>
          </div>
          {displayName !== `@${player.login}` && (
            <div style={{ display: "flex", fontSize: 24, color: C.green, marginTop: 8 }}>@{player.login}</div>
          )}
          <div style={{ display: "flex", alignItems: "center", marginTop: 14 }}>
            <div style={{ display: "flex", fontFamily: "Archivo Black", fontSize: 22, color: C.foreground }}>
              {formatCompactNumber(player.trophies.followers)}
            </div>
            <div style={{ display: "flex", fontSize: 18, color: C.muted, marginLeft: 6 }}>followers</div>
            <div style={{ display: "flex", fontSize: 20, color: C.border, marginLeft: 16, marginRight: 16 }}>|</div>
            <div style={{ display: "flex", fontFamily: "Archivo Black", fontSize: 22, color: C.foreground }}>
              {countryCode}·{abbreviatePosition(player.position.main)}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Barlow Condensed",
              fontSize: 18,
              color: C.muted,
              textTransform: "uppercase",
              letterSpacing: 3,
            }}
          >
            Value
          </div>
          <div style={{ display: "flex", alignItems: "baseline", marginTop: 4 }}>
            <div style={{ display: "flex", fontFamily: "Archivo Black", fontSize: 56, color: C.green }}>
              {player.marketValueFormatted}
            </div>
            {trend && trend.direction !== "flat" && (
              <div style={{ display: "flex", marginLeft: 10 }}>
                <OgTrendArrow direction={trend.direction} size={20} color={trend.direction === "up" ? C.green : C.red} />
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 24,
            right: 64,
            display: "flex",
            fontSize: 16,
            color: C.muted,
          }}
        >
          {siteHost}/{player.login}
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT, fonts, headers: { "Cache-Control": CACHE_CONTROL } }
  );
}
