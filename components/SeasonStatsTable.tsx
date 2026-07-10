import type { Player } from "@/lib/types";
import { formatNumber } from "@/lib/format";

function Th({ term, source, align = "right" }: { term: string; source: string; align?: "left" | "right" }) {
  return (
    <th className={`px-4 py-2 ${align === "right" ? "text-right" : "text-left"} font-semibold`}>
      <span className="font-table block text-xs uppercase tracking-wide text-foreground">
        {term}
      </span>
      <span className="block text-[10px] font-normal normal-case text-muted">{source}</span>
    </th>
  );
}

function Cell({ value, hasData }: { value: number; hasData: boolean }) {
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
      <h2 className="bg-tm-blue-deep px-4 py-2 font-table text-lg font-bold uppercase tracking-wide text-white">
        Season Stats
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-elevated">
              <th className="font-table px-4 py-2 text-left align-bottom text-xs font-semibold uppercase tracking-wide text-muted">
                Season
              </th>
              <Th term="Appearances" source="active days" />
              <Th term="Goals" source="commits" />
              <Th term="Assists" source="pull requests" />
              <Th term="Yellow cards" source="issues" />
              <Th term="Minutes" source="contributions" />
            </tr>
          </thead>
          <tbody>
            {seasons.map((s, i) => (
              <tr
                key={s.year}
                data-reveal-row
                className={
                  "transition-colors hover:bg-tm-blue-bright/10 " +
                  (i % 2 === 0 ? "bg-surface" : "bg-surface-elevated/40") +
                  (s.hasData ? "" : " opacity-60")
                }
              >
                <td className="px-4 py-2 font-medium">
                  {s.year}
                  {!s.hasData && (
                    <span className="ml-2 text-[10px] uppercase text-muted">on loan</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">
                  <Cell value={s.activeDays} hasData={s.hasData} />
                </td>
                <td className="px-4 py-2 text-right font-semibold tabular-nums text-value-green">
                  {s.hasData ? formatNumber(s.commits) : <span className="text-muted">—</span>}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">
                  <Cell value={s.pullRequests} hasData={s.hasData} />
                </td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {s.hasData ? (
                    <>
                      <span className="mr-1.5 inline-block h-4 w-3 rounded-sm bg-yellow-400 align-middle" />
                      {formatNumber(s.issues)}
                    </>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">
                  <Cell value={s.totalContributions} hasData={s.hasData} />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-tm-blue-deep/30 font-bold">
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
