import "server-only";
import { unstable_cache } from "next/cache.js";
import { withGithubGate } from "./githubGate.ts";
import { mapWithConcurrency } from "./concurrency.ts";
import type { ContributionDay, GithubOrg, GithubProfile, GithubRepo, WorldCupRepo, YearContribution } from "./types";

const GITHUB_GRAPHQL_ENDPOINT = "https://api.github.com/graphql";

class GithubUserNotFoundError extends Error {}

export class GithubRateLimitError extends Error {
  // Seconds to wait before retrying, from GitHub's Retry-After header — null
  // when the header wasn't sent (caller should fall back to its own backoff).
  readonly retryAfterSeconds: number | null;
  // "primary": the hourly points budget is exhausted (x-ratelimit-remaining
  // near 0). "secondary": GitHub's anti-abuse burst detector — independent
  // of the points budget, can trigger even with >90% of it left, purely from
  // request concurrency/rate. They need different handling: primary is
  // pointless to retry soon (Retry-After can be tens of minutes); secondary
  // recovers in seconds and IS worth a backoff+retry.
  readonly kind: "primary" | "secondary";

  constructor(message: string, retryAfterSeconds: number | null = null, kind: "primary" | "secondary" = "primary") {
    // Next.js redacts everything except `message` (and a `digest`) when an
    // error thrown from a Server Component crosses to the client error
    // boundary (app/[username]/error.tsx) — custom class fields like
    // retryAfterSeconds/kind above don't survive that trip. Encoding them
    // into the message itself is what lets the client-side error UI still
    // show a real ETA instead of a generic "try again later".
    const suffix = retryAfterSeconds != null ? ` [retryAfterSeconds=${retryAfterSeconds}]` : "";
    super(`${message}${suffix}`);
    this.retryAfterSeconds = retryAfterSeconds;
    this.kind = kind;
  }
}

// A GraphQL query that returned HTTP 200 but whose cost exceeded GitHub's
// per-request resource budget (errors[].type === "RESOURCE_LIMITS_EXCEEDED").
// Distinct from GithubRateLimitError: this is NOT the hourly rate limit
// (x-ratelimit-remaining stays high) and it is NOT transient for the exact
// same query shape+window — see fetchContributionWindow's bisection, which
// is what actually resolves this instead of giving up.
export class GithubQueryTooExpensiveError extends Error {}

// A profile whose base data resolved but one or more contribution-year
// chunks (or the rolling lastYear window) never resolved, even after retry
// and bisection. Thrown (not returned) specifically so the 24h durable
// profile cache (cachedFullProfile) never persists it — see getGithubProfile
// for how the embedded profile is still served, just from the
// shorter-lived "attempt" cache instead.
class PartialProfileError extends Error {
  readonly profile: GithubProfile;
  constructor(profile: GithubProfile) {
    super(
      `Profile incomplete for ${profile.login}: missing years [${profile.missingYears.join(", ")}]` +
        (profile.lastYearCalendar.length === 0 && profile.missingYears.length === 0 ? " (lastYear window unresolved)" : "")
    );
    this.profile = profile;
  }
}

// A contribution-window chunk (one year, or the lastYear rolling window)
// that never resolved for this login, even after rate-limit retries and
// too-expensive bisection. Thrown (not returned as null) so the per-window
// durable cache never persists a failure — the next attempt genuinely
// retries this window instead of being stuck on a durably-cached "missing"
// forever.
class UnresolvedWindowError extends Error {}

export interface GithubRateLimitStatus {
  remaining: number;
  limit: number;
  resetAtEpochSeconds: number | null;
}

// Updated on every GraphQL response (success or failure) so callers can read
// "how much of the hourly budget is left" without a dedicated API call.
// Module-scoped and process-local by design — this is a live signal for the
// current invocation's fan-out, not a durable record.
let lastRateLimitStatus: GithubRateLimitStatus | null = null;

export function getLastGithubRateLimitStatus(): GithubRateLimitStatus | null {
  return lastRateLimitStatus;
}

function captureRateLimitHeaders(res: Response): void {
  // res.headers is absent on the bare mock Response objects the test suite
  // builds by hand — degrade to "no signal" rather than throw.
  const remaining = res.headers?.get("x-ratelimit-remaining") ?? null;
  const limit = res.headers?.get("x-ratelimit-limit") ?? null;
  if (remaining === null || limit === null) return;
  const reset = res.headers.get("x-ratelimit-reset");
  lastRateLimitStatus = {
    remaining: Number(remaining),
    limit: Number(limit),
    resetAtEpochSeconds: reset ? Number(reset) : null,
  };
}

// GitHub's hourly points budget, read from each query's own `rateLimit {
// cost remaining }` field (the actual GraphQL point cost of the query that
// just ran, not the coarse header count). Logged so real per-chunk costs
// are visible instead of guessed at.
function logQueryCost(label: string, data: { rateLimit?: { cost: number; remaining: number } } | null | undefined): void {
  if (data?.rateLimit) {
    console.warn(`[github] ${label} cost=${data.rateLimit.cost} remaining=${data.rateLimit.remaining}`);
  }
}

// Stop starting new GraphQL fetches once less than this fraction of the
// hourly points budget remains — the caller (getGithubProfile) falls back to
// the REST last resort instead of risking starving every other visitor.
const RATE_LIMIT_BUDGET_FLOOR = 0.1;

function budgetIsLow(): boolean {
  const budget = getLastGithubRateLimitStatus();
  return budget != null && budget.remaining / budget.limit < RATE_LIMIT_BUDGET_FLOOR;
}

// GitHub usernames: alphanumeric + single hyphens, no leading/trailing
// hyphen, max 39 chars. Rejecting anything else upfront keeps malformed
// input out of API/OG-image URLs entirely.
const USERNAME_RE = /^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}$/;

