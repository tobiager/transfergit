import Link from "next/link";
import referenceDataset from "@/data/legends.json";
import { TrendArrow } from "./TrendArrow";

interface LegendEntry {
  login: string;
  marketValueFormatted: string;
  trend: { direction: "up" | "down" | "flat"; pct: number } | null;
}

const LEGENDS = referenceDataset as LegendEntry[];
const TICKER_ITEMS = LEGENDS.slice(0, 20);

function TickerRow({ ariaHidden }: { ariaHidden?: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-8 pr-8" aria-hidden={ariaHidden}>
      {TICKER_ITEMS.map((entry, i) => (
        <span key={`${entry.login}-${i}`} className="flex shrink-0 items-center gap-2 font-mono text-sm">
          <span className="text-muted">@{entry.login}</span>
          <span className="font-semibold text-foreground">{entry.marketValueFormatted}</span>
          {entry.trend && entry.trend.direction !== "flat" && (
            <TrendArrow
              direction={entry.trend.direction}
              className={entry.trend.direction === "up" ? "text-value-green" : "text-value-red"}
            />
          )}
        </span>
      ))}
    </div>
  );
}

export function Ticker() {
  return (
    <div className="w-full shrink-0 overflow-hidden border-t border-border bg-surface/60 backdrop-blur-sm">
      <div className="mx-auto flex h-12 w-full max-w-7xl items-center gap-4 px-4 md:px-6">
        <span className="flex shrink-0 items-center gap-2 font-mono text-xs uppercase tracking-wide text-value-red">
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full bg-value-red"
            style={{ boxShadow: "0 0 6px rgba(229, 72, 77, 0.7)" }}
          />
          Latest signings
        </span>

        <div className="group relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_88%,transparent)]">
          <div className="ticker-track flex w-max group-hover:[animation-play-state:paused]">
            <TickerRow />
            <TickerRow ariaHidden />
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-3 border-l border-border pl-4 font-mono text-xs text-muted lg:flex">
          <span className="hidden xl:inline">{LEGENDS.length} legends tracked</span>
          <span className="hidden text-border xl:inline">·</span>
          <Link href="https://github.com/tobiager" target="_blank" rel="noreferrer" className="hover:text-foreground">
            Built by @tobiager
          </Link>
          <span className="text-border">·</span>
          <span className="uppercase">Public data only · No sign-up</span>
        </div>
      </div>
    </div>
  );
}
