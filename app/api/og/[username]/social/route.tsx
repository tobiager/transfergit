import { ImageResponse } from "next/og";
import { loadOgFonts } from "../../_shared/fonts";
import { loadOgPlayer } from "../../_shared/data";
import { buildSparklinePaths } from "../../_shared/sparkline";
import { OG_COLORS as C } from "../../_shared/theme";
import { topUnlockedTrophies } from "../../_shared/trophies";
import { TrophySilhouette } from "../../_shared/TrophySilhouette";
import { OgFlag } from "../../_shared/OgFlag";

export const runtime = "edge";

// 1200x630: the only variant used for OG/Twitter meta tags — social
// platforms crop vertical images badly, so this is the horizontal one.
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

  const sparkline = buildSparklinePaths(player.marketValueHistory, 280, 72);
  const trophies = topUnlockedTrophies(player, 3);

  return new ImageResponse(
    (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: "flex",
          flexDirection: "column",
          backgroundColor: C.pitch,
          backgroundImage: `radial-gradient(circle at 12% -10%, ${C.pitchElevated}, transparent 55%)`,
          padding: 56,
          position: "relative",
          fontFamily: "Archivo",
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", width: "100%", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", width: 610 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- Satori (ImageResponse) only renders native <img>, not next/image. */}
            <img
              src={player.avatarUrl}
              alt=""
              width={140}
              height={140}
              style={{ borderRadius: 20, borderWidth: 2, borderStyle: "solid", borderColor: C.border, flexShrink: 0 }}
            />
            <div style={{ display: "flex", flexDirection: "column", marginLeft: 32, width: 438 }}>
              <div style={{ display: "flex", fontFamily: "Archivo Black", fontSize: 48, color: C.foreground, lineHeight: 1.1 }}>
                {player.name}
              </div>
              <div style={{ display: "flex", fontSize: 24, color: C.blueBright, marginTop: 10 }}>
                @{player.login}
              </div>
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center", marginTop: 18 }}>
                <div
                  style={{
                    display: "flex",
                    backgroundColor: C.navy,
                    color: "#ffffff",
                    fontFamily: "Barlow Condensed",
                    fontSize: 18,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    padding: "6px 16px",
                    borderRadius: 6,
                  }}
                >
                  {player.position.main}
                </div>
                <div style={{ display: "flex", marginLeft: 16 }}>
                  <OgFlag iso2={player.nationalityIso2} size={30} />
                </div>
                <div style={{ display: "flex", fontSize: 22, color: C.muted, marginLeft: 12 }}>
                  {player.currentClub}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", width: 420 }}>
            <div
              style={{
                display: "flex",
                fontFamily: "Barlow Condensed",
                fontSize: 20,
                color: C.blueBright,
                textTransform: "uppercase",
                letterSpacing: 3,
              }}
            >
              Market Value
            </div>
            <div
              style={{
                display: "flex",
                fontFamily: "Archivo Black",
                fontSize: 52,
                color: "#ffffff",
                marginTop: 4,
                textAlign: "right",
              }}
            >
              {player.marketValueFormatted}
            </div>
            <svg width={280} height={72} style={{ marginTop: 8 }}>
              <path d={sparkline.area} fill="rgba(0,200,83,0.22)" />
              <path d={sparkline.line} stroke={C.green} strokeWidth={4} fill="none" />
            </svg>
          </div>
        </div>

        <div style={{ display: "flex", flex: 1 }} />

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            width: "100%",
            borderTopWidth: 1,
            borderTopStyle: "solid",
            borderTopColor: C.border,
            paddingTop: 28,
          }}
        >
          {trophies.map((trophy) => (
            <div key={trophy.id} style={{ display: "flex", flexDirection: "row", alignItems: "center", flex: 1 }}>
              <TrophySilhouette id={trophy.id} size={30} />
              <div style={{ display: "flex", fontSize: 16, color: C.muted, marginLeft: 10 }}>{trophy.name}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 24,
            right: 56,
            display: "flex",
            fontSize: 18,
            color: C.muted,
          }}
        >
          transfergit.app/{player.login}
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT, fonts, headers: { "Cache-Control": CACHE_CONTROL } }
  );
}
