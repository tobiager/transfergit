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

// 1200x1200 (1:1): the minimal "player card" — dense top-to-bottom like the
// reference (avatar, name, identity divider, 3-stat grid), sized to the
// content instead of a tall canvas with a flex spacer soaking up dead space.
const WIDTH = 1200;
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
        fontSize: 40,
        textAlign: "center",
      }}
    >
      Player not found
    </div>
  );
}

function Divider() {
  return <div style={{ display: "flex", width: 1, height: 64, backgroundColor: C.border }} />;
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
          backgroundColor: C.pitch,
          backgroundImage: "radial-gradient(circle at 50% -10%, rgba(0,230,118,0.12), transparent 55%)",
          padding: 64,
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
              fontSize: 24,
              color: C.foreground,
              textTransform: "uppercase",
              letterSpacing: 4,
            }}
          >
            <div style={{ display: "flex", width: 10, height: 10, borderRadius: 5, backgroundColor: C.green, marginRight: 10 }} />
            Transfergit
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Archivo Black",
              fontSize: 22,
              color: C.green,
              borderWidth: 2,
              borderStyle: "solid",
              borderColor: C.green,
              borderRadius: 999,
              padding: "6px 20px",
              letterSpacing: 1,
            }}
          >
            {tier}
          </div>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element -- Satori (ImageResponse) only renders native <img>, not next/image. */}
        <img
          src={player.avatarUrl}
          alt=""
          width={560}
          height={560}
          style={{
            marginTop: 48,
            borderRadius: 44,
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
            fontSize: 60,
            color: C.foreground,
            marginTop: 36,
            textAlign: "center",
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          {displayName}
        </div>
        {displayName !== `@${player.login}` && (
          <div style={{ display: "flex", fontSize: 30, color: C.green, marginTop: 10 }}>@{player.login}</div>
        )}

        <div style={{ display: "flex", width: "100%", height: 1, backgroundColor: C.border, marginTop: 28 }} />

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            width: "100%",
            justifyContent: "space-around",
            marginTop: 32,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <LanguageBadge language={player.provider} size={64} />
            <div style={{ display: "flex", fontFamily: "Archivo Black", fontSize: 22, color: C.foreground, marginTop: 10, textTransform: "uppercase" }}>
              {player.provider}
            </div>
            <div style={{ display: "flex", fontSize: 15, color: C.muted, textTransform: "uppercase", letterSpacing: 2, marginTop: 4 }}>
              Stack
            </div>
          </div>

          <Divider />

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <FlagBadge iso2={player.nationalityIso2} size={40} />
            <div
              style={{
                display: "flex",
                fontFamily: "Archivo Black",
                fontSize: 44,
                color: C.foreground,
                marginTop: hasFlag ? 10 : 0,
              }}
            >
              {abbreviatePosition(player.position.main)}
            </div>
            <div style={{ display: "flex", fontSize: 15, color: C.muted, textTransform: "uppercase", letterSpacing: 2, marginTop: 4 }}>
              Position
            </div>
          </div>

          <Divider />

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
              <div style={{ display: "flex", fontFamily: "Archivo Black", fontSize: 48, color: C.green }}>
                {player.marketValueFormatted}
              </div>
              {trend && trend.direction !== "flat" && (
                <div style={{ display: "flex", marginLeft: 8 }}>
                  <OgTrendArrow direction={trend.direction} size={24} color={trend.direction === "up" ? C.green : C.red} />
                </div>
              )}
            </div>
            <div style={{ display: "flex", fontSize: 15, color: C.muted, textTransform: "uppercase", letterSpacing: 2, marginTop: 4 }}>
              Value
            </div>
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 20, color: C.muted, marginTop: 56 }}>
          {siteHost}/{player.login}
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT, fonts, headers: { "Cache-Control": CACHE_CONTROL } }
  );
}
