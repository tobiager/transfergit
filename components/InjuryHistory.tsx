import type { Player } from "@/lib/types";

export function InjuryHistory({ injuries }: { injuries: Player["injuries"] }) {
  return (
    <div data-reveal-item className="overflow-hidden rounded-xl tm-card">
      <h2 className="bg-tm-blue-deep px-4 py-2 font-table text-lg font-bold uppercase tracking-wide text-white">
        Injury History
      </h2>
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
                <p className="text-xs text-muted">
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
