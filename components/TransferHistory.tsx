import type { Player } from "@/lib/types";

export function TransferHistory({ transfers }: { transfers: Player["transfers"] }) {
  return (
    <div data-reveal-item className="overflow-hidden rounded-xl tm-card">
      <h2 className="bg-tm-blue-deep px-4 py-2 font-table text-lg font-bold uppercase tracking-wide text-white">
        Transfer History
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="font-table bg-surface-elevated text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-2 text-left font-semibold">Season</th>
              <th className="px-4 py-2 text-left font-semibold">From</th>
              <th className="px-4 py-2 text-left font-semibold">To</th>
              <th className="px-4 py-2 text-right font-semibold">Fee</th>
            </tr>
          </thead>
          <tbody>
            {transfers.map((t, i) => (
              <tr
                key={`${t.season}-${i}`}
                className={`transition-colors hover:bg-tm-blue-bright/10 ${
                  i % 2 === 0 ? "bg-surface" : "bg-surface-elevated/40"
                }`}
              >
                <td className="px-4 py-2 font-medium">{t.season}</td>
                <td className="px-4 py-2 text-muted">{t.from}</td>
                <td className="px-4 py-2 font-medium">{t.to}</td>
                <td className="px-4 py-2 text-right font-semibold tabular-nums text-value-green">
                  {t.fee}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
