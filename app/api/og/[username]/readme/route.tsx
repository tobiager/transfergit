import { ImageResponse } from "next/og";
import { loadOgFonts } from "../../_shared/fonts";
import { loadOgPlayer } from "../../_shared/data";
import { OG_COLORS as C } from "../../_shared/theme";
import { OgTrendArrow } from "../../_shared/OgTrendArrow";
import { formatCardName } from "../../_shared/cardContent";
import { buildChartGeometry, buildSparklinePaths } from "../../_shared/sparkline";
import { getSiteHost } from "@/lib/site-url";
import { percentileTier } from "@/lib/ranking";
import { computeMarketValueTrend, formatCompactNumber, formatCompactValue, formatNumber } from "@/lib/format";
import { abbreviatePosition } from "@/lib/positions";
import { evaluateAchievements, topTrophies } from "@/lib/achievements";
import { LanguageBadge } from "../../_shared/languageIcon";
import { FlagBadge } from "../../_shared/flagIcon";

export const runtime = "edge";

// 1200x1500 (4:5): "embed the whole profile" for READMEs — dense, no dead
// space, same Floodlight look as the other 3 formats. Satori can't run
// Recharts, so the Market Value Evolution graph is hand-drawn from
// buildChartGeometry's SVG path (same helper the 3:4 sparkline uses).
const WIDTH = 1200;
const HEIGHT = 1500;
const CACHE_CONTROL = "public, max-age=0, s-maxage=86400, stale-while-revalidate";
const PAD = 56;
const CONTENT_WIDTH = WIDTH - PAD * 2;

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

