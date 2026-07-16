import "server-only";
import { GithubRateLimitError } from "../github.ts";
import type { Contributor } from "./types";

export class RepoNotFoundError extends Error {}
export class NotEnoughPlayersError extends Error {}

const MIN_HUMAN_CONTRIBUTORS = 3;
const MAX_SQUAD_SIZE = 30;

interface RestContributor {
  login: string;
  avatar_url: string;
  contributions: number;
  type: "User" | "Bot" | "Organization";
}

function isBot(c: RestContributor): boolean {
  return c.type === "Bot" || c.login.endsWith("[bot]");
}

// Top 30 human contributors of a repo, ranked by commits. REST is used
// because GitHub's GraphQL API doesn't expose per-repo contributor stats.
export async function fetchTopContributors(owner: string, repo: string): Promise<Contributor[]> {
  const token = process.env.GITHUB_TOKEN;
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=${MAX_SQUAD_SIZE}&anon=false`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      next: { revalidate: 86400 },
    }
  );

  if (res.status === 404) {
    throw new RepoNotFoundError(`Repository ${owner}/${repo} not found`);
  }
  if (res.status === 403 || res.status === 429) {
    throw new GithubRateLimitError("GitHub API rate limit exceeded");
  }
  if (!res.ok) {
    throw new Error(`GitHub REST responded ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as RestContributor[];
  const humans = data
    .filter((c) => !isBot(c))
    .sort((a, b) => b.contributions - a.contributions)
    .map((c) => ({ login: c.login, avatarUrl: c.avatar_url, commits: c.contributions }));

  if (humans.length < MIN_HUMAN_CONTRIBUTORS) {
    throw new NotEnoughPlayersError(
      `${owner}/${repo} has only ${humans.length} human contributor(s), need at least ${MIN_HUMAN_CONTRIBUTORS}`
    );
  }

  return humans;
}
