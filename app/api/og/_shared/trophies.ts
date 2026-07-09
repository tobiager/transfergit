import { evaluateAchievements, type Tier } from "@/lib/achievements";
import type { Player } from "@/lib/types";

const TIER_PRIORITY: Record<Tier, number> = { "ballon-dor": 0, international: 1, squad: 2 };

export interface OgTrophy {
  id: string;
  name: string;
  tier: Tier;
}

// Unlocked achievements for the OG cards' trophy row, ranked ballon-dor >
// international > squad and capped to `limit`.
export function topUnlockedTrophies(player: Player, limit: number): OgTrophy[] {
  const unlocked = evaluateAchievements(player)
    .filter((r) => r.unlocked)
    .map((r) => ({ id: r.achievement.id, name: r.achievement.name, tier: r.achievement.tier }))
    .sort((a, b) => TIER_PRIORITY[a.tier] - TIER_PRIORITY[b.tier]);

  return unlocked.slice(0, limit);
}