export function isValidGithubUsername(username: string): boolean {
  return USERNAME_RE.test(username);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function githubGraphQL<T>(
  query: string,
  variables: Record<string, unknown>,
  opts: { allowPartialSalvage?: boolean } = {}
): Promise<T> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      "Missing GITHUB_TOKEN environment variable. Copy .env.example to .env.local and fill in a Personal Access Token."
    );
  }

  const res = await withGithubGate(() =>
    fetch(GITHUB_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 86400 },
    })
  );

  captureRateLimitHeaders(res);

  if (res.status === 403 || res.status === 429) {
    const retryAfter = res.headers?.get("retry-after") ?? null;
    const remaining = res.headers?.get("x-ratelimit-remaining") ?? null;
    let bodyText = "";
    try {
      bodyText = await res.text();
    } catch {
      // best-effort — body isn't always readable on the test suite's mocks
    }
    // Primary: the hourly points budget is actually exhausted
    // (x-ratelimit-remaining near 0). Secondary: GitHub's abuse-detection
    // burst limiter — remaining stays high, message says "secondary rate
    // limit". These need different backoff strategies (see
    // GithubRateLimitError's kind field).
    const isSecondary = /secondary rate limit/i.test(bodyText) || (remaining !== null && Number(remaining) > 0);
    throw new GithubRateLimitError(
      isSecondary ? "GitHub secondary (abuse-detection) rate limit hit" : "GitHub primary rate limit exceeded",
      retryAfter ? Number(retryAfter) : null,
      isSecondary ? "secondary" : "primary"
    );
  }
  if (!res.ok) {
    throw new Error(`GitHub GraphQL responded ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();

  if (json.errors?.some((e: { type?: string }) => e.type === "NOT_FOUND")) {
    throw new GithubUserNotFoundError();
  }
  if (json.errors) {
    // GitHub can return HTTP 200 with BOTH an errors[] array AND a
    // partially-resolved data object. Salvaging is safe for the base
    // profile query, where the failing pieces (external-PR search, closed
    // issues) are independent top-level fields that don't touch `user`'s
    // own resolved scalars. It is NOT safe for a contribution-window query
    // (allowPartialSalvage: false) — there, the entire payload IS
    // `user.contributionsCollection`, and a real-world case showed GitHub
    // can return that object populated with silently-wrong/truncated
    // aggregates alongside errors[] rather than cleanly nulling it. Trusting
    // that would serve fabricated stats as if complete — worse than a
    // clearly-marked missing chunk.
    const allowSalvage = opts.allowPartialSalvage ?? true;
    if (allowSalvage) {
      const data = json.data as { user?: unknown } | null | undefined;
      if (data && data.user != null) {
        console.warn(
          `[github] partial GraphQL response salvaged (user resolved): ${json.errors.length} alias error(s), ` +
            `first type=${(json.errors as { type?: string }[])[0]?.type ?? "unknown"}`
        );
        return json.data as T;
      }
    }

    const errorTypes = new Set((json.errors as { type?: string }[]).map((e) => e.type));
    if (errorTypes.size === 1 && errorTypes.has("RESOURCE_LIMITS_EXCEEDED")) {
      throw new GithubQueryTooExpensiveError("GitHub GraphQL query exceeded the per-request resource limit");
    }
    throw new Error(`GitHub GraphQL error: ${JSON.stringify(json.errors)}`);
  }

  return json.data as T;
}

// Rounds "now" to the start of the current UTC day so repeated profile
// requests within the fetch-cache window produce a byte-identical
// query/body and actually land the same Data Cache key.
function cacheStableNow(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// Retries a rate-limited GraphQL call with backoff. Primary vs secondary
// (see GithubRateLimitError) both retry the same way here — the fixed
// backoff ladder is the fallback when GitHub doesn't send Retry-After;
// Retry-After, when present, always wins. Not used for
// GithubQueryTooExpensiveError (that's bisection's job, in
// fetchContributionWindow) or for a genuinely missing user.
const RATE_LIMIT_BACKOFFS_MS = [2000, 8000, 30000];

async function withRateLimitRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!(err instanceof GithubRateLimitError) || attempt >= RATE_LIMIT_BACKOFFS_MS.length) throw err;
      const waitMs = err.retryAfterSeconds != null ? err.retryAfterSeconds * 1000 : RATE_LIMIT_BACKOFFS_MS[attempt];
      console.warn(`[github] ${label}: ${err.kind} rate limit, retrying in ${waitMs}ms (attempt ${attempt + 1}/${RATE_LIMIT_BACKOFFS_MS.length})`);
      await sleep(waitMs);
    }
  }
}

// unstable_cache needs Next's request-scoped incrementalCache, which doesn't
// exist in the plain `node --test` suite — every cached(...) wrapper below
// falls back to calling the uncached function directly in that case. Shared
// once here instead of duplicated per cache tier.
function withDirectFallback<A extends unknown[], R>(
  cached: (...args: A) => Promise<R>,
  direct: (...args: A) => Promise<R>
): (...args: A) => Promise<R> {
  return async (...args: A) => {
    try {
      return await cached(...args);
    } catch (err) {
      if (err instanceof Error && err.message.includes("incrementalCache")) {
        return direct(...args);
      }
      throw err;
    }
  };
}

interface CreatedAtResponse {
  user: { createdAt: string } | null;
}

const CREATED_AT_QUERY = `query($login: String!) { user(login: $login) { createdAt } }`;

// ---------------------------------------------------------------------------
// Query chunking
//
// contributionsCollection only accepts windows of at most one year, and a
// single query stacking every year (plus the full repo list, plus PR/issue
// search) is exactly what trips GitHub's per-REQUEST resource limit for
// long-tenured/prolific accounts. Splitting into one cheap request per
// concern — and, for the contribution windows specifically, requesting ONLY
// scalar aggregates (no nested per-repo/per-day lists for the yearly
// chunks) — keeps every individual request far under that ceiling. A window
// that's still too expensive for a single active year (a very prolific
// account) is bisected into halves rather than given up on.
// ---------------------------------------------------------------------------

const YEAR_CHUNK_CONCURRENCY = 4;
// year → semester → quarter. Each halving roughly halves the node count a
// dense year's aggregate resolver has to walk.
const MAX_BISECT_DEPTH = 2;
// Cursor pagination is inherently sequential (each page needs the previous
// page's cursor). Capped at 12 pages (1,200 repos) as a safety net — with
// orderBy STARGAZERS DESC the long tail past that never moves the valuation.
const MAX_REPO_PAGES = 12;
// A historical year (already fully in the past) is immutable — once
// resolved, it never changes, so it's cached hard. The current year and the
// rolling lastYear window are still accumulating, so they get short TTLs.
const HISTORICAL_YEAR_CACHE_TTL_SECONDS = 30 * 86400;
const CURRENT_YEAR_CACHE_TTL_SECONDS = 4 * 3600;
const LAST_YEAR_WINDOW_CACHE_TTL_SECONDS = 3600;
// ponytail: no hit/miss signal is exposed for unstable_cache calls, so a
// cache hit (fresh OR stale-served) is inferred from latency.
const CACHE_LATENCY_THRESHOLD_MS = 50;

interface RateLimitInfo {
  rateLimit?: { cost: number; remaining: number };
}

interface SearchIssueCount {
  issueCount: number;
}

interface PullRequestSearchResult extends SearchIssueCount {
  nodes: Array<{ repository?: { name: string; stargazerCount: number } | null; mergedAt?: string }> | null;
}

interface RepoNode {
  name: string;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: { name: string } | null;
  createdAt: string;
  pushedAt: string;
}

interface RepoConnection {
  totalCount: number;
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
  nodes: RepoNode[];
}

interface BaseProfileResponse extends RateLimitInfo {
  externalMergedPRs: PullRequestSearchResult | null;
  closedIssues: SearchIssueCount | null;
  user: {
    login: string;
    name: string | null;
    avatarUrl: string;
    bio: string | null;
    location: string | null;
    company: string | null;
    createdAt: string;
    websiteUrl: string | null;
    twitterUsername: string | null;
    followers: { totalCount: number } | null;
    following: { totalCount: number } | null;
    repositories: RepoConnection | null;
    organizations: { nodes: GithubOrg[] } | null;
    // contributionYears ignores the from/to window entirely (a documented
    // quirk of GitHub's schema) and always returns the user's full lifetime
    // list of years with at least one contribution — the authoritative
    // "years we expect data for", cheaper and more accurate than assuming
    // every year from createdAt to now has a chunk (an account can predate
    // its first contribution, or have gap years).
    contributionsCollection: { contributionYears: number[] } | null;
  } | null;
}

const BASE_PROFILE_QUERY = `
  query($login: String!, $prSearch: String!, $issueSearch: String!) {
    rateLimit { cost remaining }
    externalMergedPRs: search(query: $prSearch, type: ISSUE, first: 50) {
      issueCount
      nodes {
        ... on PullRequest {
          mergedAt
          repository { name stargazerCount }
        }
      }
    }
    closedIssues: search(query: $issueSearch, type: ISSUE, first: 1) {
      issueCount
    }
    user(login: $login) {
      login
      name
      avatarUrl
      bio
      location
      company
      createdAt
      websiteUrl
      twitterUsername
      followers { totalCount }
      following { totalCount }
      repositories(first: 100, ownerAffiliations: OWNER, isFork: false, orderBy: { field: STARGAZERS, direction: DESC }) {
        totalCount
        pageInfo { hasNextPage endCursor }
        nodes { name stargazerCount forkCount primaryLanguage { name } createdAt pushedAt }
      }
      organizations(first: 20) {
        nodes { login avatarUrl name }
      }
      contributionsCollection {
        contributionYears
      }
    }
  }
`;

interface RepoPageResponse extends RateLimitInfo {
  user: { repositories: RepoConnection } | null;
}

const REPO_PAGE_QUERY = `
  query($login: String!, $after: String!) {
    rateLimit { cost remaining }
    user(login: $login) {
      repositories(first: 100, after: $after, ownerAffiliations: OWNER, isFork: false, orderBy: { field: STARGAZERS, direction: DESC }) {
        pageInfo { hasNextPage endCursor }
        nodes { name stargazerCount forkCount primaryLanguage { name } createdAt pushedAt }
      }
    }
  }
`;

function mapRepoNode(repo: RepoNode): GithubRepo {
  return {
    name: repo.name,
    stars: repo.stargazerCount,
    forks: repo.forkCount,
    language: repo.primaryLanguage?.name ?? null,
    createdAt: repo.createdAt,
    pushedAt: repo.pushedAt,
  };
}

// Cursor pagination beyond the first page (already fetched by the base
// query). Sequential by necessity; stops early on failure — a partial repo
// list (ordered by stars DESC, so the head is what matters for valuation) is
// far better than failing the whole profile over the tail.
async function fetchAdditionalRepoPages(
  login: string,
  startCursor: string | null,
  hasNext: boolean
): Promise<{ repos: GithubRepo[]; pagesFetched: number }> {
  const repos: GithubRepo[] = [];
  let cursor = startCursor;
  let hasNextPage = hasNext;
  let page = 1; // page 1 is the base query
  while (hasNextPage && cursor && page < MAX_REPO_PAGES) {
    page++;
    try {
      const data = await withRateLimitRetry(`repos page ${page}`, () =>
        githubGraphQL<RepoPageResponse>(REPO_PAGE_QUERY, { login, after: cursor })
      );
      logQueryCost(`repos page ${page}`, data);
      const conn = data.user?.repositories;
      if (!conn) break;
      repos.push(...conn.nodes.map(mapRepoNode));
      hasNextPage = conn.pageInfo.hasNextPage;
      cursor = conn.pageInfo.endCursor;
    } catch (err) {
      console.warn(`[github] repo page ${page} fetch failed for ${login}, keeping what we have: ${(err as Error).message}`);
      break;
    }
  }
  return { repos, pagesFetched: page - 1 };
}

// ---------------------------------------------------------------------------
// Contribution windows (one calendar year, or the rolling 365-day lastYear
// window) — the part of the old monolithic query that actually tripped
// GitHub's per-request resource limit for dense accounts.
// ---------------------------------------------------------------------------

interface WindowAggregate {
  commits: number;
  pullRequests: number;
  issues: number;
  reviews: number;
  restricted: number;
  calendar?: ContributionDay[];
}

function windowTotalContributions(w: WindowAggregate): number {
  return w.commits + w.pullRequests + w.issues + w.reviews + w.restricted;
}

function mergeWindows(a: WindowAggregate, b: WindowAggregate): WindowAggregate {
  return {
    commits: a.commits + b.commits,
    pullRequests: a.pullRequests + b.pullRequests,
    issues: a.issues + b.issues,
    reviews: a.reviews + b.reviews,
    restricted: a.restricted + b.restricted,
    calendar: a.calendar && b.calendar ? [...a.calendar, ...b.calendar] : undefined,
  };
}

interface WindowResponse extends RateLimitInfo {
  user: {
    contributionsCollection: {
      totalCommitContributions: number;
      totalPullRequestContributions: number;
      totalIssueContributions: number;
      totalPullRequestReviewContributions: number;
      restrictedContributionsCount: number;
      contributionCalendar?: {
        weeks: Array<{ contributionDays: Array<{ date: string; contributionCount: number }> }>;
      };
    };
  } | null;
}

// Scalar aggregates only — no nested commitContributionsByRepository, no
// contributionCalendar totals. This is what makes a year chunk cheap enough
// that RESOURCE_LIMITS_EXCEEDED should be effectively impossible; the
// bisection fallback below exists for the accounts prolific enough to still
// trip it.
const WINDOW_QUERY_AGGREGATE = `
  query($login: String!, $from: DateTime!, $to: DateTime!) {
    rateLimit { cost remaining }
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        totalPullRequestReviewContributions
        restrictedContributionsCount
      }
    }
  }
