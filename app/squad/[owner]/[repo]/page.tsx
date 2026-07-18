import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getSquadFromParams, RepoNotFoundError, NotEnoughPlayersError } from "@/lib/squad";
import { ProfileReveal } from "@/components/ProfileReveal";
import { SquadHeader } from "@/components/squad/SquadHeader";
import { SquadInteractive } from "@/components/squad/SquadInteractive";
import { SquadCaptainMvpCards } from "@/components/squad/SquadCaptainMvpCards";
import { SquadBench } from "@/components/squad/SquadBench";
import { SquadReserves } from "@/components/squad/SquadReserves";
import { SquadEmptyState } from "@/components/squad/SquadEmptyState";
import { SquadSkeleton } from "@/components/squad/SquadSkeleton";
import { Footer } from "@/components/Footer";
import { getSiteUrl } from "@/lib/site-url";

export const revalidate = 86400;

interface PageProps {
  params: Promise<{ owner: string; repo: string }>;
  searchParams: Promise<{ formation?: string; base?: string; layout?: string }>;
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

// Fetches + renders the real squad. Lives behind the page's Suspense
// boundary so this is the only part of the response that waits on
// getRepoSquad — everything else in SquadPage streams out immediately.
async function SquadBody({
  owner,
  repo,
  formationParam,
  baseParam,
  layoutParam,
}: {
  owner: string;
  repo: string;
  formationParam?: string;
  baseParam?: string;
  layoutParam?: string;
}) {
  let squad, baseFormation;
  try {
    ({ squad, baseFormation } = await getSquadFromParams(owner, repo, {
      formation: formationParam,
      base: baseParam,
      layout: layoutParam,
    }));
  } catch (err) {
    if (err instanceof RepoNotFoundError) notFound();
    if (err instanceof NotEnoughPlayersError) return <SquadEmptyState owner={owner} repo={repo} />;
    throw err;
  }

  const playerCount = squad.starters.length + squad.bench.length;

  return (
    <>
      <div className="lg:col-start-8 lg:col-span-5 lg:row-start-1">
        <SquadHeader squad={squad} playerCount={playerCount} />
      </div>

      <SquadInteractive
        owner={owner}
        repo={repo}
        starters={squad.starters}
        captainLogin={squad.captain.login}
        mvpLogin={squad.mvp.login}
        standardOptions={squad.formationOptions}
        initialFormation={squad.formation}
        baseFormation={baseFormation}
      />

      <div className="lg:col-start-8 lg:col-span-5 lg:row-start-3">
        <SquadCaptainMvpCards captain={squad.captain} mvp={squad.mvp} />
      </div>

      <div className="lg:col-start-8 lg:col-span-5 lg:row-start-4">
        <SquadBench bench={squad.bench} captainLogin={squad.captain.login} mvpLogin={squad.mvp.login} />
      </div>

      <div className="lg:col-start-8 lg:col-span-5 lg:row-start-5">
        <SquadReserves reserves={squad.reserves} />
      </div>
    </>
  );
}

export default async function SquadPage({ params, searchParams }: PageProps) {
  const { owner, repo } = await params;
  const { formation: formationParam, base: baseParam, layout: layoutParam } = await searchParams;

  return (
    <ProfileReveal>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 md:px-6 md:py-6">
        {/*
          Single 12-col grid, no nesting: every block gets an explicit
          lg:col-start so the pitch can sit in a tall sticky left column
          (col 1-7, spanning all 6 right-column rows) while the rest stack
          in col 8-12. Below lg, explicit placement doesn't apply and the
          grid falls back to a single column — DOM order there is the
          mobile-desired order (header, pills, pitch, highlights, bench,
          reserves, export), independent of the desktop column each block
          lands in.

          The Suspense fallback (SquadSkeleton) mirrors this exact same grid
          so swapping to the real SquadBody never shifts layout — see
          components/squad/SquadSkeleton.tsx.
        */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start lg:gap-8">
          <Suspense fallback={<SquadSkeleton owner={owner} repo={repo} />}>
            <SquadBody
              owner={owner}
              repo={repo}
              formationParam={formationParam}
              baseParam={baseParam}
              layoutParam={layoutParam}
            />
          </Suspense>
        </div>
      </main>
      <Footer />
    </ProfileReveal>
  );
}
