import Link from "next/link";
import type { FormationName } from "@/lib/squad/formations";
import { CUSTOM_FORMATION } from "@/lib/squad/formations";

// The Custom pill only ever becomes active by dragging a chip on the pitch
// (see SquadFormationArea/SquadPitch) — there's no meaningful "custom"
// layout to switch to just by clicking it, so unlike the standard pills it's
// a plain, non-interactive indicator until a drag has actually happened.
export function FormationSelector({
  owner,
  repo,
  current,
  options,
  resetHref,
}: {
  owner: string;
  repo: string;
  current: FormationName;
  options: FormationName[];
  resetHref: string;
}) {
  const isCustom = current === CUSTOM_FORMATION;

  return (
    <div data-reveal className="flex flex-wrap items-center justify-center gap-2">
      {options.map((name) => (
        <Link
          key={name}
          href={`/squad/${owner}/${repo}?formation=${name}`}
          className={`rounded-full border px-3 py-1 font-mono text-xs transition ${
            name === current
              ? "glow-green-border border-value-green bg-value-green/10 text-value-green"
              : "border-border bg-surface text-muted hover:border-value-green/50 hover:text-foreground"
          }`}
        >
          {name}
        </Link>
      ))}

      <span
        className={`rounded-full border px-3 py-1 font-mono text-xs ${
          isCustom
            ? "glow-green-border border-value-green bg-value-green/10 text-value-green"
            : "border-dashed border-border text-muted"
        }`}
      >
        Custom
      </span>

      {isCustom && (
        <Link
          href={resetHref}
          className="rounded-full border border-border bg-surface px-3 py-1 font-mono text-xs text-muted transition hover:border-value-green/50 hover:text-foreground"
        >
          Reset
        </Link>
      )}
    </div>
  );
}
