import type { AchievementStats, GithubOrg, GithubProfile, Player, SeasonStat, TransferRecord } from "./types";
import type { StreakInfo } from "./injuries";
import { computeValuationTimeline } from "./valuation";
import { computePosition, countDistinctLanguages, dominantLanguageForRepos } from "./positions";
import { computeMaxGapDays, computeStreaks, detectInjuries } from "./injuries";
import { resolveBirthPlace, resolveNationality } from "./geo";
import { calculateAgeYears, formatDate, formatDateTime, formatMarketValue } from "./format";
import { computeRatings } from "./ratings";
import { buildScoutReport } from "./scoutReport";

function daysInYear(year: number): number {
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return isLeap ? 366 : 365;
}

function buildSeasons(profile: GithubProfile): SeasonStat[] {
  const currentYear = new Date().getFullYear();

  const seasons: SeasonStat[] = profile.contributionsByYear.map((c) => {
    // We only have an exact daily calendar for the rolling last year; for
    // past seasons we approximate "active days" with a reasonable upper
    // bound (can't have more active days than total contributions).
    const activeDays =
      c.year === currentYear
        ? profile.lastYearCalendar.filter((d) => d.count > 0).length
        : Math.min(c.totalContributions, daysInYear(c.year));

    return {
      year: c.year,
      activeDays,
      commits: c.commits,
      pullRequests: c.pullRequests,
      reviews: c.reviews,
      issues: c.issues,
      totalContributions: c.totalContributions,
      hasData: c.totalContributions > 0,
    };
  });

  // A missing year is real (GitHub's contributionYears says it has data),
  // it just didn't resolve yet — a real placeholder row ("syncing…" in the
  // UI), never a silently skipped year. See GithubProfile.missingYears.
  for (const year of profile.missingYears) {
    seasons.push({
      year,
      activeDays: 0,
      commits: 0,
      pullRequests: 0,
      reviews: 0,
      issues: 0,
      totalContributions: 0,
      hasData: false,
      pending: true,
    });
  }

  return seasons.sort((a, b) => b.year - a.year);
}

interface CurrentClub {
  name: string;
  avatar: string | null;
}

function buildCurrentClub(profile: GithubProfile): CurrentClub {
  if (profile.organizations.length > 0) {
    const org = profile.organizations[0];
    return { name: org.name ?? org.login, avatar: org.avatarUrl };
  }
  // GitHub's GraphQL `organizations` connection only lists memberships the
  // org has made public, which many accounts (e.g. torvalds/Linux
  // Foundation) don't — even though the user's free-text "company" field
  // still names it. Fall back to that before giving up.
  if (profile.company) return { name: profile.company.replace(/^@/, ""), avatar: null };
  return { name: "Free Agent", avatar: null };
}

function buildTransfers(profile: GithubProfile, marketValueByYear: Map<number, number>): TransferRecord[] {
  const createdYear = new Date(profile.createdAt).getFullYear();
  const currentYear = new Date().getFullYear();
  const years = profile.contributionsByYear.map((c) => c.year).sort((a, b) => a - b);

  const transfers: TransferRecord[] = [
    { season: `${createdYear}`, from: "No club", to: "GitHub Academy", fee: "Free transfer" },
  ];

  // Dominant language changes between seasons (repos created that year).
  let previousLanguage: string | null = null;
  for (const year of years) {
    const reposThisYear = profile.repositories.filter(
      (r) => new Date(r.createdAt).getFullYear() === year
    );
    const dominant: string | null = dominantLanguageForRepos(reposThisYear) ?? previousLanguage;
    if (dominant && previousLanguage && dominant !== previousLanguage) {
      const yearValue = marketValueByYear.get(year) ?? 0;
      const fee = Math.round(yearValue * 0.15);
      transfers.push({
        season: `${year}`,
        from: previousLanguage,
        to: dominant,
        fee: fee > 0 ? formatMarketValue(fee) : "Loan",
      });
    }
    if (dominant) previousLanguage = dominant;
  }

  // Joining organizations: GitHub doesn't expose the join date to an org,
  // so it's approximated by spreading the organizations in order across
  // the account's lifetime.
  const span = Math.max(currentYear - createdYear, 1);
  profile.organizations.forEach((org, index) => {
    const year =
      profile.organizations.length <= 1
        ? currentYear
        : createdYear + Math.round(((index + 1) / (profile.organizations.length + 1)) * span);
    transfers.push({
      season: `${Math.min(year, currentYear)}`,
      from: "Free Agent",
      to: org.name ?? org.login,
      fee: "Free transfer",
    });
  });

  return transfers.sort((a, b) => Number(a.season) - Number(b.season));
}

// Richer transfer history for accounts with orgs whose join year we could
// resolve (see fetchOrgJoinYears): a real multi-club career instead of the
// single "GitHub Academy" origin move. Returns null when no org join year
// could be resolved, so the caller can fall back to buildTransfers().
export function buildOrgTransfers(
  profile: GithubProfile,
  orgJoinYears: Record<string, number | null>,
  marketValueByYear: Map<number, number>
): TransferRecord[] | null {
  const createdYear = new Date(profile.createdAt).getFullYear();

  const moves = profile.organizations
    .map((org) => ({ org, year: orgJoinYears[org.login] }))
    .filter((m): m is { org: GithubOrg; year: number } => m.year != null)
    .sort((a, b) => a.year - b.year);

  if (moves.length === 0) return null;

  const records: TransferRecord[] = [
    { season: `${createdYear}`, from: "No club", to: "GitHub Academy", fee: "Free transfer" },
  ];

  let previousClub = "GitHub Academy";
  for (const { org, year } of moves) {
    const clubName = org.name ?? org.login;
    const yearValue = marketValueByYear.get(year);
    records.push({
      season: `${Math.max(year, createdYear)}`,
      from: previousClub,
      to: clubName,
      fee: yearValue ? formatMarketValue(yearValue) : "Free transfer",
    });
    previousClub = clubName;
  }

  return records;
}

