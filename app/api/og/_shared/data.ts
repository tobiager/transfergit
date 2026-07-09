import { fetchGithubProfile } from "@/lib/github";
import { buildPlayer } from "@/lib/player";
import type { Player } from "@/lib/types";

export async function loadOgPlayer(username: string): Promise<Player | null> {
  const profile = await fetchGithubProfile(username);
  if (!profile) return null;
  return buildPlayer(profile);
}
