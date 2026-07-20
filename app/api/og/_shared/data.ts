import { getGithubProfile } from "@/lib/github";
import { buildPlayer } from "@/lib/player";
import type { Player } from "@/lib/types";

export type OgPlayerResult =
  | { status: "ok"; player: Player }
  | { status: "not_found" }
  // GraphQL and the REST last-resort both failed (rate limit exhausted,
  // GitHub down) with nothing cached to fall back to — distinct from
  // not_found so the export routes can render a "busy, try again" card
  // instead of a permanent-looking 404.
  | { status: "rate_limited" };

export async function loadOgPlayer(username: string): Promise<OgPlayerResult> {
  try {
    const profile = await getGithubProfile(username);
    if (!profile) return { status: "not_found" };
    return { status: "ok", player: buildPlayer(profile) };
  } catch (err) {
    console.warn(`[og] failed to load ${username}: ${(err as Error).message}`);
    return { status: "rate_limited" };
  }
}