// A full calendar year with zero contributions, followed by a later year
// with contributions again — the "Loan Spell" achievement.
function detectLoanSpell(profile: GithubProfile): boolean {
  const currentYear = new Date().getFullYear();
  const years = [...profile.contributionsByYear].sort((a, b) => a.year - b.year);

  for (let i = 0; i < years.length; i++) {
    const year = years[i];
    if (year.year >= currentYear) continue; // skip the in-progress current year
    if (year.totalContributions > 0) continue;
    const hasLaterActivity = years.slice(i + 1).some((y) => y.totalContributions > 0);
    if (hasLaterActivity) return true;
  }
  return false;
}

function buildAchievementStats(
  profile: GithubProfile,
  extra: { totalForks: number; languageCount: number; streaks: StreakInfo; accountAgeYears: number }
): AchievementStats {
  const maxRepoStars = profile.repositories.reduce((max, r) => Math.max(max, r.stars), 0);

  const maxCommitsYear = profile.contributionsByYear.reduce(
    (best, c) => (c.commits > best.commits ? c : best),
    { year: profile.contributionsByYear[0]?.year ?? new Date().getFullYear(), commits: 0 }
  );

  return {
    maxRepoStars,
    totalForks: extra.totalForks,
    languageCount: extra.languageCount,
    externalMergedPRs: profile.externalMergedPRs,
    maxExternalPRRepoStars: profile.maxExternalPRRepoStars,
    closedIssues: profile.closedIssues,
    followers: profile.followers,
    longestStreakDays: extra.streaks.longest,
    publicRepos: profile.publicRepos,
    accountAgeYears: extra.accountAgeYears,
    maxCommitsInYear: maxCommitsYear.commits,
    maxCommitsYear: maxCommitsYear.year,
    maxInactivityGapDays: computeMaxGapDays(profile.lastYearCalendar),
    hadLoanSpell: detectLoanSpell(profile),
    // TODO: needs commit-level data (per-commit author timestamp + weekday)
    // that the current contributionsCollection query doesn't fetch. Would
    // require paginating defaultBranchRef.target.history per repo, which is
    // too expensive to run on every profile view. Left disabled.
    hasFridayEveningCommit: false,
  };
}

export function buildPlayer(profile: GithubProfile): Player {
  const valuation = computeValuationTimeline(profile);
  const { position, topLanguage } = computePosition(profile.repositories);
  const injuries = detectInjuries(profile.lastYearCalendar);
  const streaks = computeStreaks(profile.lastYearCalendar);
  const seasons = buildSeasons(profile);
  const nationality = resolveNationality(profile.location);
  const club = buildCurrentClub(profile);

  const marketValueByYear = new Map(valuation.history.map((p) => [p.year, p.value]));

  const totalStars = profile.repositories.reduce((sum, r) => sum + r.stars, 0);
  const totalForks = profile.repositories.reduce((sum, r) => sum + r.forks, 0);
  const totalPullRequests = profile.contributionsByYear.reduce((sum, c) => sum + c.pullRequests, 0);
  const totalReviews = profile.contributionsByYear.reduce((sum, c) => sum + c.reviews, 0);
  const reposOver10Stars = profile.repositories.filter((r) => r.stars > 10).length;
  const languageCount = countDistinctLanguages(profile.repositories);
  const accountAgeYears = calculateAgeYears(profile.createdAt);

  const ratings = computeRatings({
    commitsLast12Months: profile.lastYearCommits,
    starsTotal: totalStars,
    pullRequestsTotal: totalPullRequests,
    reviewsTotal: totalReviews,
    longestStreakDays: streaks.longest,
    languageCount,
  });

  const scoutReport = buildScoutReport({
    commitsLastYear: profile.lastYearCommits,
    starsTotal: totalStars,
    followersTotal: profile.followers,
    currentStreakDays: streaks.current,
    accountAgeYears,
    languageCount,
    reposOver10Stars,
    longestStreakDays: streaks.longest,
  });

  return {
    login: profile.login,
    name: profile.name ?? profile.login,
    avatarUrl: profile.avatarUrl,
    bio: profile.bio,
    currentClub: club.name,
    currentClubAvatar: club.avatar,
    joinedDate: formatDate(profile.createdAt),
    joinedYear: new Date(profile.createdAt).getFullYear(),
    birthDate: formatDate(profile.createdAt),
    age: accountAgeYears,
    birthPlace: resolveBirthPlace(profile.location),
    nationalityName: nationality.countryName ?? "Unknown",
    nationalityIso2: nationality.iso2,
    agent: profile.twitterUsername ? `@${profile.twitterUsername}` : "Family",
    provider: topLanguage,
    position,
    scoutReport,
    ratings,
    marketValueUpdatedAt: formatDateTime(new Date().toISOString()),
    trophies: {
      stars: totalStars,
      forks: totalForks,
      repos: profile.publicRepos,
      followers: profile.followers,
    },
    achievementStats: buildAchievementStats(profile, {
      totalForks,
      languageCount,
      streaks,
      accountAgeYears,
    }),
    marketValue: valuation.current,
    marketValueFormatted: valuation.currentFormatted,
    marketValueHistory: valuation.history,
    recordValue: valuation.record,
    seasons,
    transfers: buildTransfers(profile, marketValueByYear),
    injuries,
    worldCupRepos: profile.worldCupRepos,
    dataCompleteness: {
      complete: profile.complete,
      missingYears: profile.missingYears,
      degraded: profile.degraded,
    },
  };
}
