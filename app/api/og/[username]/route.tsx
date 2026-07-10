import { ImageResponse } from "next/og";
import { loadOgFonts } from "../_shared/fonts";
import { loadOgPlayer } from "../_shared/data";
import { buildChartGeometry, buildYAxisTicks } from "../_shared/sparkline";
import { computeFullCardHeight } from "../_shared/cardHeight";
import { OG_COLORS as C } from "../_shared/theme";
import { topUnlockedTrophies } from "../_shared/trophies";
import { TrophySilhouette } from "../_shared/TrophySilhouette";
import { OgFlag } from "../_shared/OgFlag";
import { formatNumber, formatCompactValue, computeMarketValueTrend } from "@/lib/format";

export const runtime = "edge";

// 1200 wide, dense README-sized card copied by "Copy Markdown". Height is
// computed per-profile (see computeFullCardHeight) so the card ends where
// its content ends instead of leaving dead space or clipping.
const WIDTH = 1200;
const FALLBACK_HEIGHT = 900;
const CACHE_CONTROL = "public, max-age=0, s-maxage=86400, stale-while-revalidate";
const CHART_WIDTH = 1088;
const CHART_HEIGHT = 260;

function NotFoundImage() {
  return (
    <div
      style={{
        width: WIDTH,
        height: FALLBACK_HEIGHT,
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
        flexDirection: "column",
        width: "100%",
        paddingTop: 24,
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
          color: C.foreground,
          textTransform: "uppercase",
          letterSpacing: 3,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function SeasonTh({ label, source }: { label: string; source: string }) {
  return (
    <div style={{ display: "flex", flex: 1, flexDirection: "column", alignItems: "flex-end" }}>
      <div style={{ display: "flex", fontSize: 13, color: C.muted, textTransform: "uppercase", fontFamily: "Barlow Condensed" }}>
        {label}
      </div>
      <div style={{ display: "flex", fontSize: 10, color: C.muted, opacity: 0.7 }}>{source}</div>
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
      height: FALLBACK_HEIGHT,
      fonts,
      status: 404,
      headers: { "Cache-Control": "public, max-age=0, s-maxage=60" },
    });
  }

  const trend = computeMarketValueTrend(player.marketValueHistory);
  const trophies = topUnlockedTrophies(player, 6);
  const CHART_PADDING = 20;
  const chart = buildChartGeometry(player.marketValueHistory, CHART_WIDTH, CHART_HEIGHT, CHART_PADDING);
  const yTicks = buildYAxisTicks(player.marketValueHistory, CHART_HEIGHT, CHART_PADDING, 3);
  const lastPoint = chart.points[chart.points.length - 1];
  const seasons = player.seasons.slice(0, 6);
  const HEIGHT = computeFullCardHeight({
    trophyCount: trophies.length,
    ratingsCount: player.ratings.length,
    seasonsShown: seasons.length,
  });
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
                <div style={{ display: "flex", marginLeft: 14 }}>
                  <OgFlag iso2={player.nationalityIso2} size={24} />
                </div>
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
                    alignItems: "center",
                    fontSize: 18,
                    fontWeight: 700,
                    marginLeft: 12,
                    color: trend.direction === "up" ? C.green : "#e5484d",
                  }}
                >
                  <svg width={14} height={14} viewBox="0 0 12 12" style={{ marginRight: 4 }}>
                    <path
                      d={
                        trend.direction === "up"
                          ? "M6 1.5 L11 9.5 L1 9.5 Z"
                          : "M6 10.5 L1 2.5 L11 2.5 Z"
                      }
                      fill={trend.direction === "up" ? C.green : "#e5484d"}
                    />
                  </svg>
                  {Math.abs(trend.pct).toFixed(0)}%
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Trophy row */}
        {trophies.length >= 3 && (
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
                <TrophySilhouette id={trophy.id} size={38} />
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

        {/* Market value evolution. Satori doesn't support SVG <text>, so
            every label is a plain positioned <div> layered over the chart. */}
        <div style={{ display: "flex", flexDirection: "column", width: "100%", marginTop: 32 }}>
          <SectionTitle>Market Value Evolution</SectionTitle>
          <div style={{ display: "flex", position: "relative", width: CHART_WIDTH, height: CHART_HEIGHT + 40, marginTop: 10 }}>
            <svg width={CHART_WIDTH} height={CHART_HEIGHT} style={{ position: "absolute", left: 0, top: 0 }}>
              <defs>
                <linearGradient id="og-chart-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.blueBright} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={C.blueBright} stopOpacity={0} />
                </linearGradient>
              </defs>

              {yTicks.map((tick, i) => (
                <line
                  key={i}
                  x1={0}
                  y1={tick.y}
                  x2={CHART_WIDTH}
                  y2={tick.y}
                  stroke={C.border}
                  strokeWidth={1}
                  strokeDasharray="4 5"
                />
              ))}

              <path d={chart.area} fill="url(#og-chart-gradient)" />
              <path d={chart.line} stroke={C.blueBright} strokeWidth={3} fill="none" />

              {chart.points.map((p, i) =>
                i === chart.recordIndex || i === chart.points.length - 1 ? null : (
                  <circle key={i} cx={p.x} cy={p.y} r={3} fill={C.blueBright} />
                )
              )}

              {chart.recordIndex >= 0 && (
                <circle
                  cx={chart.points[chart.recordIndex].x}
                  cy={chart.points[chart.recordIndex].y}
                  r={7}
                  fill={C.gold}
                />
              )}

              {lastPoint && chart.recordIndex !== chart.points.length - 1 && (
                <circle cx={lastPoint.x} cy={lastPoint.y} r={7} fill={C.blueBright} />
              )}
            </svg>

            {/* Y-axis labels */}
            {yTicks.map((tick, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  position: "absolute",
                  left: 4,
                  top: Math.max(tick.y - 16, 0),
                  fontSize: 13,
                  color: C.muted,
                }}
              >
                {formatCompactValue(tick.value)}
              </div>
            ))}

            {/* Record label */}
            {chart.recordIndex >= 0 && (
              <div
                style={{
                  display: "flex",
                  position: "absolute",
                  left: Math.min(Math.max(chart.points[chart.recordIndex].x - 28, 0), CHART_WIDTH - 56),
                  top: Math.max(chart.points[chart.recordIndex].y - 30, 0),
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.gold,
                }}
              >
                Record
              </div>
            )}

            {/* Current-value chip at the last point */}
            {lastPoint && (
              <div
                style={{
                  display: "flex",
                  position: "absolute",
                  left: Math.min(Math.max(lastPoint.x - 46, 0), CHART_WIDTH - 92),
                  top: CHART_HEIGHT + 8,
                  width: 92,
                  height: 30,
                  borderRadius: 6,
                  backgroundColor: C.navy,
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#ffffff",
                }}
              >
                {player.marketValueFormatted}
              </div>
            )}
          </div>
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
            <div style={{ display: "flex", flexDirection: "row", backgroundColor: C.surfaceElevated, padding: "8px 16px" }}>
              <div style={{ display: "flex", width: 100, fontSize: 13, color: C.muted, textTransform: "uppercase", fontFamily: "Barlow Condensed" }}>
                Season
              </div>
              <SeasonTh label="Appearances" source="active days" />
              <SeasonTh label="Goals" source="commits" />
              <SeasonTh label="Assists" source="pull requests" />
              <SeasonTh label="YC" source="issues" />
              <SeasonTh label="Minutes" source="contributions" />
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
