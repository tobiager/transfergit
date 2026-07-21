import legends from "@/data/legends.json";
import { TrendArrow } from "@/components/TrendArrow";

interface LegendEntry {
  login: string;
  marketValueFormatted: string;
  trend: { direction: "up" | "down" | "flat"; pct: number } | null;
}

const LEGENDS = legends as LegendEntry[];
const TICKER_ITEMS = LEGENDS.slice(0, 20);

function TickerRow({ ariaHidden }: { ariaHidden?: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-6 pr-6 sm:gap-8 sm:pr-8" aria-hidden={ariaHidden}>
      {TICKER_ITEMS.map((entry, i) => (
        <span key={`${entry.login}-${i}`} className="flex shrink-0 items-center gap-1.5 font-mono text-[10.5px] sm:gap-2 sm:text-[12.5px]">
          <span className="text-[var(--tg-muted)]">@{entry.login}</span>
          <span className="font-bold text-[var(--tg-fg-soft)]">{entry.marketValueFormatted}</span>
          {entry.trend && entry.trend.direction !== "flat" && (
            <span
              className={`flex items-center gap-1 ${
                entry.trend.direction === "up" ? "text-[var(--tg-accent)]" : "text-[var(--tg-red)]"
              }`}
            >
              <TrendArrow direction={entry.trend.direction} />
              {Math.abs(entry.trend.pct).toFixed(1)}%
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

// The hero's own closing row (design/home/TransferGit Home.dc.html) — normal
// document flow, NOT fixed to the viewport. The hero wrapper around this
// (h-[calc(100dvh-4rem)] in app/page.tsx) reserves exactly .tg-ticker's
// height so together navbar + hero content + this ticker fill exactly one
// screen; scrolling past it reveals Most Valuable Players etc. below.
export function SigningsTicker() {
  return (
    <div className="tg-ticker flex shrink-0 items-center overflow-hidden border-y border-[var(--tg-border-soft)] bg-[var(--tg-surface)]">
      <div className="flex h-9 shrink-0 items-center gap-1.5 border-r border-[var(--tg-border)] bg-[var(--tg-surface)] pl-4 pr-3 sm:h-12 sm:gap-2 sm:pl-8 sm:pr-5">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--tg-red)] shadow-[0_0_6px_rgba(255,77,77,0.7)]" />
        <span className="whitespace-nowrap font-mono text-[9px] font-bold tracking-[0.16em] text-[var(--tg-fg-soft)] sm:text-[11px] sm:tracking-[0.22em]">
          LATEST SIGNINGS
        </span>
      </div>
      <div className="min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_4%,black_96%,transparent)]">
        <div className="tg-marquee flex w-max">
          <TickerRow />
          <TickerRow ariaHidden />
        </div>
      </div>
    </div>
  );
}
