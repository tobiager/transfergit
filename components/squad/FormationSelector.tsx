import Link from "next/link";
import { FORMATIONS, type FormationName } from "@/lib/squad/formations";

const FORMATION_NAMES = Object.keys(FORMATIONS) as FormationName[];

export function FormationSelector({
  owner,
  repo,
  current,
}: {
  owner: string;
  repo: string;
  current: FormationName;
}) {
  return (
    <div className="mb-3 flex flex-wrap justify-center gap-2 sm:justify-start">
      {FORMATION_NAMES.map((name) => (
        <Link
          key={name}
          href={`/squad/${owner}/${repo}?formation=${name}`}
          className={`rounded-full border px-4 py-1.5 font-mono text-sm transition ${
            name === current
              ? "glow-green-border border-value-green bg-value-green/10 text-value-green"
              : "border-border bg-surface text-muted hover:border-value-green/50 hover:text-foreground"
          }`}
        >
          {name}
        </Link>
      ))}
    </div>
  );
}
