import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getSquadFromParams, RepoNotFoundError, NotEnoughPlayersError } from "@/lib/squad";
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
    <SquadInteractive
      owner={owner}
      repo={repo}
      starters={squad.starters}
      captainLogin={squad.captain.login}
      mvpLogin={squad.mvp.login}
      standardOptions={squad.formationOptions}
      initialFormation={squad.formation}
      baseFormation={baseFormation}
      sidebarTop={
        <div className="flex flex-col gap-3">
          <SquadHeader squad={squad} playerCount={playerCount} />
          <SquadCaptainMvpCards captain={squad.captain} mvp={squad.mvp} />
        </div>
      }
      sidebar={
        <div className="flex flex-col gap-4">
          <SquadBench bench={squad.bench} captainLogin={squad.captain.login} mvpLogin={squad.mvp.login} />
          <SquadReserves reserves={squad.reserves} />
          <p className="pb-1 pt-2 text-center text-[10px] text-muted">
            <a
              href="https://github.com/tobiager"
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-foreground"
            >
              Built by @tobiager
            </a>
          </p>
        </div>
      }
    />
  );
}

export default async function SquadPage({ params, searchParams }: PageProps) {
  const { owner, repo } = await params;
  const { formation: formationParam, base: baseParam, layout: layoutParam } = await searchParams;

  return (
    <>
      {/*
        Match-center layout — the shell (SquadShell, shared with the
        Suspense fallback so streaming in never shifts layout) handles
        tabs/drawer/columns per breakpoint, and locks the page to one
        viewport on desktop. No ProfileReveal here: its scroll-triggered
        reveals key off window scroll, which the desktop shell doesn't have.
      */}
      <main className="w-full flex-1">
        <Suspense fallback={<SquadSkeleton owner={owner} repo={repo} />}>
          <SquadBody
            owner={owner}
            repo={repo}
            formationParam={formationParam}
            baseParam={baseParam}
            layoutParam={layoutParam}
          />
        </Suspense>
      </main>
      {/* The global footer would break the desktop 100dvh lock — mobile only. */}
      <div className="lg:hidden">
        <Footer />
      </div>
    </>
  );
}