`;

// Same aggregates plus the daily calendar — needed only for the rolling
// lastYear window (injury-gap detection needs day-level granularity).
const WINDOW_QUERY_WITH_CALENDAR = `
  query($login: String!, $from: DateTime!, $to: DateTime!) {
    rateLimit { cost remaining }
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        totalPullRequestReviewContributions
        restrictedContributionsCount
        contributionCalendar {
          weeks { contributionDays { date contributionCount } }
        }
      }
    }
  }
`;

function isoRange(from: Date, to: Date): string {
  return `${from.toISOString().slice(0, 10)}..${to.toISOString().slice(0, 10)}`;
}

// One network attempt at a window (with rate-limit retry baked in — NOT
// bisection, that's the caller's job). allowPartialSalvage: false — see the
// comment in githubGraphQL on why a window query must never trust a
// partially-resolved contributionsCollection.
async function fetchContributionWindowOnce(login: string, from: Date, to: Date, includeCalendar: boolean): Promise<WindowAggregate> {
  return withRateLimitRetry(`window ${isoRange(from, to)}`, async () => {
    const query = includeCalendar ? WINDOW_QUERY_WITH_CALENDAR : WINDOW_QUERY_AGGREGATE;
    const data = await githubGraphQL<WindowResponse>(
      query,
      { login, from: from.toISOString(), to: to.toISOString() },
      { allowPartialSalvage: false }
    );
    logQueryCost(`window ${isoRange(from, to)}`, data);
    const cc = data.user?.contributionsCollection;
    if (!cc) return { commits: 0, pullRequests: 0, issues: 0, reviews: 0, restricted: 0, calendar: includeCalendar ? [] : undefined };
    return {
      commits: cc.totalCommitContributions,
      pullRequests: cc.totalPullRequestContributions,
      issues: cc.totalIssueContributions,
      reviews: cc.totalPullRequestReviewContributions,
      restricted: cc.restrictedContributionsCount,
      calendar: includeCalendar
        ? (cc.contributionCalendar?.weeks ?? []).flatMap((w) => w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })))
        : undefined,
    };
  });
}

interface WindowOutcome {
  aggregate: WindowAggregate | null;
  // Populated only when aggregate is null — the exact reason this slice
  // never resolved, surfaced all the way up to fetchGithubProfile's
  // completeness log instead of a bare "missing".
  reason?: string;
}

// A one-off 502/network hiccup gets this many retries at the SAME window
// before giving up on it — real GitHub instability under the burst of
// requests a bisected profile fires can occasionally produce two in a row.
const TRANSIENT_RETRY_ATTEMPTS = 2;

// Resolves one contribution window, bisecting on RESOURCE_LIMITS_EXCEEDED
// (year → semester → quarter, MAX_BISECT_DEPTH deep) instead of marking it
// permanently failed. Returns { aggregate: null, reason } — never a
// fabricated zero — when a slice truly can't be resolved even at the
// bisection floor, after rate-limit retries are exhausted, or after
// transient-failure retries are exhausted; the caller (fetchYearWindowRaw /
// fetchLastYearWindowRaw) turns that into an UnresolvedWindowError carrying
// the same reason, so it's never durably cached as a false "this year had 0
// contributions" AND the reason survives into the completeness log.
async function fetchContributionWindow(
  login: string,
  from: Date,
  to: Date,
  includeCalendar: boolean,
  depth = 0,
  transientAttempt = 0
): Promise<WindowOutcome> {
  try {
    return { aggregate: await fetchContributionWindowOnce(login, from, to, includeCalendar) };
  } catch (err) {
    if (err instanceof GithubQueryTooExpensiveError) {
      if (depth >= MAX_BISECT_DEPTH) {
        const reason = `too expensive even at max bisection depth (${depth})`;
        console.warn(`[github] ${login} window ${isoRange(from, to)} ${reason}, marking unresolved`);
        return { aggregate: null, reason };
      }
      const mid = new Date(from.getTime() + (to.getTime() - from.getTime()) / 2);
      console.warn(`[github] ${login} window ${isoRange(from, to)} too expensive, bisecting (depth ${depth + 1})`);
      const [a, b] = await Promise.all([
        fetchContributionWindow(login, from, mid, includeCalendar, depth + 1),
        fetchContributionWindow(login, mid, to, includeCalendar, depth + 1),
      ]);
      if (a.aggregate && b.aggregate) return { aggregate: mergeWindows(a.aggregate, b.aggregate) };
      return { aggregate: null, reason: a.reason ?? b.reason };
    }
    if (err instanceof GithubRateLimitError) {
      const reason = `still rate-limited (${err.kind}) after retries`;
      console.warn(`[github] ${login} window ${isoRange(from, to)} ${reason}, marking unresolved`);
      return { aggregate: null, reason };
    }
    if (err instanceof Error && err.message.includes("GITHUB_TOKEN")) throw err;
    // A bare transient failure (5xx, network hiccup) — neither a cost
    // problem (bisecting won't help) nor a rate limit (withRateLimitRetry
    // already exhausted its own attempts for that). A couple of quick
    // retries at the SAME window before giving up on this slice, so a
    // one-off 502 (or two, under the burst load a bisected profile
    // generates) doesn't permanently drop an otherwise-healthy year.
    if (transientAttempt < TRANSIENT_RETRY_ATTEMPTS) {
      console.warn(
        `[github] ${login} window ${isoRange(from, to)} transient failure, retrying (attempt ${transientAttempt + 1}/${TRANSIENT_RETRY_ATTEMPTS}): ${(err as Error).message}`
      );
      await sleep(500 * (transientAttempt + 1));
      return fetchContributionWindow(login, from, to, includeCalendar, depth, transientAttempt + 1);
    }
    const reason = `transient failure after retries: ${(err as Error).message}`;
    console.warn(`[github] ${login} window ${isoRange(from, to)} failed permanently: ${reason}`);
    return { aggregate: null, reason };
  }
}

async function fetchYearWindowRaw(login: string, _year: number, fromIso: string, toIso: string): Promise<WindowAggregate> {
  const result = await fetchContributionWindow(login, new Date(fromIso), new Date(toIso), false);
  if (!result.aggregate) throw new UnresolvedWindowError(result.reason ?? "unknown");
  return result.aggregate;
}

async function fetchLastYearWindowRaw(login: string, fromIso: string, toIso: string): Promise<WindowAggregate> {
  const result = await fetchContributionWindow(login, new Date(fromIso), new Date(toIso), true);
  if (!result.aggregate) throw new UnresolvedWindowError(result.reason ?? "unknown");
  return result.aggregate;
}

// Historical years never change once the year is over — cached hard (30
// days). The current year's window is still accumulating — short TTL. Two
// separate unstable_cache wrappers over the same underlying fetch so each
// gets its own namespace + TTL.
const cachedHistoricalYearWindow = unstable_cache(fetchYearWindowRaw, ["github-year-window-historical"], {
  revalidate: HISTORICAL_YEAR_CACHE_TTL_SECONDS,
});
const cachedCurrentYearWindow = unstable_cache(fetchYearWindowRaw, ["github-year-window-current"], {
  revalidate: CURRENT_YEAR_CACHE_TTL_SECONDS,
});
const cachedOrDirectHistoricalYearWindow = withDirectFallback(cachedHistoricalYearWindow, fetchYearWindowRaw);
const cachedOrDirectCurrentYearWindow = withDirectFallback(cachedCurrentYearWindow, fetchYearWindowRaw);

const cachedLastYearWindow = unstable_cache(fetchLastYearWindowRaw, ["github-lastyear-window"], {
  revalidate: LAST_YEAR_WINDOW_CACHE_TTL_SECONDS,
});
const cachedOrDirectLastYearWindow = withDirectFallback(cachedLastYearWindow, fetchLastYearWindowRaw);

// UnresolvedWindowError never gets durably cached (fetchYearWindowRaw throws
// instead of returning null — unstable_cache doesn't persist a thrown
// result), so a login whose 2019 chunk failed today genuinely retries 2019
// on the next attempt instead of being stuck on a cached "missing" for 30
// days.
async function getYearWindow(login: string, year: number, fromIso: string, toIso: string, isCurrentYear: boolean): Promise<WindowOutcome> {
  const fetcher = isCurrentYear ? cachedOrDirectCurrentYearWindow : cachedOrDirectHistoricalYearWindow;
  try {
    return { aggregate: await fetcher(login, year, fromIso, toIso) };
  } catch (err) {
    if (err instanceof UnresolvedWindowError) return { aggregate: null, reason: err.message };
    throw err;
  }
}

async function getLastYearWindow(login: string, fromIso: string, toIso: string): Promise<WindowOutcome> {
  try {
    return { aggregate: await cachedOrDirectLastYearWindow(login, fromIso, toIso) };
  } catch (err) {
    if (err instanceof UnresolvedWindowError) return { aggregate: null, reason: err.message };
    throw err;
  }
}

// Approximates the year a user "joined" each of their (max 3) GitHub orgs:
// the year of their earliest authored commit in a repo owned by that org.
// GitHub doesn't expose an org join date, and one REST search-commits call
// per org is the cheapest stand-in — capped at 3 so a profile with many
// orgs doesn't fan out into a pile of extra requests.
export async function fetchOrgJoinYears(
  login: string,
  orgLogins: string[]
): Promise<Record<string, number | null>> {
  const token = process.env.GITHUB_TOKEN;
  const result: Record<string, number | null> = {};

  for (const org of orgLogins.slice(0, 3)) {
    try {
      const q = encodeURIComponent(`author:${login} org:${org}`);
      const res = await withGithubGate(() =>
        fetch(`https://api.github.com/search/commits?q=${q}&sort=author-date&order=asc&per_page=1`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
          },
          next: { revalidate: 86400 },
        })
      );
      if (!res.ok) {
        result[org] = null;
        continue;
      }
      const json = await res.json();
      const date: string | undefined = json.items?.[0]?.commit?.author?.date;
      result[org] = date ? new Date(date).getFullYear() : null;
    } catch {
      result[org] = null;
    }
  }

  return result;
}

