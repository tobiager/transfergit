import { ImageResponse } from "next/og";
import { loadOgFonts } from "../../_shared/fonts";
import { loadOgPlayer } from "../../_shared/data";
import { buildSparklinePaths } from "../../_shared/sparkline";
import { OG_COLORS as C } from "../../_shared/theme";
import { topUnlockedTrophies } from "../../_shared/trophies";
import { TrophySilhouette } from "../../_shared/TrophySilhouette";

export const runtime = "edge";

// 900x1200: the collectible card for stories/vertical posts.
const WIDTH = 900;
const HEIGHT = 1200;
const CACHE_CONTROL = "public, max-age=0, s-maxage=86400, stale-while-revalidate";
const KEY_STAT_KEYS = ["pace", "finishing", "stamina"];

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

  const keyStats = KEY_STAT_KEYS.map((key) => player.ratings.find((r) => r.key === key)).filter(
    (r): r is (typeof player.ratings)[number] => Boolean(r)
  );
  const sparkline = buildSparklinePaths(player.marketValueHistory, 260, 60);
  const trophies = topUnlockedTrophies(player, 3);

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

        {/* eslint-disable-next-line @next/next/no-img-element -- Satori (ImageResponse) only renders native <img>, not next/image. */}
        <img
          src={player.avatarUrl}
          alt=""
          width={260}
          height={260}
          style={{
            marginTop: 36,
            borderRadius: 26,
            borderWidth: 3,
            borderStyle: "solid",
            borderColor: C.border,
          }}
        />

        <div
          style={{
            display: "flex",
            fontFamily: "Archivo Black",
            fontSize: 46,
            color: C.foreground,
            marginTop: 28,
            textAlign: "center",
          }}
        >
          {player.name}
        </div>
        <div style={{ display: "flex", fontSize: 22, color: C.blueBright, marginTop: 6 }}>@{player.login}</div>

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
              padding: "7px 22px",
              borderRadius: 8,
            }}
          >
            {player.position.main}
          </div>
          <div style={{ display: "flex", fontSize: 20, color: C.muted, marginLeft: 14 }}>{player.currentClub}</div>
        </div>

        <div style={{ display: "flex", flex: 1 }} />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
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
          <div style={{ display: "flex", fontFamily: "Archivo Black", fontSize: 66, color: "#ffffff", marginTop: 8 }}>
            {player.marketValueFormatted}
          </div>
          <svg width={260} height={60} style={{ marginTop: 6 }}>
            <path d={sparkline.area} fill="rgba(0,200,83,0.22)" />
            <path d={sparkline.line} stroke={C.green} strokeWidth={3} fill="none" />
          </svg>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            width: "100%",
            marginTop: 28,
            borderTopWidth: 1,
            borderTopStyle: "solid",
            borderTopColor: C.border,
            paddingTop: 24,
            justifyContent: "space-between",
          }}
        >
          {keyStats.map((stat) => (
            <div key={stat.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  fontFamily: "Barlow Condensed",
                  fontSize: 16,
                  color: C.muted,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                }}
              >
                {stat.label}
              </div>
              <div style={{ display: "flex", fontFamily: "Archivo Black", fontSize: 34, color: C.foreground, marginTop: 4 }}>
                {stat.score}
              </div>
            </div>
          ))}
        </div>

        {trophies.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              width: "100%",
              marginTop: 20,
              paddingTop: 20,
              borderTopWidth: 1,
              borderTopStyle: "solid",
              borderTopColor: C.border,
              justifyContent: "center",
            }}
          >
            {trophies.map((trophy) => (
              <div
                key={trophy.id}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", marginLeft: 18, marginRight: 18 }}
              >
                <TrophySilhouette tier={trophy.tier} size={30} />
              </div>
            ))}
          </div>
        )}
      </div>
    ),
    { width: WIDTH, height: HEIGHT, fonts, headers: { "Cache-Control": CACHE_CONTROL } }
  );
}
