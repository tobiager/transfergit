import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import referenceDataset from "@/data/legends.json";
import { Flag } from "@/components/Flag";
import { TrendArrow } from "@/components/TrendArrow";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Hall of Fame — Transfergit",
  description: "The top most valuable developer profiles on Transfergit, ranked by market value.",
};

interface LegendEntry {
  login: string;
  name: string;
  avatarUrl: string;
  marketValueFormatted: string;
  positionAbbrev: string;
  country: string;
  countryIso2: string | null;
  club: string;
  trend: { direction: "up" | "down" | "flat"; pct: number } | null;
}

const LEGENDS = referenceDataset as LegendEntry[];

const RANK_STYLES = [
  "border-gold/50 bg-gold/5",
  "border-muted/40 bg-white/[0.03]",
  "border-[#cd7f32]/40 bg-[#cd7f32]/5",
];

export default function HallOfFamePage() {
  return (
    <>
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-16 md:px-6">
      <header className="mb-10">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-value-green">
          Top {LEGENDS.length} most valuable developers
        </p>
        <h1 className="mt-2 font-display text-4xl uppercase leading-[0.95] tracking-tight md:text-5xl">
          Hall of Fame
        </h1>
      </header>

      <div className="overflow-hidden rounded-xl tm-card">
        <div className="grid grid-cols-[3rem_1fr_auto] items-center gap-4 border-b border-border px-4 py-3 font-mono text-xs uppercase tracking-wide text-muted md:grid-cols-[3rem_1fr_10rem_auto]">
          <span>#</span>
          <span>Player</span>
          <span className="hidden md:inline">Club</span>
          <span className="text-right">Value</span>
        </div>

        {LEGENDS.map((entry, i) => (
          <Link
            key={entry.login}
            href={`/${entry.login}`}
            className={`grid grid-cols-[3rem_1fr_auto] items-center gap-4 border-b border-border px-4 py-3 transition hover:bg-surface-elevated last:border-b-0 md:grid-cols-[3rem_1fr_10rem_auto] ${
              i < 3 ? RANK_STYLES[i] : ""
            }`}
          >
            <span className="font-display text-lg text-muted">{i + 1}</span>

            <span className="flex min-w-0 items-center gap-3">
              <Image
                src={entry.avatarUrl}
                alt=""
                width={36}
                height={36}
                className="shrink-0 rounded-full ring-1 ring-white/10"
              />
              <span className="min-w-0">
                <span className="block truncate font-medium">{entry.name}</span>
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  <Flag code={entry.countryIso2} size={12} />
                  {entry.positionAbbrev}
                </span>
              </span>
            </span>

            <span className="hidden truncate text-sm text-muted md:inline">{entry.club}</span>

            <span className="flex items-center justify-end gap-1.5 font-semibold tabular-nums">
              {entry.marketValueFormatted}
              {entry.trend && entry.trend.direction !== "flat" && (
                <TrendArrow
                  direction={entry.trend.direction}
                  className={entry.trend.direction === "up" ? "text-value-green" : "text-value-red"}
                />
              )}
            </span>
          </Link>
        ))}
      </div>
    </main>
    <Footer />
    </>
  );
}
