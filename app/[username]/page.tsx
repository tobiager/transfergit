import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchGithubProfile } from "@/lib/github";
import { buildPlayer } from "@/lib/player";
import { PlayerHeader } from "@/components/PlayerHeader";
import { MarketValueChart } from "@/components/MarketValueChart";
import { SeasonStatsTable } from "@/components/SeasonStatsTable";
import { PlayerDataCard } from "@/components/PlayerDataCard";
import { TransferHistory } from "@/components/TransferHistory";
import { InjuryHistory } from "@/components/InjuryHistory";
import { ScoutingMetrics } from "@/components/ScoutingMetrics";
import { ExportPanel } from "@/components/ExportPanel";
import { ProfileReveal } from "@/components/ProfileReveal";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const title = `${username} — Ficha de jugador | Transfergit`;
  const description = `El perfil de GitHub de ${username} tasado como jugador de fútbol: valor de mercado, posición, temporadas y fichajes.`;
  const ogImage = `${SITE_URL}/api/og/${username}`;

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

  return (
    <ProfileReveal>
      <main className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 px-4 py-6 md:grid-cols-3 md:px-6">
        <div className="space-y-4 md:col-span-2">
          <PlayerHeader player={player} />

          <ExportPanel login={player.login} marketValueFormatted={player.marketValueFormatted} />

          <div data-reveal="chart" className="rounded-xl tm-card p-4">
            <div className="mb-2 flex items-baseline justify-between px-1">
              <h2 className="font-table text-lg font-bold uppercase tracking-wide">
                Evolución del valor de mercado
              </h2>
              <p className="text-sm text-muted">
                Récord: <span className="font-semibold text-gold">{player.recordValue.formatted}</span>{" "}
                ({player.recordValue.year})
              </p>
            </div>
            <MarketValueChart history={player.marketValueHistory} recordYear={player.recordValue.year} />
          </div>

          <ScoutingMetrics ratings={player.ratings} />

          <SeasonStatsTable seasons={player.seasons} />
        </div>

        <div className="space-y-4">
          <PlayerDataCard player={player} />
          <TransferHistory transfers={player.transfers} />
          <InjuryHistory injuries={player.injuries} />
        </div>
      </main>
    </ProfileReveal>
  );
}
