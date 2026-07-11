import type { RatingMetric } from "@/lib/types";
import { SectionHeader } from "./SectionHeader";

export function ScoutingMetrics({ ratings }: { ratings: RatingMetric[] }) {
  return (
    <div data-reveal="scouting" className="overflow-hidden rounded-xl tm-card">
      <SectionHeader title="Scouting metrics" />
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 p-4 md:grid-cols-2">
        {ratings.map((rating) => (
          <div key={rating.key} data-reveal-row>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <div>
                <span className="font-semibold">{rating.label}</span>{" "}
                <span className="text-xs text-muted">· {rating.rawLabel}</span>
              </div>
              <span className="font-display text-lg font-bold tabular-nums text-value-green">
                {rating.score}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-elevated">
              <div
                data-reveal-bar
                data-score={rating.score}
                className="h-full rounded-full bg-value-green"
                style={{ width: `${rating.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
