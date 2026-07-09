import { ImageResponse } from "next/og";
import { loadOgFonts } from "../_shared/fonts";
import { loadOgPlayer } from "../_shared/data";
import { buildChartGeometry } from "../_shared/sparkline";
import { OG_COLORS as C } from "../_shared/theme";
import { topUnlockedTrophies } from "../_shared/trophies";
import { TrophySilhouette } from "../_shared/TrophySilhouette";
import { formatNumber, computeMarketValueTrend } from "@/lib/format";

export const runtime = "edge";

// 1200x1300: the dense, README-sized card copied by "Copy Markdown".
const WIDTH = 1200;
const HEIGHT = 1300;
const CACHE_CONTROL = "public, max-age=0, s-maxage=86400, stale-while-revalidate";
const CHART_WIDTH = 1088;
const CHART_HEIGHT = 220;

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

function SectionTitle({ children }: { children: string }) {
  return (
    <div
      style={{
        display: "flex",
        fontFamily: "Barlow Condensed",
        fontSize: 20,
        color: C.foreground,
        textTransform: "uppercase",
        letterSpacing: 3,
      }}
    >
      {children}
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

  const trend = computeMarketValueTrend(player.marketValueHistory);
  const trophies = topUnlockedTrophies(player, 6);
  const chart = buildChartGeometry(player.marketValueHistory, CHART_WIDTH, CHART_HEIGHT, 16);
  const seasons = player.seasons.slice(0, 6);
  const totals = player.seasons.reduce(
    (acc, s) => ({
      activeDays: acc.activeDays + s.activeDays,
      commits: acc.commits + s.commits,
      pullRequests: acc.pullRequests + s.pullRequests,
      issues: acc.issues + s.issues,
      totalContributions: acc.totalContributions + s.totalContributions,
    }),
    { activeDays: 0, commits: 0, pullRequests: 0, issues: 0, totalContributions: 0 }
  );

  const columnStyle = { display: "flex", flex: 1, justifyContent: "flex-end" as const, fontSize: 18 };

  return new ImageResponse(
    (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: "flex",
          flexDirection: "column",
          backgroundColor: C.pitch,
          backgroundImage: `radial-gradient(circle at 15% -10%, ${C.pitchElevated}, transparent 55%)`,
          padding: 56,
          fontFamily: "Archivo",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- Satori (ImageResponse) only renders native <img>, not next/image. */}
            <img
              src={player.avatarUrl}
              alt=""
              width={120}
              height={120}
              style={{ borderRadius: 18, borderWidth: 2, borderStyle: "solid", borderColor: C.border }}
            />
            <div style={{ display: "flex", flexDirection: "column", marginLeft: 28 }}>
              <div style={{ display: "flex", fontFamily: "Archivo Black", fontSize: 42, color: C.foreground, lineHeight: 1.1 }}>
                {player.name}
              </div>
              <div style={{ display: "flex", fontSize: 20, color: C.blueBright, marginTop: 6 }}>@{player.login}</div>
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center", marginTop: 14 }}>
                <div
                  style={{
                    display: "flex",
                    backgroundColor: C.navy,
                    color: "#ffffff",
                    fontFamily: "Barlow Condensed",
                    fontSize: 18,
                    textTransform: "uppercase",
                    letterSpacing: 2,
                    padding: "5px 16px",
                    borderRadius: 6,
                  }}
                >
                  {player.position.main}
                </div>
                <div style={{ display: "flex", fontSize: 24, marginLeft: 14 }}>{player.nationalityFlag}</div>
                {player.currentClubAvatar && (
                  // eslint-disable-next-line @next/next/no-img-element -- Satori (ImageResponse) only renders native <img>, not next/image.
                  <img
                    src={player.currentClubAvatar}
                    alt=""
                    width={22}
                    height={22}
                    style={{ borderRadius: 4, marginLeft: 14 }}
                  />
                )}
                <div style={{ display: "flex", fontSize: 18, color: C.muted, marginLeft: 8 }}>{player.currentClub}</div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div
              style={{
                display: "flex",
                fontFamily: "Barlow Condensed",
                fontSize: 18,
                color: C.blueBright,
                textTransform: "uppercase",
                letterSpacing: 3,
              }}
            >
              Market Value
            </div>
            <div style={{ display: "flex", flexDirection: "row", alignItems: "baseline", marginTop: 4 }}>
              <div style={{ display: "flex", fontFamily: "Archivo Black", fontSize: 48, color: "#ffffff" }}>
                {player.marketValueFormatted}
              </div>
              {trend && trend.direction !== "flat" && (
                <div
                  style={{
                    display: "flex",
                    fontSize: 18,
                    fontWeight: 700,
                    marginLeft: 12,
                    color: trend.direction === "up" ? C.green : "#e5484d",
                  }}
                >
                  {trend.direction === "up" ? "▲" : "▼"} {Math.abs(trend.pct).toFixed(0)}%
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Trophy row */}
        {trophies.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              width: "100%",
              marginTop: 32,
              paddingTop: 24,
              borderTopWidth: 1,
              borderTopStyle: "solid",
              borderTopColor: C.border,
            }}
          >
            {trophies.map((trophy) => (
              <div
                key={trophy.id}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}
              >
                <TrophySilhouette tier={trophy.tier} size={38} />
                <div
                  style={{
                    display: "flex",
                    fontSize: 12,
                    color: C.muted,
                    marginTop: 6,
                    textAlign: "center",
                  }}
                >
                  {trophy.name}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Market value evolution */}
        <div style={{ display: "flex", flexDirection: "column", width: "100%", marginTop: 32 }}>
          <SectionTitle>Market Value Evolution</SectionTitle>
          <svg width={CHART_WIDTH} height={CHART_HEIGHT} style={{ marginTop: 10 }}>
            <path d={chart.area} fill="rgba(62,166,255,0.16)" />
            <path d={chart.line} stroke={C.blueBright} strokeWidth={4} fill="none" />
            {chart.points.map((p, i) =>
              i === chart.recordIndex ? (
                <circle key={i} cx={p.x} cy={p.y} r={7} fill={C.gold} />
              ) : (
                <circle key={i} cx={p.x} cy={p.y} r={3} fill={C.blueBright} />
              )
            )}
          </svg>
        </div>

        {/* Scouting metrics */}
        <div style={{ display: "flex", flexDirection: "column", width: "100%", marginTop: 32 }}>
          <SectionTitle>Scouting Metrics</SectionTitle>
          <div style={{ display: "flex", flexWrap: "wrap", width: "100%", marginTop: 10 }}>
            {player.ratings.map((rating) => (
              <div key={rating.key} style={{ display: "flex", flexDirection: "column", width: "50%", paddingRight: 24, marginTop: 16 }}>
                <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", fontSize: 18, color: C.foreground }}>{rating.label}</div>
                  <div style={{ display: "flex", fontFamily: "Archivo Black", fontSize: 22, color: C.blueBright }}>
                    {rating.score}
                  </div>
                </div>
                <div style={{ display: "flex", height: 8, width: "100%", backgroundColor: C.surfaceElevated, borderRadius: 4, marginTop: 6 }}>
                  <div
                    style={{
                      display: "flex",
                      height: 8,
                      width: `${rating.score}%`,
                      backgroundColor: C.blueBright,
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Season stats */}
        <div style={{ display: "flex", flexDirection: "column", width: "100%", marginTop: 32 }}>
          <SectionTitle>Season Stats</SectionTitle>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              marginTop: 10,
              borderRadius: 10,
              overflow: "hidden",
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: C.border,
            }}
          >
            <div style={{ display: "flex", flexDirection: "row", backgroundColor: C.surfaceElevated, padding: "10px 16px" }}>
              <div style={{ display: "flex", width: 100, fontSize: 13, color: C.muted, textTransform: "uppercase" }}>Season</div>
              <div style={{ ...columnStyle, fontSize: 13, color: C.muted, textTransform: "uppercase" }}>Apps</div>
              <div style={{ ...columnStyle, fontSize: 13, color: C.muted, textTransform: "uppercase" }}>Goals</div>
              <div style={{ ...columnStyle, fontSize: 13, color: C.muted, textTransform: "uppercase" }}>Assists</div>
              <div style={{ ...columnStyle, fontSize: 13, color: C.muted, textTransform: "uppercase" }}>YC</div>
              <div style={{ ...columnStyle, fontSize: 13, color: C.muted, textTransform: "uppercase" }}>Minutes</div>
            </div>
            {seasons.map((s, i) => (
              <div
                key={s.year}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  backgroundColor: i % 2 === 0 ? C.surface : C.surfaceElevated,
                  padding: "9px 16px",
                }}
              >
                <div style={{ display: "flex", width: 100, fontSize: 16, color: C.foreground }}>{s.year}</div>
                <div style={{ ...columnStyle, color: C.foreground }}>{s.hasData ? formatNumber(s.activeDays) : "—"}</div>
                <div style={{ ...columnStyle, color: C.green, fontWeight: 700 }}>
                  {s.hasData ? formatNumber(s.commits) : "—"}
                </div>
                <div style={{ ...columnStyle, color: C.foreground }}>{s.hasData ? formatNumber(s.pullRequests) : "—"}</div>
                <div style={{ ...columnStyle, color: C.foreground }}>{s.hasData ? formatNumber(s.issues) : "—"}</div>
                <div style={{ ...columnStyle, color: C.foreground }}>
                  {s.hasData ? formatNumber(s.totalContributions) : "—"}
                </div>
              </div>
            ))}
            <div style={{ display: "flex", flexDirection: "row", backgroundColor: C.navy, padding: "10px 16px" }}>
              <div style={{ display: "flex", width: 100, fontSize: 16, color: "#ffffff", fontWeight: 700 }}>Total</div>
              <div style={{ ...columnStyle, color: "#ffffff", fontWeight: 700 }}>{formatNumber(totals.activeDays)}</div>
              <div style={{ ...columnStyle, color: C.green, fontWeight: 700 }}>{formatNumber(totals.commits)}</div>
              <div style={{ ...columnStyle, color: "#ffffff", fontWeight: 700 }}>{formatNumber(totals.pullRequests)}</div>
              <div style={{ ...columnStyle, color: "#ffffff", fontWeight: 700 }}>{formatNumber(totals.issues)}</div>
              <div style={{ ...columnStyle, color: "#ffffff", fontWeight: 700 }}>
                {formatNumber(totals.totalContributions)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            width: "100%",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 32,
            paddingTop: 28,
            borderTopWidth: 1,
            borderTopStyle: "solid",
            borderTopColor: C.border,
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "Barlow Condensed",
              fontSize: 20,
              color: C.blueBright,
              textTransform: "uppercase",
              letterSpacing: 4,
            }}
          >
            Transfergit
          </div>
          <div style={{ display: "flex", fontSize: 18, color: C.muted }}>transfergit.app/{player.login}</div>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT, fonts, headers: { "Cache-Control": CACHE_CONTROL } }
  );
}
