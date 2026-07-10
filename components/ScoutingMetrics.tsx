import type { RatingMetric } from "@/lib/types";
import { SectionHeader } from "./SectionHeader";

export function ScoutingMetrics({ ratings }: { ratings: RatingMetric[] }) {
  return (
    <div data-reveal="scouting" className="overflow-hidden rounded-xl tm-card">
      <SectionHeader title="Scouting metrics" />
      <div className="space-y-3 p-4">
        {ratings.map((rating) => (
          <div key={rating.key} data-reveal-row>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <div>
                <span className="font-semibold">{rating.label}</span>{" "}
                <span className="text-xs text-muted">· {rating.rawLabel}</span>
              </div>
              <span className="font-display text-lg font-bold tabular-nums text-tm-blue-bright">
                {rating.score}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-elevated">
              <div
                data-reveal-bar
                data-score={rating.score}
                className="h-full rounded-full bg-gradient-to-r from-tm-blue to-tm-blue-bright"
                style={{ width: `${rating.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
