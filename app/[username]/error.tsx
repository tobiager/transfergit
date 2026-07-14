"use client";

import Link from "next/link";

export default function PlayerError({ error }: { error: Error & { digest?: string } }) {
  const isRateLimit = error.message.includes("rate limit");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <p className="font-display text-6xl">🟨</p>
      <h1 className="mt-4 font-display text-3xl font-extrabold md:text-4xl">
        {isRateLimit ? "Transfer window closed" : "Something went wrong"}
      </h1>
      <p className="mt-3 max-w-md text-muted">
        {isRateLimit
          ? "We're scouting too many players right now. GitHub's API rate limit kicked in — try again in a few minutes."
          : "Couldn't load this player's card. Try again shortly."}
      </p>
      <Link href="/" className="mt-6 text-sm text-muted hover:text-foreground">
        Back to the market
      </Link>
    </main>
  );
}
