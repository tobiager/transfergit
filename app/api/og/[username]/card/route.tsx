import { ImageResponse } from "next/og";
import { loadOgFonts } from "../../_shared/fonts";
import { loadOgPlayer } from "../../_shared/data";
import { OG_COLORS as C } from "../../_shared/theme";

export const runtime = "edge";

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
        fontSize: 40,
        textAlign: "center",
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

  const stats = player.ratings.slice(0, 3);

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
          backgroundImage: `radial-gradient(circle at 50% -10%, ${C.pitchElevated}, transparent 60%)`,
          padding: 64,
          position: "relative",
          fontFamily: "Archivo",
          borderWidth: 3,
          borderStyle: "solid",
          borderColor: "rgba(255,196,0,0.35)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Barlow Condensed",
              fontSize: 24,
              color: C.blueBright,
              textTransform: "uppercase",
              letterSpacing: 4,
            }}
          >
            Transfergit
          </div>
          <div style={{ display: "flex", fontSize: 30 }}>{player.nationalityFlag}</div>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element -- Satori (ImageResponse) sólo renderiza <img> nativo, no next/image. */}
        <img
          src={player.avatarUrl}
          alt=""
          width={280}
          height={280}
          style={{
            marginTop: 48,
            borderRadius: 28,
            borderWidth: 3,
            borderStyle: "solid",
            borderColor: C.border,
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
          }}
        >
          {player.name}
        </div>
        <div style={{ display: "flex", fontSize: 24, color: C.blueBright, marginTop: 6 }}>@{player.login}</div>

        <div
          style={{
            display: "flex",
            backgroundColor: C.navy,
            color: "#ffffff",
            fontFamily: "Barlow Condensed",
            fontSize: 24,
            textTransform: "uppercase",
            letterSpacing: 2,
            padding: "8px 26px",
            borderRadius: 8,
            marginTop: 22,
          }}
        >
          {player.position.main}
        </div>

        <div style={{ display: "flex", flex: 1 }} />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Barlow Condensed",
              fontSize: 22,
              color: C.blueBright,
              textTransform: "uppercase",
              letterSpacing: 3,
            }}
          >
            Valor de mercado
          </div>
          <div style={{ display: "flex", fontFamily: "Archivo Black", fontSize: 76, color: "#ffffff", marginTop: 10 }}>
            {player.marketValueFormatted}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            width: "100%",
            marginTop: 44,
            borderTopWidth: 1,
            borderTopStyle: "solid",
            borderTopColor: C.border,
            paddingTop: 32,
            justifyContent: "space-between",
          }}
        >
          {stats.map((stat) => (
            <div key={stat.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
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
              <div style={{ display: "flex", fontFamily: "Archivo Black", fontSize: 38, color: C.foreground, marginTop: 6 }}>
                {stat.score}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT, fonts, headers: { "Cache-Control": CACHE_CONTROL } }
  );
}
