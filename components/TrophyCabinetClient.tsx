"use client";

import { useState } from "react";
import type { AchievementOccurrence, AchievementProgress, Tier } from "@/lib/achievements";
import { SectionHeader } from "./SectionHeader";
import { TrophyCabinetGrid } from "./TrophyCabinetGrid";
import { TrophiesModal } from "./TrophiesModal";
import { CountUp } from "./CountUp";

export interface TrophyRow {
  id: string;
  name: string;
  description: string;
  category: string;
  tier: Tier;
  unlocked: boolean;
  progress: AchievementProgress | null;
  progressLabel: string | null;
  dateHint: string | null;
  occurrences: AchievementOccurrence[];
  iconSrc: string;
}

export function TrophyCabinetClient({
  allTrophies,
  top5,
  honours,
  unlockedCount,
}: {
  allTrophies: TrophyRow[];
  top5: TrophyRow[];
  honours: number;
  unlockedCount: number;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div data-reveal-item className="overflow-hidden rounded-xl tm-card tm-card-gold">
      <SectionHeader
        title="Trophy Cabinet"
        right={
          <>
            <CountUp value={honours} /> honours
          </>
        }
        titleClassName="text-gold"
      />

      {top5.length > 0 ? (
        <TrophyCabinetGrid results={top5} />
      ) : (
        <p className="px-4 py-6 text-center text-sm text-muted">No honours yet — keep playing</p>
      )}

      <div className="border-t border-border px-4 py-2.5 text-right">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="text-xs font-medium text-value-green hover:underline"
        >
          View all trophies →
        </button>
      </div>

      {modalOpen && (
        <TrophiesModal
          trophies={allTrophies}
          unlockedCount={unlockedCount}
          honours={honours}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
