import Link from "next/link";

export function SquadEmptyState({ owner, repo }: { owner: string; repo: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <p className="font-display text-6xl">🟥</p>
      <h1 className="mt-4 font-display text-3xl font-extrabold md:text-4xl">
        Not enough players to field a squad
      </h1>
      <p className="mt-3 max-w-md text-muted">
        {owner}/{repo} doesn&apos;t have enough human contributors for a matchday squad — at least 3 are
        needed to line up. Scout a bigger club.
      </p>
      <Link href="/" className="mt-6 text-sm text-muted hover:text-foreground">
        Back to the market
      </Link>
    </div>
  );
}
