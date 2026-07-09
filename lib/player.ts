import type { GithubProfile, Player, SeasonStat, TransferRecord } from "./types";
import { computeValuationTimeline } from "./valuation";
import { computePosition, countDistinctLanguages, dominantLanguageForRepos } from "./positions";
import { computeStreaks, detectInjuries } from "./injuries";
import { resolveBirthPlace, resolveNationality } from "./geo";
import { calculateAgeYears, formatDate, formatDateTime } from "./format";
import { computeRatings } from "./ratings";
import { buildScoutReport } from "./scoutReport";

const CONTRACT_UNTIL = "31/12/2999";

function daysInYear(year: number): number {
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return isLeap ? 366 : 365;
}

function buildSeasons(profile: GithubProfile): SeasonStat[] {
  const currentYear = new Date().getFullYear();

  const seasons = profile.contributionsByYear.map((c) => {
    // Solo tenemos calendario diario exacto para el último año rodante; para
    // temporadas pasadas aproximamos "días activos" con una cota superior
    // razonable (no puede haber más días activos que contribuciones totales).
    const activeDays =
      c.year === currentYear
        ? profile.lastYearCalendar.filter((d) => d.count > 0).length
        : Math.min(c.totalContributions, daysInYear(c.year));

    return {
      year: c.year,
      activeDays,
      commits: c.commits,
      pullRequests: c.pullRequests,
      issues: c.issues,
      totalContributions: c.totalContributions,
      hasData: c.totalContributions > 0,
    };
  });

  return seasons.sort((a, b) => b.year - a.year);
}

function buildCurrentClub(profile: GithubProfile): string {
  if (profile.company) return profile.company.replace(/^@/, "");
  if (profile.organizations.length > 0) {
    const org = profile.organizations[0];
    return org.name ?? org.login;
  }
  return "Agente libre";
}

function buildTransfers(profile: GithubProfile, marketValueByYear: Map<number, number>): TransferRecord[] {
  const createdYear = new Date(profile.createdAt).getFullYear();
  const currentYear = new Date().getFullYear();
  const years = profile.contributionsByYear.map((c) => c.year).sort((a, b) => a - b);

  const transfers: TransferRecord[] = [
    { season: `${createdYear}`, from: "Sin club", to: "GitHub Academy", fee: "Sin costo" },
  ];

  // Cambios de lenguaje dominante entre temporadas (repos creados ese año).
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
        fee: fee > 0 ? formatFeeValue(fee) : "Cesión",
      });
    }
    if (dominant) previousLanguage = dominant;
  }

  // Ingresos a organizaciones: GitHub no expone la fecha de alta a una org,
  // así que se aproxima repartiendo las organizaciones en orden a lo largo
  // de la vida de la cuenta.
  const span = Math.max(currentYear - createdYear, 1);
  profile.organizations.forEach((org, index) => {
    const year =
      profile.organizations.length <= 1
        ? currentYear
        : createdYear + Math.round(((index + 1) / (profile.organizations.length + 1)) * span);
    transfers.push({
      season: `${Math.min(year, currentYear)}`,
      from: "Agente libre",
      to: org.name ?? org.login,
      fee: "Traspaso libre",
    });
  });

  return transfers.sort((a, b) => Number(a.season) - Number(b.season));
}

function formatFeeValue(value: number): string {
  if (value < 1_000_000) return `${Math.round(value / 1000)} mil €`;
  return `${(value / 1_000_000).toFixed(2).replace(".", ",")} mill. €`;
}

export function buildPlayer(profile: GithubProfile): Player {
  const valuation = computeValuationTimeline(profile);
  const { position, topLanguage } = computePosition(profile.repositories);
  const injuries = detectInjuries(profile.lastYearCalendar);
  const streaks = computeStreaks(profile.lastYearCalendar);
  const seasons = buildSeasons(profile);
  const nationality = resolveNationality(profile.location);

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
    currentClub: buildCurrentClub(profile),
    joinedDate: formatDate(profile.createdAt),
    joinedYear: new Date(profile.createdAt).getFullYear(),
    contractUntil: CONTRACT_UNTIL,
    birthDate: formatDate(profile.createdAt),
    age: accountAgeYears,
    birthPlace: resolveBirthPlace(profile.location),
    nationalityFlag: nationality.flag,
    nationalityName: nationality.countryName,
    agent: profile.twitterUsername ? `@${profile.twitterUsername}` : "Familiar",
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
    marketValue: valuation.current,
    marketValueFormatted: valuation.currentFormatted,
    marketValueHistory: valuation.history,
    recordValue: valuation.record,
    seasons,
    transfers: buildTransfers(profile, marketValueByYear),
    injuries,
  };
}
