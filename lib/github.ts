import "server-only";
import type { ContributionDay, GithubOrg, GithubProfile, GithubRepo, YearContribution } from "./types";

const GITHUB_GRAPHQL_ENDPOINT = "https://api.github.com/graphql";

class GithubUserNotFoundError extends Error {}

async function githubGraphQL<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      "Missing GITHUB_TOKEN environment variable. Copy .env.example to .env.local and fill in a Personal Access Token."
    );
  }

  const res = await fetch(GITHUB_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`GitHub GraphQL responded ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();

  if (json.errors?.some((e: { type?: string }) => e.type === "NOT_FOUND")) {
    throw new GithubUserNotFoundError();
  }
  if (json.errors) {
    throw new Error(`GitHub GraphQL error: ${JSON.stringify(json.errors)}`);
  }

  return json.data as T;
}

// The contributionsCollection API only accepts ranges of at most one year,
// so we request one alias per calendar year from account creation until
// today, all in a single request.
function buildYearAlias(year: number, isCurrentYear: boolean) {
  const from = `${year}-01-01T00:00:00Z`;
  const to = isCurrentYear
    ? new Date().toISOString()
    : `${year + 1}-01-01T00:00:00Z`;

  return `
    y${year}: contributionsCollection(from: "${from}", to: "${to}") {
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      totalPullRequestReviewContributions
      contributionCalendar {
        totalContributions
      }
    }
  `;
}

// Rolling 365-day window to detect "injuries" (gaps with no contributions)
// at daily granularity.
const LAST_YEAR_ALIAS = `
  lastYear: contributionsCollection(from: $lastYearFrom, to: $lastYearTo) {
    totalCommitContributions
    contributionCalendar {
      weeks {
        contributionDays {
          date
          contributionCount
        }
      }
    }
  }
`;

interface CreatedAtResponse {
  user: { createdAt: string } | null;
}

interface SearchIssueCount {
  issueCount: number;
}

interface PullRequestSearchResult extends SearchIssueCount {
  nodes: Array<{ repository?: { stargazerCount: number } }>;
}

interface FullProfileResponse {
  externalMergedPRs: PullRequestSearchResult;
  closedIssues: SearchIssueCount;
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
    followers: { totalCount: number };
    following: { totalCount: number };
    repositories: {
      totalCount: number;
      nodes: Array<{
        name: string;
        stargazerCount: number;
        forkCount: number;
        primaryLanguage: { name: string } | null;
        createdAt: string;
        pushedAt: string;
      }>;
    };
    organizations: { nodes: GithubOrg[] };
    lastYear: {
      totalCommitContributions: number;
      contributionCalendar: {
        weeks: Array<{
          contributionDays: Array<{ date: string; contributionCount: number }>;
        }>;
      };
    };
  } | null;
}

interface YearAliasData {
  totalCommitContributions: number;
  totalPullRequestContributions: number;
  totalIssueContributions: number;
  totalPullRequestReviewContributions: number;
  contributionCalendar: { totalContributions: number };
}

export async function fetchGithubProfile(login: string): Promise<GithubProfile | null> {
  try {
    const createdAtData = await githubGraphQL<CreatedAtResponse>(
      `query($login: String!) { user(login: $login) { createdAt } }`,
      { login }
    );

    if (!createdAtData.user) return null;

    const createdYear = new Date(createdAtData.user.createdAt).getFullYear();
    const currentYear = new Date().getFullYear();

    const yearAliases: string[] = [];
    for (let year = createdYear; year <= currentYear; year++) {
      yearAliases.push(buildYearAlias(year, year === currentYear));
    }

    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    // Achievement-only signals (Open Source Hero, World Cup Player, Bug
    // Catcher): merged PRs / closed issues authored by the user outside of
    // their own repos. Cheaper as a search query than paginating every PR.
    const prSearch = `is:pr is:merged author:${login} -user:${login}`;
    const issueSearch = `is:issue is:closed author:${login}`;

    const query = `
      query($login: String!, $lastYearFrom: DateTime!, $lastYearTo: DateTime!, $prSearch: String!, $issueSearch: String!) {
        externalMergedPRs: search(query: $prSearch, type: ISSUE, first: 50) {
          issueCount
          nodes {
            ... on PullRequest {
              repository { stargazerCount }
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
            nodes {
              name
              stargazerCount
              forkCount
              primaryLanguage { name }
              createdAt
              pushedAt
            }
          }
          organizations(first: 20) {
            nodes { login avatarUrl name }
          }
          ${LAST_YEAR_ALIAS}
          ${yearAliases.join("\n")}
        }
      }
    `;

    const data = await githubGraphQL<FullProfileResponse>(query, {
      login,
      lastYearFrom: oneYearAgo.toISOString(),
      lastYearTo: now.toISOString(),
      prSearch,
      issueSearch,
    });

    if (!data.user) return null;
    const user = data.user;

    const repositories: GithubRepo[] = user.repositories.nodes.map((repo) => ({
      name: repo.name,
      stars: repo.stargazerCount,
      forks: repo.forkCount,
      language: repo.primaryLanguage?.name ?? null,
      createdAt: repo.createdAt,
      pushedAt: repo.pushedAt,
    }));

    const userWithYears = user as unknown as Record<string, YearAliasData | undefined>;

    const contributionsByYear: YearContribution[] = [];
    for (let year = createdYear; year <= currentYear; year++) {
      const key = `y${year}`;
      const yearData = userWithYears[key];
      if (!yearData) continue;
      contributionsByYear.push({
        year,
        commits: yearData.totalCommitContributions,
        pullRequests: yearData.totalPullRequestContributions,
        issues: yearData.totalIssueContributions,
        reviews: yearData.totalPullRequestReviewContributions,
        totalContributions: yearData.contributionCalendar.totalContributions,
      });
    }

    const lastYearCalendar: ContributionDay[] = user.lastYear.contributionCalendar.weeks.flatMap(
      (week) =>
        week.contributionDays.map((day) => ({
          date: day.date,
          count: day.contributionCount,
        }))
    );

    const maxExternalPRRepoStars = data.externalMergedPRs.nodes.reduce(
      (max, node) => Math.max(max, node.repository?.stargazerCount ?? 0),
      0
    );

    const profile: GithubProfile = {
      login: user.login,
      name: user.name,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      location: user.location,
      company: user.company,
      createdAt: user.createdAt,
      followers: user.followers.totalCount,
      following: user.following.totalCount,
      publicRepos: user.repositories.totalCount,
      websiteUrl: user.websiteUrl,
      twitterUsername: user.twitterUsername,
      repositories,
      organizations: user.organizations.nodes,
      contributionsByYear,
      lastYearCalendar,
      lastYearCommits: user.lastYear.totalCommitContributions,
      externalMergedPRs: data.externalMergedPRs.issueCount,
      maxExternalPRRepoStars,
      closedIssues: data.closedIssues.issueCount,
    };

    return profile;
  } catch (err) {
    if (err instanceof GithubUserNotFoundError) return null;
    throw err;
  }
}
