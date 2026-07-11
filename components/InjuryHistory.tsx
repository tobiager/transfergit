import type { Player } from "@/lib/types";
import { SectionHeader } from "./SectionHeader";

// Injury.from/to are already formatted "DD/MM/YYYY" (lib/format.ts formatDate)
// — reparsed here into "MON YYYY" for the mockup's compact row style.
function toMonthYear(ddmmyyyy: string): string {
  const [d, m, y] = ddmmyyyy.split("/").map(Number);
  return new Date(y, m - 1, d)
    .toLocaleDateString("en-US", { month: "short", year: "numeric" })
    .toUpperCase();
}

// Flavor text for lib/injuries.ts's fixed rotating INJURY_NAMES list.
const INJURY_BLURBS: Record<string, string> = {
  "Acute burnout": "stepped away from the squad",
  "Torn deploy ligament": "a rough production release",
  "Meeting overload": "calendar packed with standups",
  "Rebase injury": "lost to a conflict-ridden rebase",
  "Code review fatigue": "buried under open review requests",
};

export function InjuryHistory({ injuries }: { injuries: Player["injuries"] }) {
  return (
    <div data-reveal-item className="overflow-hidden rounded-xl tm-card">
      <SectionHeader title="Injury History" right={`${injuries.length} spells`} />
      {injuries.length === 0 ? (
        <p className="px-4 py-4 text-sm font-medium text-value-green">Clean injury record 💪</p>
      ) : (
        <ul className="divide-y divide-border">
          {injuries.map((inj, i) => (
            <li
              key={i}
              className="border-l-2 border-value-red/40 bg-value-red/[0.03] px-4 py-3 text-sm"
            >
              <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <span className="min-w-0">
                  <span className="font-mono text-xs text-muted">{toMonthYear(inj.from)}</span>
                  <span className="ml-2 font-semibold text-foreground">{inj.name}</span>
                  <span className="text-muted"> — {INJURY_BLURBS[inj.name] ?? "time away from the squad"}</span>
                </span>
                <span className="shrink-0 font-mono text-xs font-semibold uppercase tracking-wide text-value-red">
                  {inj.daysOut} days out
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
