import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchGithubProfile, fetchOrgJoinYears } from "@/lib/github";
import { buildPlayer, buildOrgTransfers } from "@/lib/player";
import { rankAgainstReference, percentileOf } from "@/lib/ranking";
import { PlayerHeader } from "@/components/PlayerHeader";
import { MarketValueChart } from "@/components/MarketValueChart";
import { SeasonStatsSummary } from "@/components/SeasonStatsSummary";
import { SeasonStatsTable } from "@/components/SeasonStatsTable";
import { PositionDetailCard } from "@/components/PositionDetailCard";
import { TransferHistory } from "@/components/TransferHistory";
import { InjuryHistory } from "@/components/InjuryHistory";
import { ScoutingMetrics } from "@/components/ScoutingMetrics";
import { TrophyCabinet } from "@/components/TrophyCabinet";
import { ExportPanel } from "@/components/ExportPanel";
import { ProfileReveal } from "@/components/ProfileReveal";
import { ProfileTabs } from "@/components/ProfileTabs";
import { StatCards, type StatCardData } from "@/components/StatCards";
import { Footer } from "@/components/Footer";
import { getSiteUrl } from "@/lib/site-url";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const siteUrl = getSiteUrl();
  const title = `${username} — Player Card | Transfergit`;
  const description = `${username}'s GitHub profile valued like a football player: market value, position, seasons and transfers.`;
  const ogImage = `${siteUrl}/api/og/${username}/social`;

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${username}`,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function PlayerPage({ params }: PageProps) {
  const { username } = await params;
  const profile = await fetchGithubProfile(username);

  if (!profile) notFound();

  let player = buildPlayer(profile);

  if (profile.organizations.length > 0) {
    const orgLogins = profile.organizations.slice(0, 3).map((o) => o.login);
    const orgJoinYears = await fetchOrgJoinYears(profile.login, orgLogins);
    const marketValueByYear = new Map(player.marketValueHistory.map((p) => [p.year, p.value]));
    const orgTransfers = buildOrgTransfers(profile, orgJoinYears, marketValueByYear);
    if (orgTransfers) player = { ...player, transfers: orgTransfers };
  }

  const overallRanking = rankAgainstReference(player.login, player.marketValue);
  const currentSeason = player.seasons[0];

  const followersPercentile = percentileOf("followers", player.trophies.followers);
  const starsPercentile = percentileOf("stars", player.trophies.stars);
  const commitsPercentile = percentileOf("commitsThisSeason", currentSeason?.commits ?? 0);

  const statCards: StatCardData[] = [
    {
      label: "Followers",
      sublabel: `Rank #${overallRanking.rank}`,
      value: player.trophies.followers,
      compact: true,
      ringPercent: followersPercentile,
      progress: followersPercentile,
      color: "var(--value-green)",
    },
    {
      label: "Total stars",
      sublabel: `across ${player.trophies.repos} repos`,
      value: player.trophies.stars,
      compact: true,
      ringPercent: starsPercentile,
      progress: starsPercentile,
      color: "var(--tm-blue-bright)",
    },
    {
      label: "Commits this season",
      sublabel: `${currentSeason?.year ?? new Date().getFullYear()} season`,
      value: currentSeason?.commits ?? 0,
      compact: true,
      ringPercent: commitsPercentile,
      progress: commitsPercentile,
      color: "var(--gold)",
    },
    {
      label: "Strong foot",
      sublabel: `${player.position.foot} · ${player.age} yrs at top level`,
      value: player.age,
      ringLetter: player.position.foot[0],
      progress: Math.min(100, (player.age / 15) * 100),
      color: "var(--value-red)",
    },
  ];

  return (
    <ProfileReveal>
      <div className="mx-auto w-full max-w-7xl space-y-4 px-4 pt-6 md:px-6">
        <div id="overview" className="scroll-mt-28 space-y-4">
          <PlayerHeader player={player} rank={overallRanking.rank} />
          <StatCards items={statCards} />
        </div>
      </div>

      <ProfileTabs />

      <main className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6 md:px-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div id="transfers" className="scroll-mt-28">
              <TransferHistory transfers={player.transfers} />
            </div>
            <div id="injuries" className="scroll-mt-28">
              <InjuryHistory injuries={player.injuries} />
            </div>
            <PositionDetailCard position={player.position} />
          </div>

          <div className="space-y-4">
            <SeasonStatsSummary seasons={player.seasons} />
            <div id="trophies" className="scroll-mt-28">
              <TrophyCabinet player={player} />
            </div>
          </div>
        </div>

        <div id="stats" className="scroll-mt-28 space-y-4">
          <div data-reveal="chart" className="rounded-xl tm-card p-4">
            <div className="mb-2 flex items-baseline justify-between px-1">
              <h2 className="font-table text-lg font-bold uppercase tracking-wide">
                Market Value Evolution
              </h2>
              <p className="text-sm text-muted">
                Record: <span className="font-semibold text-gold">{player.recordValue.formatted}</span>{" "}
                ({player.recordValue.year})
              </p>
            </div>
            <MarketValueChart
              history={player.marketValueHistory}
              recordYear={player.recordValue.year}
              currentClubAvatar={player.currentClubAvatar}
            />
          </div>
          <ScoutingMetrics ratings={player.ratings} />
          <SeasonStatsTable seasons={player.seasons} />
        </div>

        <div id="export" className="scroll-mt-28">
          <ExportPanel login={player.login} marketValueFormatted={player.marketValueFormatted} />
        </div>
      </main>
      <Footer />
    </ProfileReveal>
  );
}
