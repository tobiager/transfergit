import type { Player } from "@/lib/types";
import { SectionHeader } from "./SectionHeader";

export function TransferHistory({ transfers }: { transfers: Player["transfers"] }) {
  return (
    <div data-reveal-item className="overflow-hidden rounded-xl tm-card">
      <SectionHeader title="Transfer History" right={`${transfers.length} moves`} />
      <ul className="divide-y divide-border">
        {transfers.map((t, i) => (
          <li key={`${t.season}-${i}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="font-mono text-muted">{t.season}</span>
              <span className="text-border">·</span>
              <span className="text-muted">{t.from}</span>
              <span className="text-muted">→</span>
              <span className="font-semibold">{t.to}</span>
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-value-green">{t.fee}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