// The raw, uncached, chunked GraphQL fetch. Every individual request stays
// far under GitHub's per-request resource limit; a window that fails after
// retry/bisection is left out of contributionsByYear rather than fabricated
// as zero. When anything is missing, the assembled profile is marked
// incomplete and thrown as a PartialProfileError instead of returned
// directly — see getGithubProfile for what happens to it from there.
export async function fetchGithubProfile(login: string): Promise<GithubProfile | null> {
  if (!isValidGithubUsername(login)) return null;

  if (budgetIsLow()) {
    throw new GithubRateLimitError("GitHub GraphQL rate limit budget low, deferring to REST fallback");
  }

  try {
    const createdAtData = await githubGraphQL<CreatedAtResponse>(CREATED_AT_QUERY, { login });
    if (!createdAtData.user) return null;

    // UTC, not local getFullYear(): createdAt is a UTC ISO string ("...Z"),
    // and the server (or a dev machine in a different timezone) shouldn't
    // shift a Jan 1st UTC signup into the previous year's chunk range.
    const createdYear = new Date(createdAtData.user.createdAt).getUTCFullYear();
    const currentYear = new Date().getFullYear();

    const prSearch = `is:pr is:merged author:${login} -user:${login}`;
    const issueSearch = `is:issue is:closed author:${login}`;

    const base = await withRateLimitRetry("base", () =>
      githubGraphQL<BaseProfileResponse>(BASE_PROFILE_QUERY, { login, prSearch, issueSearch })
    );
    logQueryCost("base", base);
    if (!base.user) return null;
    const user = base.user;

    const now = cacheStableNow();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    // contributionYears ignores the query's from/to window and always
    // returns the user's real lifetime list of years with at least one
    // contribution — the authoritative "years we expect data for" (see the
    // BASE_PROFILE_QUERY comment). Falls back to createdYear..currentYear
    // only if the field itself is missing (a salvaged partial base
    // response) — a safety net, not the primary source.
    const expectedYears = user.contributionsCollection?.contributionYears?.length
      ? [...user.contributionsCollection.contributionYears].sort((a, b) => a - b)
      : Array.from({ length: currentYear - createdYear + 1 }, (_, i) => createdYear + i);

    const yearTasks = expectedYears.map((year) => ({ year, isCurrentYear: year === currentYear }));

    const [yearResults, lastYearOutcome, extraRepoPages] = await Promise.all([
      mapWithConcurrency(yearTasks, YEAR_CHUNK_CONCURRENCY, async (t) => {
        const start = Date.now();
        const fromIso = `${t.year}-01-01T00:00:00Z`;
        const toIso = t.isCurrentYear ? now.toISOString() : `${t.year + 1}-01-01T00:00:00Z`;
        const outcome = await getYearWindow(login, t.year, fromIso, toIso, t.isCurrentYear);
        return { year: t.year, outcome, cacheHit: Date.now() - start < CACHE_LATENCY_THRESHOLD_MS };
      }),
      getLastYearWindow(login, oneYearAgo.toISOString(), now.toISOString()),
      user.repositories
        ? fetchAdditionalRepoPages(login, user.repositories.pageInfo.endCursor, user.repositories.pageInfo.hasNextPage)
        : Promise.resolve({ repos: [], pagesFetched: 0 }),
    ]);

    const contributionsByYear: YearContribution[] = yearResults
      .filter((r): r is typeof r & { outcome: { aggregate: WindowAggregate } } => r.outcome.aggregate !== null)
      .map((r) => ({
        year: r.year,
        commits: r.outcome.aggregate.commits,
        pullRequests: r.outcome.aggregate.pullRequests,
        issues: r.outcome.aggregate.issues,
        reviews: r.outcome.aggregate.reviews,
        totalContributions: windowTotalContributions(r.outcome.aggregate),
      }));
    const missingYearResults = yearResults.filter((r) => r.outcome.aggregate === null);
    const missingYears = missingYearResults.map((r) => r.year);
    const yearCacheHits = yearResults.filter((r) => r.cacheHit).length;
    const lastYearWindow = lastYearOutcome.aggregate;

    const externalMergedPRs = base.externalMergedPRs ?? { issueCount: 0, nodes: [] };
    const externalMergedPRNodes = externalMergedPRs.nodes ?? [];
    const closedIssues = base.closedIssues ?? { issueCount: 0 };
    const repositories: GithubRepo[] = [...(user.repositories?.nodes.map(mapRepoNode) ?? []), ...extraRepoPages.repos];

    const maxExternalPRRepoStars = externalMergedPRNodes.reduce(
      (max, node) => Math.max(max, node.repository?.stargazerCount ?? 0),
      0
    );

    // Distinct 10k+ star repos with a merged external PR — each is its own
    // "World Cup Player" occurrence, keyed by repo name and dated by the
    // earliest merge (a repo can have several merged PRs from this user).
    const worldCupRepoMap = new Map<string, WorldCupRepo>();
    for (const node of externalMergedPRNodes) {
      const repo = node.repository;
      if (!repo || repo.stargazerCount < 10_000 || !node.mergedAt) continue;
      const year = new Date(node.mergedAt).getFullYear();
      const existing = worldCupRepoMap.get(repo.name);
      if (!existing || year < existing.year) {
        worldCupRepoMap.set(repo.name, { name: repo.name, stars: repo.stargazerCount, year });
      }
    }
    const worldCupRepos = [...worldCupRepoMap.values()].sort((a, b) => a.year - b.year);

    const chunksUsed = 2 /* createdAt probe + base */ + yearTasks.length + 1 /* lastYear */ + extraRepoPages.pagesFetched;
    const complete = missingYears.length === 0 && lastYearWindow !== null;

    const profile: GithubProfile = {
      login: user.login,
      name: user.name,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      location: user.location,
      company: user.company,
      createdAt: user.createdAt,
      followers: user.followers?.totalCount ?? 0,
      following: user.following?.totalCount ?? 0,
      publicRepos: user.repositories?.totalCount ?? 0,
      websiteUrl: user.websiteUrl,
      twitterUsername: user.twitterUsername,
      repositories,
      organizations: user.organizations?.nodes ?? [],
      contributionsByYear,
      lastYearCalendar: lastYearWindow?.calendar ?? [],
      lastYearCommits: lastYearWindow?.commits ?? 0,
      externalMergedPRs: externalMergedPRs.issueCount ?? 0,
      maxExternalPRRepoStars,
      closedIssues: closedIssues.issueCount ?? 0,
      worldCupRepos,
      degraded: false,
      complete,
      missingYears,
      computedAt: new Date().toISOString(),
      chunksUsed,
    };

    console.warn(
      `[github] profile ${login}: ${chunksUsed} chunks (${contributionsByYear.length}/${yearTasks.length} years, ` +
        `${yearCacheHits} from cache), ${repositories.length} repos, complete=${complete}, computedAt=${profile.computedAt}`
    );

    if (!complete) {
      const yearReasons = missingYearResults.map((r) => `${r.year}: ${r.outcome.reason ?? "unknown"}`).join(" | ");
      console.warn(
        `[github] ${login} profile PARTIAL — missing years: [${missingYears.join(", ")}]` +
          (yearReasons ? ` — ${yearReasons}` : "") +
          (lastYearOutcome.aggregate === null ? ` — lastYear window unresolved: ${lastYearOutcome.reason ?? "unknown"}` : "")
      );
      throw new PartialProfileError(profile);
    }

    return profile;
  } catch (err) {
    if (err instanceof GithubUserNotFoundError) return null;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Unified, cached, coalesced entrypoint — the ONE fetching layer every route
// (the individual /[username] page, the squad valuation pipeline, the OG PNG
// routes, and the dynamic SVG routes) goes through, instead of each calling
// fetchGithubProfile (and retrying/falling back) on its own.
// ---------------------------------------------------------------------------

const PROFILE_CACHE_TTL_SECONDS = 86400;
// A login currently served by the REST degraded fallback, or whose profile
// is only partial, is retried at most this often — see fetchDegradedProfile
// and the PartialProfileError handling in attemptProfile. Capped at 5
// minutes so a "the market is busy" state (see app/[username]/error.tsx)
// never lingers as long as a full day's worth of caching.
const RETRY_TTL_SECONDS = 300;

// GraphQL is unavailable or over budget (fetchGithubProfile threw something
// other than "user genuinely doesn't exist" or "partial"). Last resort, not
// a patch for merely-expensive queries — those are now cheap by
// construction (chunking) and self-healing (bisection). One REST /users
// lookup + one best-effort REST /users/.../repos call, both on a budget
// separate from GraphQL's points. Marked `degraded: true` and deliberately
// NOT cached for a full day so the next visit after GitHub recovers gets
// the full chunked profile again.
async function fetchDegradedProfile(login: string): Promise<GithubProfile | null> {
  const token = process.env.GITHUB_TOKEN;
  const headers = {
    Accept: "application/vnd.github+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const userRes = await withGithubGate(() => fetch(`https://api.github.com/users/${login}`, { headers, next: { revalidate: RETRY_TTL_SECONDS } }));
  if (userRes.status === 404) return null;
  if (userRes.status === 403 || userRes.status === 429) {
    const retryAfter = userRes.headers?.get("retry-after") ?? null;
    const remaining = userRes.headers?.get("x-ratelimit-remaining") ?? null;
    const isSecondary = remaining !== null && Number(remaining) > 0;
    throw new GithubRateLimitError(
      "GitHub REST fallback rate limit exceeded",
      retryAfter ? Number(retryAfter) : null,
      isSecondary ? "secondary" : "primary"
    );
  }
  if (!userRes.ok) throw new Error(`GitHub REST fallback failed: ${userRes.status}`);
  const u = await userRes.json();

  let repositories: GithubRepo[] = [];
  try {
    const reposRes = await withGithubGate(() =>
      fetch(`https://api.github.com/users/${login}/repos?per_page=100&type=owner`, { headers, next: { revalidate: RETRY_TTL_SECONDS } })
    );
    if (reposRes.ok) {
      const raw = (await reposRes.json()) as Array<{
        name: string;
        fork: boolean;
        stargazers_count: number;
        forks_count: number;
        language: string | null;
        created_at: string;
        pushed_at: string;
      }>;
      repositories = raw
        .filter((r) => !r.fork)
        .map((r) => ({
          name: r.name,
          stars: r.stargazers_count,
          forks: r.forks_count,
          language: r.language,
          createdAt: r.created_at,
          pushedAt: r.pushed_at,
        }))
        .sort((a, b) => b.stars - a.stars);
    }
  } catch {
    // repos are best-effort in the degraded path — a followers-only profile
    // still beats an error page.
  }

  console.warn(`[github] degraded REST fallback profile for ${login} (${repositories.length} repos)`);

  return {
    login: u.login,
    name: u.name ?? null,
    avatarUrl: u.avatar_url,
    bio: u.bio ?? null,
    location: u.location ?? null,
    company: u.company ?? null,
    createdAt: u.created_at,
    followers: u.followers ?? 0,
    following: u.following ?? 0,
    publicRepos: u.public_repos ?? repositories.length,
    websiteUrl: u.blog || null,
    twitterUsername: u.twitter_username ?? null,
    repositories,
    organizations: [],
    contributionsByYear: [],
    lastYearCalendar: [],
    lastYearCommits: 0,
    externalMergedPRs: 0,
    maxExternalPRRepoStars: 0,
    closedIssues: 0,
    worldCupRepos: [],
    degraded: true,
    complete: false,
    missingYears: [],
    computedAt: new Date().toISOString(),
    chunksUsed: 0,
  };
}

// Cross-invocation persistence for a FULLY successful (complete) profile —
// Next's Data Cache via unstable_cache. fetchGithubProfile THROWS
// PartialProfileError instead of returning an incomplete profile
// specifically so this 24h cache never persists one: when the wrapped
// function throws, unstable_cache doesn't write an entry at all, so any
// previously-cached complete profile for this login is left untouched and
// keeps being served (stale-while-revalidate) until a genuinely complete
// refresh succeeds.
const cachedFullProfile = unstable_cache(fetchGithubProfile, ["github-profile-full"], {
  revalidate: PROFILE_CACHE_TTL_SECONDS,
});
const cachedOrDirectFullProfile = withDirectFallback(cachedFullProfile, fetchGithubProfile);

// One attempt: full GraphQL profile, falling back to the REST degraded
// profile on total failure, or serving the embedded partial profile as-is
// when only some chunks are missing (real GraphQL data beats a REST stub).
// Only "missing GITHUB_TOKEN" is rethrown as unrecoverable.
async function attemptProfile(login: string): Promise<GithubProfile | null> {
  try {
    return await cachedOrDirectFullProfile(login);
  } catch (err) {
    if (err instanceof Error && err.message.includes("GITHUB_TOKEN")) throw err;
    if (err instanceof PartialProfileError) {
      console.warn(`[github] serving partial profile for ${login} (10min retry window, missing years re-fetched next attempt)`);
      return err.profile;
    }
    return fetchDegradedProfile(login);
  }
}

// Second, shorter-lived cache in front of the above — without it, a login
// that's currently degraded or partial would re-run the full
// retry+chunk+fallback cost on every single render forever (a permanent
// miss on cachedFullProfile). This bounds retries for a currently-troubled
// login to once per RETRY_TTL_SECONDS, while a successful COMPLETE outcome
// still lands durably in the 24h cache the moment it happens
// (cachedFullProfile above) — no separate write path needed.
const cachedAttemptProfile = unstable_cache(attemptProfile, ["github-profile-attempt"], {
  revalidate: RETRY_TTL_SECONDS,
});
const cachedOrDirectAttemptProfile = withDirectFallback(cachedAttemptProfile, attemptProfile);

// Same-process fast path: the last COMPLETE profile that actually succeeded
// for a login, kept only for this server instance's lifetime — a second
// line of defense for whenever even the Data Cache's stale-on-error has
// nothing. Only updated on `complete`, never on a partial/degraded result,
// so a later partial render can't regress a known-good complete profile.
const lastKnownGoodProfile = new Map<string, GithubProfile>();

// Request coalescing: concurrent callers (the page, an OG export, an SVG
// export, a squad valuation) asking for the same login at the same time
// share one in-flight fetch instead of each starting their own.
const profileInFlight = new Map<string, Promise<GithubProfile | null>>();

// The one fetching entrypoint every route should use: chunked + bisected
// GraphQL first, REST-degraded last resort, per-window + per-profile
// caching, stale-on-error, and coalescing — all in one place instead of
// duplicated per caller.
export function getGithubProfile(login: string): Promise<GithubProfile | null> {
  const existing = profileInFlight.get(login);
  if (existing) return existing;

  const promise = cachedOrDirectAttemptProfile(login)
    .then((profile) => {
      if (profile && profile.complete) lastKnownGoodProfile.set(login, profile);
      return profile;
    })
    .catch((err) => {
      if (err instanceof Error && err.message.includes("GITHUB_TOKEN")) throw err;
      const fallback = lastKnownGoodProfile.get(login);
      if (fallback) {
        console.warn(`[github] serving stale cached profile for ${login} after a hard failure`);
        return fallback;
      }
      throw err;
    })
    .finally(() => profileInFlight.delete(login));

  profileInFlight.set(login, promise);
  return promise;
}
