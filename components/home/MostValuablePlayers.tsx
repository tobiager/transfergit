import Image from "next/image";
import Link from "next/link";
import legends from "@/data/legends.json";
import { TrendArrow } from "@/components/TrendArrow";

interface LegendEntry {
  login: string;
  avatarUrl: string;
  marketValueFormatted: string;
  position: string;
  positionAbbrev: string;
  trend: { direction: "up" | "down" | "flat"; pct: number } | null;
}

// data/legends.json is already sorted by market value descending (see
// scripts/build-legends.ts) — no re-sort needed here.
const TOP_MVP = (legends as LegendEntry[]).slice(0, 8);

export function MostValuablePlayers() {
  return (
    <section data-tg-reveal className="mx-auto w-full max-w-[1400px] px-6 py-10 sm:py-14 lg:px-12">
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="font-oswald text-2xl font-semibold uppercase tracking-wide text-[var(--tg-fg)] sm:text-[34px]">
          Most valuable players
        </h2>
        <Link
          href="/hall-of-fame"
          className="font-mono text-xs tracking-wide text-[var(--tg-accent-dim)] transition hover:text-[var(--tg-accent)]"
        >
          FULL RANKING →
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--tg-border)]">
        <div className="hidden grid-cols-[64px_1fr_180px_200px_90px] gap-4 border-b border-[var(--tg-border-soft)] bg-[var(--tg-surface)] px-6 py-3 sm:grid">
          {["#", "PLAYER", "POSITION", "MARKET VALUE", "24H"].map((label, i) => (
            <span
              key={label}
              className={`font-mono text-[10px] tracking-[0.18em] text-[var(--tg-muted-faint)] ${i >= 3 ? "text-right" : ""}`}
            >
              {label}
            </span>
          ))}
        </div>
        {TOP_MVP.map((p, i) => (
          <Link
            key={p.login}
            href={`/${p.login}`}
            className="grid grid-cols-[32px_1fr_auto] items-center gap-3 border-b border-[#101815] border-l-2 border-l-transparent px-4 py-3.5 transition-all last:border-b-0 hover:border-l-[var(--tg-accent)] hover:bg-[var(--tg-surface-elevated)] sm:grid-cols-[64px_1fr_180px_200px_90px] sm:gap-0 sm:px-6"
          >
            <span className="font-oswald text-lg font-semibold text-[var(--tg-muted-faint)]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="flex min-w-0 items-center gap-3">
              <Image
                src={p.avatarUrl}
                alt={p.login}
                width={34}
                height={34}
                className="h-[34px] w-[34px] shrink-0 rounded-full border-[1.5px] border-[var(--tg-border)]"
              />
              <span className="truncate font-mono text-sm font-medium text-[var(--tg-fg-soft)]">{p.login}</span>
            </span>
            <span className="hidden font-mono text-xs text-[var(--tg-muted)] sm:block">
              {p.position} · {p.positionAbbrev}
            </span>
            <span className="font-oswald text-right text-lg font-semibold text-[var(--tg-accent)] [text-shadow:0_0_14px_rgba(47,255,0,0.25)] sm:text-xl">
              {p.marketValueFormatted}
            </span>
            <span className="hidden items-center justify-end gap-1 font-mono text-[13px] sm:flex">
              {p.trend && p.trend.direction !== "flat" && (
                <>
                  <TrendArrow
                    direction={p.trend.direction}
                    className={p.trend.direction === "up" ? "text-[var(--tg-accent)]" : "text-[var(--tg-red)]"}
                  />
                  <span className={p.trend.direction === "up" ? "text-[var(--tg-accent)]" : "text-[var(--tg-red)]"}>
                    {Math.abs(p.trend.pct).toFixed(1)}%
                  </span>
                </>
              )}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
