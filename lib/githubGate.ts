import "server-only";

// A single process-wide gate every GitHub request (GraphQL chunks, repo
// pages, REST profile/valuation/contributor lookups — everything) funnels
// through. GitHub's SECONDARY rate limit (anti-abuse burst detection) is
// independent of the points budget and triggers on concurrent request
// volume regardless of how "cheap" each individual request is — a fan-out
// of year-chunk requests × concurrent squad valuations can trip it even
// while the points budget stays >95% full. Capping process-wide concurrency
// and spacing dispatches out with jitter keeps every caller (profile
// fetches, squad valuations) under that ceiling without each one having to
// know about the others.
const MAX_CONCURRENT = 3;
const JITTER_MIN_MS = 50;
const JITTER_MAX_MS = 150;

let active = 0;
const queue: Array<() => void> = [];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function acquire(): Promise<void> {
  if (active >= MAX_CONCURRENT) {
    await new Promise<void>((resolve) => queue.push(resolve));
  }
  active++;
  await sleep(JITTER_MIN_MS + Math.random() * (JITTER_MAX_MS - JITTER_MIN_MS));
}

function release(): void {
  active--;
  const next = queue.shift();
  if (next) next();
}

export async function withGithubGate<T>(fn: () => Promise<T>): Promise<T> {
  await acquire();
  try {
    return await fn();
  } finally {
    release();
  }
}
