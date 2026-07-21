import type { GithubProfile, MarketValuePoint } from "./types";
import { calculateAgeYears, formatMarketValue } from "./format.ts";

// -----------------------------------------------------------------------
// Market value formula (easy to tune: everything is a constant here).
//
//   value = baseValue
//         + totalCommits        × 800
//         + totalStars          × 4_000
//         + followers           × 6_000
//         + totalPRs            × 2_500
//         + reposOver10Stars    × 25_000
//
//   × form multiplier:  1 + min(commitsLast12Months / 2000, 0.5)
//   × age multiplier:   accounts < 2 years → 0.8 (young prospect)
//                        accounts > 6 years → 1.1 (veteran)
// -----------------------------------------------------------------------

const BASE_VALUE = 50_000;
const COMMIT_WEIGHT = 800;
const STAR_WEIGHT = 4_000;
const FOLLOWER_WEIGHT = 6_000;
const PR_WEIGHT = 2_500;
const POPULAR_REPO_WEIGHT = 25_000;
// Exported: also used by lib/squad/valuation.ts's light batch valuation,
// which counts "popular repos" from its own reduced GraphQL fetch without
// going through computeValuationTimeline.
export const POPULAR_REPO_STAR_THRESHOLD = 10;

const FORM_WINDOW_COMMITS = 2_000;
const FORM_MULTIPLIER_CAP = 0.5;

const YOUNG_ACCOUNT_YEARS = 2;
const YOUNG_ACCOUNT_MULTIPLIER = 0.8;
const VETERAN_ACCOUNT_YEARS = 6;
const VETERAN_ACCOUNT_MULTIPLIER = 1.1;

export interface ValuationInput {
  commitsTotal: number;
  starsTotal: number;
  followers: number;
  prsTotal: number;
  reposOver10Stars: number;
  commitsLast12Months: number;
  accountAgeYears: number;
}

export function computeMarketValue(input: ValuationInput): number {
  const baseValue =
    BASE_VALUE +
    input.commitsTotal * COMMIT_WEIGHT +
    input.starsTotal * STAR_WEIGHT +
    input.followers * FOLLOWER_WEIGHT +
    input.prsTotal * PR_WEIGHT +
    input.reposOver10Stars * POPULAR_REPO_WEIGHT;

  const formMultiplier =
    1 + Math.min(input.commitsLast12Months / FORM_WINDOW_COMMITS, FORM_MULTIPLIER_CAP);

  const ageMultiplier =
    input.accountAgeYears < YOUNG_ACCOUNT_YEARS
      ? YOUNG_ACCOUNT_MULTIPLIER
      : input.accountAgeYears > VETERAN_ACCOUNT_YEARS
        ? VETERAN_ACCOUNT_MULTIPLIER
        : 1;

  return baseValue * formMultiplier * ageMultiplier;
}

export interface ValuationTimeline {
  history: MarketValuePoint[];
  current: number;
  currentFormatted: string;
  record: { value: number; formatted: string; year: number };
}

// GitHub doesn't expose historical stars/followers, so past years are
// approximated using the "as of that date" state: repos already created
// with their current star count, and current followers for every year.
// A deliberate (documented) simplification, fitting for a meme project.
export function computeValuationTimeline(profile: GithubProfile): ValuationTimeline {
  const createdYear = new Date(profile.createdAt).getFullYear();
  const years = profile.contributionsByYear.map((c) => c.year).sort((a, b) => a - b);
  const currentYear = new Date().getFullYear();

  // No contribution-year data at all (the REST degraded fallback in
  // lib/github.ts's getGithubProfile — GraphQL down/over budget — doesn't
  // have it). A real, if reduced, value from what the REST fallback DOES
  // have (followers, repos, account age) beats collapsing to the bare
  // BASE_VALUE floor.
  if (years.length === 0) {
    const starsTotal = profile.repositories.reduce((sum, r) => sum + r.stars, 0);
    const reposOver10Stars = profile.repositories.filter((r) => r.stars > POPULAR_REPO_STAR_THRESHOLD).length;
    const value = computeMarketValue({
      commitsTotal: 0,
      starsTotal,
      followers: profile.followers,
      prsTotal: 0,
      reposOver10Stars,
      commitsLast12Months: profile.lastYearCommits,
      accountAgeYears: calculateAgeYears(profile.createdAt),
    });
    return {
      history: [{ year: currentYear, value }],
      current: value,
      currentFormatted: formatMarketValue(value),
      record: { value, formatted: formatMarketValue(value), year: currentYear },
    };
  }

  const history: MarketValuePoint[] = years.map((year) => {
    const cumulativeCommits = profile.contributionsByYear
      .filter((c) => c.year <= year)
      .reduce((sum, c) => sum + c.commits, 0);
    const cumulativePRs = profile.contributionsByYear
      .filter((c) => c.year <= year)
      .reduce((sum, c) => sum + c.pullRequests, 0);

    const reposUntilYear = profile.repositories.filter(
      (repo) => new Date(repo.createdAt).getFullYear() <= year
    );
    const starsUntilYear = reposUntilYear.reduce((sum, r) => sum + r.stars, 0);
    const popularRepos = reposUntilYear.filter(
      (r) => r.stars > POPULAR_REPO_STAR_THRESHOLD
    ).length;

    const isCurrentYear = year === currentYear;
    const commitsLast12Months = isCurrentYear
      ? profile.lastYearCommits
      : profile.contributionsByYear.find((c) => c.year === year)?.commits ?? 0;

    const accountAgeYears = isCurrentYear
      ? calculateAgeYears(profile.createdAt)
      : year - createdYear;

    const value = computeMarketValue({
      commitsTotal: cumulativeCommits,
      starsTotal: starsUntilYear,
      followers: profile.followers,
      prsTotal: cumulativePRs,
      reposOver10Stars: popularRepos,
      commitsLast12Months,
      accountAgeYears,
    });

    return { year, value };
  });

  const current = history.length > 0 ? history[history.length - 1].value : BASE_VALUE;
  const record = history.reduce(
    (max, point) => (point.value > max.value ? point : max),
    history[0] ?? { year: createdYear, value: BASE_VALUE }
  );

  return {
    history,
    current,
    currentFormatted: formatMarketValue(current),
    record: { value: record.value, formatted: formatMarketValue(record.value), year: record.year },
  };
}
