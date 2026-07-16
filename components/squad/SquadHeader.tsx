import type { Squad } from "@/lib/squad";

export function SquadHeader({ squad, playerCount }: { squad: Squad; playerCount: number }) {
  return (
    <header data-reveal className="mb-4 rounded-xl tm-card px-5 py-4 text-center sm:text-left">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-value-green">Repo Squad</p>
      <h1 className="mt-1 truncate font-display text-2xl uppercase leading-[0.95] tracking-tight md:text-3xl">
        {squad.owner}/{squad.repo}
      </h1>
      <div className="mt-2 flex flex-col items-center gap-1 sm:flex-row sm:items-baseline sm:gap-4">
        <p className="font-display text-3xl leading-none text-value-green glow-green-text tabular-nums md:text-4xl">
          {squad.totalValueFormatted}
        </p>
        <p className="text-sm text-muted">
          Squad value · {playerCount} player{playerCount === 1 ? "" : "s"}
        </p>
      </div>
    </header>
  );
}
