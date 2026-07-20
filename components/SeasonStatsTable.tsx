import type { Player } from "@/lib/types";
import { formatNumber } from "@/lib/format";
import { SectionHeader } from "./SectionHeader";

function Th({ term, source }: { term: string; source: string }) {
  return (
    <th className="px-4 py-2 text-right font-semibold">
      <span className="font-mono block text-xs uppercase tracking-wide text-foreground">{term}</span>
      <span className="block text-[10px] font-normal normal-case text-muted">{source}</span>
    </th>
  );
}

function Cell({ value, hasData, pending }: { value: number; hasData: boolean; pending?: boolean }) {
  if (pending) return <span className="text-muted animate-pulse">syncing…</span>;
  if (!hasData) return <span className="text-muted">—</span>;
  return <>{formatNumber(value)}</>;
}

export function SeasonStatsTable({ seasons }: { seasons: Player["seasons"] }) {
  const totals = seasons.reduce(
    (acc, s) => ({
      activeDays: acc.activeDays + s.activeDays,
      commits: acc.commits + s.commits,
      pullRequests: acc.pullRequests + s.pullRequests,
      issues: acc.issues + s.issues,
      totalContributions: acc.totalContributions + s.totalContributions,
    }),
    { activeDays: 0, commits: 0, pullRequests: 0, issues: 0, totalContributions: 0 }
  );

  return (
    <div data-reveal="table" className="overflow-hidden rounded-xl tm-card">
      <SectionHeader title="Season Stats" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-elevated">
              <th className="font-mono px-4 py-2 text-left align-bottom text-xs font-semibold uppercase tracking-wide text-muted">
                Season
              </th>
              <Th term="Apps" source="active days" />
              <Th term="Goals" source="commits" />
              <Th term="Assists" source="pull requests" />
              <Th term="YC" source="issues" />
              <Th term="Minutes" source="contributions" />
            </tr>
          </thead>
          <tbody>
            {seasons.map((s, i) => (
              <tr
                key={s.year}
                data-reveal-row
                className={`h-11 transition-colors hover:bg-surface-elevated/60 ${
                  i % 2 === 0 ? "bg-surface" : "bg-surface-elevated/40"
                } ${s.hasData || s.pending ? "" : "opacity-60"}`}
              >
                <td className="px-4 py-2 font-medium">
                  {s.year}
                  {s.pending && (
                    <span className="ml-2 inline-flex items-center gap-1 text-[10px] uppercase text-value-green">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-value-green" />
                      syncing
                    </span>
                  )}
                  {!s.hasData && !s.pending && <span className="ml-2 text-[10px] uppercase text-muted">on loan</span>}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">
                  <Cell value={s.activeDays} hasData={s.hasData} pending={s.pending} />
                </td>
                <td className="px-4 py-2 text-right font-semibold tabular-nums text-value-green">
                  {s.pending ? (
                    <span className="font-normal text-muted animate-pulse">syncing…</span>
                  ) : s.hasData ? (
                    formatNumber(s.commits)
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">
                  <Cell value={s.pullRequests} hasData={s.hasData} pending={s.pending} />
                </td>
                <td className="px-4 py-2 text-right tabular-nums">
                  <Cell value={s.issues} hasData={s.hasData} pending={s.pending} />
                </td>
                <td className="px-4 py-2 text-right tabular-nums">
                  <Cell value={s.totalContributions} hasData={s.hasData} pending={s.pending} />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-surface-elevated font-bold">
              <td className="px-4 py-2">Total</td>
              <td className="px-4 py-2 text-right tabular-nums">{formatNumber(totals.activeDays)}</td>
              <td className="px-4 py-2 text-right tabular-nums text-value-green">
                {formatNumber(totals.commits)}
              </td>
              <td className="px-4 py-2 text-right tabular-nums">{formatNumber(totals.pullRequests)}</td>
              <td className="px-4 py-2 text-right tabular-nums">{formatNumber(totals.issues)}</td>
              <td className="px-4 py-2 text-right tabular-nums">
                {formatNumber(totals.totalContributions)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
