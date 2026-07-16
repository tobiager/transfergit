import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRepoSquad, RepoNotFoundError, NotEnoughPlayersError } from "@/lib/squad";
import { FORMATIONS, DEFAULT_FORMATION, type FormationName } from "@/lib/squad/formations";
import { ProfileReveal } from "@/components/ProfileReveal";
import { SquadHeader } from "@/components/squad/SquadHeader";
import { FormationSelector } from "@/components/squad/FormationSelector";
import { SquadPitch } from "@/components/squad/SquadPitch";
import { SquadBench } from "@/components/squad/SquadBench";
import { SquadExportPanel } from "@/components/squad/SquadExportPanel";
import { SquadEmptyState } from "@/components/squad/SquadEmptyState";
import { Footer } from "@/components/Footer";
import { getSiteUrl } from "@/lib/site-url";

export const revalidate = 86400;

const FORMATION_NAMES = Object.keys(FORMATIONS) as FormationName[];

function parseFormation(value: string | undefined): FormationName {
  return FORMATION_NAMES.includes(value as FormationName) ? (value as FormationName) : DEFAULT_FORMATION;
}

interface PageProps {
  params: Promise<{ owner: string; repo: string }>;
  searchParams: Promise<{ formation?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { owner, repo } = await params;
  const siteUrl = getSiteUrl();
  const title = `${owner}/${repo} — Repo Squad | Transfergit`;
  const description = `${owner}/${repo}'s top GitHub contributors, fielded as a football squad ranked by market value.`;
  const ogImage = `${siteUrl}/api/og/squad/${owner}/${repo}?format=landscape`;

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    openGraph: {
      title,
      description,
      url: `${siteUrl}/squad/${owner}/${repo}`,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}

export default async function SquadPage({ params, searchParams }: PageProps) {
  const { owner, repo } = await params;
  const { formation: formationParam } = await searchParams;
  const formation = parseFormation(formationParam);

  let squad;
  try {
    squad = await getRepoSquad(owner, repo, formation);
  } catch (err) {
    if (err instanceof RepoNotFoundError) notFound();
    if (err instanceof NotEnoughPlayersError) return <SquadEmptyState owner={owner} repo={repo} />;
    throw err;
  }

  const playerCount = squad.starters.length + squad.bench.length;

  return (
    <ProfileReveal>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-4 md:px-6 md:py-6">
        <SquadHeader squad={squad} playerCount={playerCount} />
        {playerCount >= 11 && <FormationSelector owner={owner} repo={repo} current={squad.formation} />}
        <SquadPitch starters={squad.starters} captainLogin={squad.captain.login} mvpLogin={squad.mvp.login} />
        <SquadBench bench={squad.bench} captainLogin={squad.captain.login} mvpLogin={squad.mvp.login} />
        <div className="mt-8">
          <SquadExportPanel owner={owner} repo={repo} />
        </div>
      </main>
      <Footer />
    </ProfileReveal>
  );
}
