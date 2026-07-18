import type { Squad } from "@/lib/squad";
import { formationLabel } from "@/lib/squad/formations";
import { pluralize } from "@/lib/format";

// "owner/repo" is one string with no guaranteed break point besides the
// "/" — a long one needs to shrink before the 2-line clamp below still
// leaves it illegible. Character-count tiers, same pattern chipScale()
// already uses for stepping chip size by squad size.
function titleSizeClass(text: string): string {
  if (text.length <= 20) return "text-2xl md:text-3xl";
  if (text.length <= 32) return "text-xl md:text-2xl";
  return "text-lg md:text-xl";
}

export function SquadHeader({ squad, playerCount }: { squad: Squad; playerCount: number }) {
  const title = `${squad.owner}/${squad.repo}`;

  return (
    <header data-reveal className="rounded-xl tm-card px-5 py-4 text-center sm:text-left">
      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-value-green">Repo Squad</p>
        <span className="rounded-full border border-value-green/40 bg-value-green/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-value-green">
          {formationLabel(squad.formation)}
        </span>
      </div>
      <h1
        className={`mt-1 line-clamp-2 break-words font-display uppercase leading-[1.05] tracking-tight ${titleSizeClass(title)}`}
      >
        {title}
      </h1>
      <div className="mt-2 flex flex-col items-center gap-1 sm:flex-row sm:items-baseline sm:gap-4">
        <p className="font-display text-3xl leading-none text-value-green glow-green-text tabular-nums md:text-4xl">
          {squad.totalValueFormatted}
        </p>
        <p className="text-sm text-muted">Squad value · {pluralize(playerCount, "player")}</p>
      </div>
    </header>
  );
}