function SectionLabel({ children }: { children: string }) {
  return (
    <div
      style={{
        display: "flex",
        fontFamily: "Barlow Condensed",
        fontSize: 18,
        color: C.muted,
        textTransform: "uppercase",
        letterSpacing: 3,
        marginBottom: 16,
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

  const currentSeason = player.seasons[0];
  const tier = percentileTier({
    stars: player.trophies.stars,
    commits: currentSeason?.commits ?? 0,
    followers: player.trophies.followers,
  });
  const siteHost = getSiteHost();
  const trend = computeMarketValueTrend(player.marketValueHistory);
  const displayName = formatCardName(player.name, player.login);

  const sparkline = buildSparklinePaths(player.marketValueHistory, 260, 60);

  const chartWidth = CONTENT_WIDTH;
  const chartHeight = 260;
  const chart = buildChartGeometry(player.marketValueHistory, chartWidth, chartHeight, 8);
  const values = player.marketValueHistory.map((p) => p.value);
  const minValue = values.length ? Math.min(...values) : 0;
  const maxValue = values.length ? Math.max(...values) : 0;
  const firstYear = player.marketValueHistory[0]?.year;
  const lastYear = player.marketValueHistory[player.marketValueHistory.length - 1]?.year;

  const top5 = topTrophies(evaluateAchievements(player), 5);

  const recentSeasons = player.seasons.slice(0, 6);
  const totals = player.seasons.reduce(
    (acc, s) => ({
      commits: acc.commits + s.commits,
      pullRequests: acc.pullRequests + s.pullRequests,
      totalContributions: acc.totalContributions + s.totalContributions,
    }),
    { commits: 0, pullRequests: 0, totalContributions: 0 }
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: "flex",
          flexDirection: "column",
          backgroundColor: C.pitch,
          backgroundImage: "radial-gradient(circle at 50% -10%, rgba(0,230,118,0.10), transparent 55%)",
          padding: PAD,
          fontFamily: "Archivo",
          borderWidth: 3,
          borderStyle: "solid",
          borderColor: "rgba(0,230,118,0.45)",
        }}
      >
        {/* Header: avatar + name + facts + rank */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", width: "100%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- Satori only renders native <img>. */}
          <img
            src={player.avatarUrl}
            alt=""
            width={84}
            height={84}
            style={{ borderRadius: 16, borderWidth: 2, borderStyle: "solid", borderColor: C.border }}
          />
          <div style={{ display: "flex", flexDirection: "column", marginLeft: 20, flex: 1 }}>
            <div style={{ display: "flex", fontFamily: "Archivo Black", fontSize: 40, color: C.foreground, textTransform: "uppercase" }}>
              {displayName}
            </div>
            <div style={{ display: "flex", alignItems: "center", marginTop: 6 }}>
              <FlagBadge iso2={player.nationalityIso2} size={20} />
              <div style={{ display: "flex", fontSize: 18, color: C.muted, marginLeft: 8 }}>
                {player.position.main} ({abbreviatePosition(player.position.main)}) · {player.currentClub}
              </div>
              <div style={{ display: "flex", marginLeft: 16 }}>
                <LanguageBadge language={player.provider} size={22} />
              </div>
              <div style={{ display: "flex", fontSize: 18, color: C.muted, marginLeft: 8 }}>{player.provider}</div>
            </div>
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
              padding: "6px 18px",
            }}
          >
            {tier}
          </div>
        </div>

        {/* Market value box with sparkline */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 34,
            padding: "18px 24px",
            borderRadius: 16,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "rgba(0,230,118,0.3)",
            backgroundColor: "rgba(0,230,118,0.05)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 15, color: C.muted, textTransform: "uppercase", letterSpacing: 2 }}>
              Market Value
            </div>
            <div style={{ display: "flex", alignItems: "center", marginTop: 4 }}>
              <div style={{ display: "flex", fontFamily: "Archivo Black", fontSize: 44, color: C.green }}>
                {player.marketValueFormatted}
              </div>
              {trend && trend.direction !== "flat" && (
                <div style={{ display: "flex", alignItems: "center", marginLeft: 10 }}>
                  <OgTrendArrow direction={trend.direction} size={22} color={trend.direction === "up" ? C.green : C.red} />
                  <div style={{ display: "flex", marginLeft: 4, fontSize: 20, color: trend.direction === "up" ? C.green : C.red }}>
                    {Math.abs(trend.pct).toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
          </div>
          <svg width={260} height={60} viewBox="0 0 260 60">
            <path d={sparkline.area} fill="rgba(0,230,118,0.18)" />
            <path d={sparkline.line} stroke={C.green} strokeWidth={3} fill="none" />
          </svg>
        </div>

        {/* Top 5 trophies */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 34 }}>
          <SectionLabel>Trophy Cabinet</SectionLabel>
          <div style={{ display: "flex", flexDirection: "row", gap: 12 }}>
            {top5.length === 0 ? (
              <div style={{ display: "flex", fontSize: 16, color: C.muted }}>No honours yet</div>
            ) : (
              top5.map((r) => (
                <div
                  key={r.achievement.id}
                  style={{
                    display: "flex",
                    fontSize: 14,
                    color: C.gold,
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: "rgba(255,196,0,0.35)",
                    backgroundColor: "rgba(255,196,0,0.06)",
                    borderRadius: 8,
                    padding: "8px 14px",
                  }}
                >
                  {r.achievement.name}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Market Value Evolution */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 34 }}>
          <SectionLabel>Market Value Evolution</SectionLabel>
          <svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
            <path d={chart.area} fill="rgba(0,230,118,0.15)" />
            <path d={chart.line} stroke={C.green} strokeWidth={3} fill="none" />
          </svg>
          <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
            <div style={{ display: "flex", fontSize: 14, color: C.muted }}>
              {firstYear} · {formatCompactValue(minValue)}
            </div>
            <div style={{ display: "flex", fontSize: 14, color: C.muted }}>
              {lastYear} · {formatCompactValue(maxValue)}
            </div>
          </div>
        </div>

        {/* Scouting metrics */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 34 }}>
          <SectionLabel>Scouting Metrics</SectionLabel>
          <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", width: "100%" }}>
            {player.ratings.map((rating) => (
              <div
                key={rating.key}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "50%",
                  paddingRight: 20,
                  marginBottom: 16,
                }}
              >
                <div style={{ display: "flex", fontSize: 16, color: C.foreground }}>{rating.label}</div>
                <div style={{ display: "flex", fontFamily: "Archivo Black", fontSize: 18, color: C.green }}>
                  {rating.score}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Season stats: last 6 + total */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 34 }}>
          <SectionLabel>Season Stats</SectionLabel>
          <div style={{ display: "flex", flexDirection: "row", fontSize: 13, color: C.muted, textTransform: "uppercase", paddingBottom: 6 }}>
            <div style={{ display: "flex", width: "22%" }}>Season</div>
            <div style={{ display: "flex", width: "26%", justifyContent: "flex-end" }}>Commits</div>
            <div style={{ display: "flex", width: "26%", justifyContent: "flex-end" }}>PRs</div>
            <div style={{ display: "flex", width: "26%", justifyContent: "flex-end" }}>Contributions</div>
          </div>
          {recentSeasons.map((s) => (
            <div
              key={s.year}
              style={{
                display: "flex",
                flexDirection: "row",
                fontSize: 15,
                color: C.foreground,
                borderTopWidth: 1,
                borderTopStyle: "solid",
                borderTopColor: C.border,
                padding: "10px 0",
              }}
            >
              <div style={{ display: "flex", width: "22%" }}>{s.year}</div>
              <div style={{ display: "flex", width: "26%", justifyContent: "flex-end", color: C.green }}>
                {formatNumber(s.commits)}
              </div>
              <div style={{ display: "flex", width: "26%", justifyContent: "flex-end" }}>{formatNumber(s.pullRequests)}</div>
              <div style={{ display: "flex", width: "26%", justifyContent: "flex-end" }}>
                {formatNumber(s.totalContributions)}
              </div>
            </div>
          ))}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              fontSize: 15,
              fontFamily: "Archivo Black",
              color: C.foreground,
              borderTopWidth: 1,
              borderTopStyle: "solid",
              borderTopColor: C.border,
              padding: "12px 0",
            }}
          >
            <div style={{ display: "flex", width: "22%" }}>Total</div>
            <div style={{ display: "flex", width: "26%", justifyContent: "flex-end", color: C.green }}>
              {formatNumber(totals.commits)}
            </div>
            <div style={{ display: "flex", width: "26%", justifyContent: "flex-end" }}>{formatNumber(totals.pullRequests)}</div>
            <div style={{ display: "flex", width: "26%", justifyContent: "flex-end" }}>
              {formatNumber(totals.totalContributions)}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flex: 1 }} />

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            fontSize: 16,
            color: C.muted,
            borderTopWidth: 1,
            borderTopStyle: "solid",
            borderTopColor: C.border,
            paddingTop: 14,
          }}
        >
          <div style={{ display: "flex" }}>
            {siteHost}/{player.login}
          </div>
          <div style={{ display: "flex" }}>{formatCompactNumber(player.trophies.followers)} followers</div>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT, fonts, headers: { "Cache-Control": CACHE_CONTROL } }
  );
}
