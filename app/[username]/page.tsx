import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchGithubProfile } from "@/lib/github";
import { buildPlayer } from "@/lib/player";
import { rankAgainstReference } from "@/lib/ranking";
import { PlayerHeader } from "@/components/PlayerHeader";
import { MarketValueChart } from "@/components/MarketValueChart";
import { SeasonStatsTable } from "@/components/SeasonStatsTable";
import { PlayerDataCard } from "@/components/PlayerDataCard";
import { PositionDetailCard } from "@/components/PositionDetailCard";
import { TransferHistory } from "@/components/TransferHistory";
import { InjuryHistory } from "@/components/InjuryHistory";
import { ScoutingMetrics } from "@/components/ScoutingMetrics";
import { TrophyCabinet } from "@/components/TrophyCabinet";
import { ExportPanel } from "@/components/ExportPanel";
import { ProfileReveal } from "@/components/ProfileReveal";
import { ProfileTabs } from "@/components/ProfileTabs";
import { RankingCircles } from "@/components/RankingCircles";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const title = `${username} — Player Card | Transfergit`;
  const description = `${username}'s GitHub profile valued like a football player: market value, position, seasons and transfers.`;
  const ogImage = `${SITE_URL}/api/og/${username}/social`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${username}`,
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

  const player = buildPlayer(profile);

  const overallRanking = rankAgainstReference(player.login, player.marketValue);
  const positionRanking = rankAgainstReference(player.login, player.marketValue, player.position.main);
  const rankingItems = [
    { label: "Rank among scouted legends", value: overallRanking.rank, prefix: "#" },
    { label: "Top % by market value", value: Math.max(overallRanking.percentile, 1), suffix: "%" },
    { label: `Rank among ${player.position.main}s`, value: positionRanking.rank, prefix: "#" },
  ];

  return (
    <ProfileReveal>
      <ProfileTabs />
      <main className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 px-4 py-6 md:grid-cols-3 md:px-6">
        <div className="space-y-4 md:col-span-2">
          <div id="profile" className="scroll-mt-28 space-y-4">
            <PlayerHeader player={player} />
            <div className="tm-card rounded-xl p-4">
              <RankingCircles items={rankingItems} />
            </div>
          </div>

          <ExportPanel login={player.login} marketValueFormatted={player.marketValueFormatted} />

          <div id="market-value" data-reveal="chart" className="scroll-mt-28 rounded-xl tm-card p-4">
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

          <div id="trophies" className="scroll-mt-28">
            <TrophyCabinet player={player} />
          </div>

          <div id="stats" className="scroll-mt-28 space-y-4">
            <ScoutingMetrics ratings={player.ratings} />
            <SeasonStatsTable seasons={player.seasons} />
          </div>
        </div>

        <div className="space-y-4">
          <PlayerDataCard player={player} />
          <PositionDetailCard position={player.position} />
          <TransferHistory transfers={player.transfers} />
          <InjuryHistory injuries={player.injuries} />
        </div>
      </main>
    </ProfileReveal>
  );
}
