import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { loadOgPlayer } from "../../_shared/data";
import { OG_COLORS as C } from "../../_shared/theme";
import { OgTrendArrow } from "../../_shared/OgTrendArrow";
import { formatCardName } from "../../_shared/cardContent";
import { getSiteHost } from "@/lib/site-url";
import { percentileTier } from "@/lib/ranking";
import { computeMarketValueTrend } from "@/lib/format";
import { abbreviatePosition } from "@/lib/positions";
import { evaluateAchievements, topTrophies } from "@/lib/achievements";
import { LanguageBadge } from "../../_shared/languageIcon";
import { FlagBadge, flagUrl } from "../../_shared/flagIcon";

// 1080x1920 (9:16): the same minimal card anatomy as the 3:4, just more
// vertical air and the value made the hero — the "story" format for
// phone-screen shares.
const WIDTH = 1080;
const HEIGHT = 1920;
const CACHE_CONTROL = "public, max-age=0, s-maxage=86400, stale-while-revalidate";

interface OgFontBuffer {
  name: string;
  data: Buffer;
  weight: 400 | 600 | 700;
  style: "normal";
}

// This route runs on the Node.js runtime (see the deploy-size note below), so
// unlike the other og routes it can't rely on `fetch(new URL(...))` to pull
// font buffers — that only resolves through webpack's asset URLs under Edge.
// Node reads the .ttf files straight off disk instead.
async function loadOgFonts(): Promise<OgFontBuffer[]> {
  const fontsDir = join(process.cwd(), "assets", "fonts");
  const [archivoRegular, archivoSemiBold, archivoBold, archivoBlack, barlowCondensedSemiBold] =
    await Promise.all([
      readFile(join(fontsDir, "Archivo-Regular.ttf")),
      readFile(join(fontsDir, "Archivo-SemiBold.ttf")),
      readFile(join(fontsDir, "Archivo-Bold.ttf")),
      readFile(join(fontsDir, "ArchivoBlack-Regular.ttf")),
      readFile(join(fontsDir, "BarlowCondensed-SemiBold.ttf")),
    ]);

  return [
    { name: "Archivo", data: archivoRegular, weight: 400, style: "normal" },
    { name: "Archivo", data: archivoSemiBold, weight: 600, style: "normal" },
    { name: "Archivo", data: archivoBold, weight: 700, style: "normal" },
    { name: "Archivo Black", data: archivoBlack, weight: 400, style: "normal" },
    { name: "Barlow Condensed", data: barlowCondensedSemiBold, weight: 600, style: "normal" },
  ];
}

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
  return <div style={{ display: "flex", width: 1, height: 56, backgroundColor: C.border }} />;
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
  const top3 = topTrophies(evaluateAchievements(player), 3);

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
          backgroundImage: "radial-gradient(circle at 50% -10%, rgba(0,230,118,0.14), transparent 55%)",
          padding: 96,
          fontFamily: "Archivo",
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontFamily: "Barlow Condensed",
              fontSize: 30,
              color: C.foreground,
              textTransform: "uppercase",
              letterSpacing: 4,
            }}
          >
            <div style={{ display: "flex", width: 14, height: 14, borderRadius: 7, backgroundColor: C.green, marginRight: 14 }} />
            Transfergit
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Archivo Black",
              fontSize: 26,
              color: C.green,
              borderWidth: 2,
              borderStyle: "solid",
              borderColor: C.green,
              borderRadius: 999,
              padding: "8px 22px",
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
            width={440}
            height={440}
            style={{ borderRadius: 40, borderWidth: 3, borderStyle: "solid", borderColor: C.border }}
          />

          <div
            style={{
              display: "flex",
              fontFamily: "Archivo Black",
              fontSize: 72,
              color: C.foreground,
              marginTop: 48,
              textAlign: "center",
              textTransform: "uppercase",
            }}
          >
            {displayName}
          </div>
          {displayName !== `@${player.login}` && (
            <div style={{ display: "flex", fontSize: 32, color: C.green, marginTop: 12 }}>@{player.login}</div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Archivo Black",
              fontSize: 132,
              color: C.green,
              textAlign: "center",
            }}
          >
            {player.marketValueFormatted}
          </div>
          {trend && trend.direction !== "flat" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: 34,
                fontWeight: 700,
                marginTop: 8,
                color: trend.direction === "up" ? C.green : C.red,
              }}
            >
              <OgTrendArrow direction={trend.direction} size={26} color={trend.direction === "up" ? C.green : C.red} />
              <div style={{ display: "flex", marginLeft: 8 }}>{Math.abs(trend.pct).toFixed(1)}%</div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "row", gap: 12 }}>
          {top3.length === 0 ? (
            <div style={{ display: "flex", fontSize: 20, color: C.muted }}>No honours yet</div>
          ) : (
            top3.map((r) => (
              <div
                key={r.achievement.id}
                style={{
                  display: "flex",
                  fontSize: 20,
                  color: C.gold,
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: "rgba(255,196,0,0.35)",
                  backgroundColor: "rgba(255,196,0,0.06)",
                  borderRadius: 10,
                  padding: "10px 20px",
                }}
              >
                {r.achievement.name}
              </div>
            ))
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", width: "100%", justifyContent: "space-around" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <LanguageBadge language={player.provider} size={56} />
            <div style={{ display: "flex", fontFamily: "Archivo Black", fontSize: 24, color: C.foreground, marginTop: 8, textTransform: "uppercase" }}>
              {player.provider}
            </div>
            <div style={{ display: "flex", fontSize: 17, color: C.muted, textTransform: "uppercase", letterSpacing: 2, marginTop: 4 }}>
              Stack
            </div>
          </div>

          <Divider />

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <FlagBadge iso2={player.nationalityIso2} size={36} />
            <div
              style={{
                display: "flex",
                fontFamily: "Archivo Black",
                fontSize: 38,
                color: C.foreground,
                marginTop: hasFlag ? 8 : 0,
              }}
            >
              {abbreviatePosition(player.position.main)}
            </div>
            <div style={{ display: "flex", fontSize: 17, color: C.muted, textTransform: "uppercase", letterSpacing: 2, marginTop: 4 }}>
              Position
            </div>
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 24, color: C.muted, marginTop: 40 }}>
          {siteHost}/{player.login}
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT, fonts, headers: { "Cache-Control": CACHE_CONTROL } }
  );
}
