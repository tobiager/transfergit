import { evaluateAchievements } from "@/lib/achievements";
import type { Player } from "@/lib/types";
import { resolveTrophyIconSrc } from "@/lib/trophyAssets";
import { TrophyCabinetGrid } from "./TrophyCabinetGrid";
import { CountUp } from "./CountUp";
import { SectionHeader } from "./SectionHeader";

export function TrophyCabinet({ player }: { player: Player }) {
  // Achievement objects carry check()/progress()/dateHint() functions, which
  // aren't serializable across the server -> client component boundary — so
  // only plain data is passed down to the (client) grid.
  const results = evaluateAchievements(player).map(({ achievement, unlocked, progress, dateHint }) => ({
    id: achievement.id,
    name: achievement.name,
    description: achievement.description,
    category: achievement.category,
    tier: achievement.tier,
    unlocked,
    progress,
    dateHint,
    iconSrc: resolveTrophyIconSrc(achievement.id),
  }));
  const unlockedCount = results.filter((r) => r.unlocked).length;

  return (
    <div data-reveal-item className="overflow-hidden rounded-xl tm-card">
      <SectionHeader
        title="Trophy Cabinet"
        right={
          <span className="font-table text-sm font-semibold text-tm-blue-bright">
            <CountUp value={unlockedCount} />/{results.length} unlocked
          </span>
        }
      />

      <TrophyCabinetGrid results={results} />
    </div>
  );
}
