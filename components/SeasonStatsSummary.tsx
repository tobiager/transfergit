import Link from "next/link";
import type { Player } from "@/lib/types";
import { formatNumber } from "@/lib/format";
import { SectionHeader } from "./SectionHeader";

// Compact 3-season preview shown in the Overview grid — the full,
// all-seasons table lives in the #stats section (SeasonStatsTable).
export function SeasonStatsSummary({ seasons }: { seasons: Player["seasons"] }) {
  const recentSeasons = seasons.slice(0, 3);

  return (
    <div data-reveal-item className="overflow-hidden rounded-xl tm-card">
      <SectionHeader title="Season Stats" right="Commits · PR · Reviews" />
      <table className="w-full text-sm">
        <thead>
          <tr className="font-mono text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-2 text-left font-semibold">Season</th>
            <th className="px-4 py-2 text-right font-semibold">CMT</th>
            <th className="px-4 py-2 text-right font-semibold">PR</th>
            <th className="px-4 py-2 text-right font-semibold">REV</th>
          </tr>
        </thead>
        <tbody>
          {recentSeasons.map((s, i) => (
            <tr key={s.year} className={i === 0 ? "font-semibold" : ""}>
              <td className="px-4 py-2 tabular-nums">
                {s.year}
                {i === 0 ? `/${(s.year + 1).toString().slice(-2)}` : ""}
              </td>
              <td className="px-4 py-2 text-right tabular-nums text-value-green">
                {s.hasData ? formatNumber(s.commits) : <span className="font-normal text-muted">—</span>}
              </td>
              <td className="px-4 py-2 text-right tabular-nums">
                {s.hasData ? formatNumber(s.pullRequests) : <span className="text-muted">—</span>}
              </td>
              <td className="px-4 py-2 text-right tabular-nums">
                {s.hasData ? formatNumber(s.reviews) : <span className="text-muted">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-border px-4 py-2.5 text-right">
        <Link href="#stats" className="text-xs font-medium text-value-green hover:underline">
          Full stats ↓
        </Link>
      </div>
    </div>
  );
}
