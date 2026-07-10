import type { Player } from "@/lib/types";
import { SectionHeader } from "./SectionHeader";

export function InjuryHistory({ injuries }: { injuries: Player["injuries"] }) {
  return (
    <div data-reveal-item className="overflow-hidden rounded-xl tm-card">
      <SectionHeader title="Injury History" />
      {injuries.length === 0 ? (
        <p className="px-4 py-4 text-sm font-medium text-value-green">
          Clean injury record 💪
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {injuries.map((inj, i) => (
            <li key={i} className="flex items-start gap-3 px-4 py-3">
              <span className="mt-0.5 shrink-0 text-lg leading-none text-value-red">➕</span>
              <div className="min-w-0">
                <p className="font-semibold text-value-red">{inj.name}</p>
                <p className="text-xs tabular-nums text-muted">
                  {inj.from} → {inj.to} · {inj.daysOut} days out · ~{inj.matchesMissed}{" "}
                  matches missed
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
