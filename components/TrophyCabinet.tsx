import { evaluateAchievements, topTrophies, countHonours } from "@/lib/achievements";
import type { Player } from "@/lib/types";
import { resolveTrophyIconSrc } from "@/lib/trophyAssets";
import { TrophyCabinetClient, type TrophyRow } from "./TrophyCabinetClient";

export function TrophyCabinet({ player }: { player: Player }) {
  // Achievement objects carry check()/progress()/dateHint()/occurrences()
  // functions, which aren't serializable across the server -> client
  // component boundary — so only plain data is passed down.
  const results = evaluateAchievements(player);

  const toRow = (r: (typeof results)[number]): TrophyRow => ({
    id: r.achievement.id,
    name: r.achievement.name,
    description: r.achievement.description,
    category: r.achievement.category,
    tier: r.achievement.tier,
    unlocked: r.unlocked,
    progress: r.progress,
    progressLabel: r.achievement.progressLabel ?? null,
    dateHint: r.dateHint,
    occurrences: r.occurrences,
    iconSrc: resolveTrophyIconSrc(r.achievement.id),
  });

  const allTrophies = results.map(toRow);
  const top5 = topTrophies(results, 5).map(toRow);
  const honours = countHonours(results);
  const unlockedCount = results.filter((r) => r.unlocked).length;

  return (
    <TrophyCabinetClient
      allTrophies={allTrophies}
      top5={top5}
      honours={honours}
      unlockedCount={unlockedCount}
    />
  );
}
