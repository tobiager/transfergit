import { ImageResponse } from "next/og";
import { loadOgFonts } from "../_shared/fonts";
import { loadOgPlayer } from "../_shared/data";
import { buildSparklinePaths } from "../_shared/sparkline";
import { OG_COLORS as C } from "../_shared/theme";

export const runtime = "edge";

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
      Jugador no encontrado
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
  const stats = player.ratings.slice(0, 4);

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
            {/* eslint-disable-next-line @next/next/no-img-element -- Satori (ImageResponse) sólo renderiza <img> nativo, no next/image. */}
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
                    fontSize: 22,
                    textTransform: "uppercase",
                    letterSpacing: 2,
                    padding: "6px 18px",
                    borderRadius: 6,
                  }}
                >
                  {player.position.main}
                </div>
                <div style={{ display: "flex", fontSize: 30, marginLeft: 16 }}>{player.nationalityFlag}</div>
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
              Valor de mercado
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
          {stats.map((stat) => (
            <div key={stat.key} style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  fontFamily: "Barlow Condensed",
                  fontSize: 18,
                  color: C.muted,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                }}
              >
                {stat.label}
              </div>
              <div style={{ display: "flex", fontFamily: "Archivo Black", fontSize: 34, color: C.foreground, marginTop: 6 }}>
                {stat.score}
              </div>
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
          transfergit.com/{player.login}
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT, fonts, headers: { "Cache-Control": CACHE_CONTROL } }
  );
}
