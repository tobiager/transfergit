"use client";

import Link from "next/link";

// GithubRateLimitError (lib/github.ts) encodes its retry-after seconds into
// the message itself, since custom error class fields don't survive the
// Server Component -> client error boundary trip — only `message`/`digest`
// do. Parsed back out here for a real ETA instead of a generic "later".
function parseRetryAfterSeconds(message: string): number | null {
  const match = message.match(/\[retryAfterSeconds=(\d+)\]/);
  return match ? Number(match[1]) : null;
}

function formatEta(seconds: number): string {
  if (seconds <= 90) return `about ${seconds}s`;
  const minutes = Math.round(seconds / 60);
  return `about ${minutes} minute${minutes === 1 ? "" : "s"}`;
}

export default function PlayerError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const isRateLimit = error.message.includes("rate limit");
  const retryAfterSeconds = isRateLimit ? parseRetryAfterSeconds(error.message) : null;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <p className="font-display text-6xl">🟨</p>
      <h1 className="mt-4 font-display text-3xl font-extrabold md:text-4xl">
        {isRateLimit ? "The transfer market is busy right now" : "Something went wrong"}
      </h1>
      <p className="mt-3 max-w-md text-muted">
        {isRateLimit
          ? `GitHub's API limits kicked in — this isn't a broken page, just too many scouts at once. Try again in ${
              retryAfterSeconds ? formatEta(retryAfterSeconds) : "a few minutes"
            }.`
          : "Couldn't load this player's card. Try again shortly."}
      </p>
      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          onClick={() => reset()}
          className="glow-green rounded-md bg-value-green px-5 py-2 font-display text-sm text-pitch transition hover:brightness-110"
        >
          Retry
        </button>
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          Back to the market
        </Link>
      </div>
    </main>
  );
}
