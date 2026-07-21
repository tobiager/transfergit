import Link from "next/link";
import { formatNumber } from "@/lib/format";

// GitHub mark + star pill (design/home/TransferGit Home.dc.html's nav) — real
// count from lib/repoStats.ts (1h cache), hidden below 20 to skip a
// not-yet-meaningful number rather than show a misleading "3". Neutral at
// rest, star + glow turn accent-green on hover.
export function StarButton({ stars }: { stars: number | null }) {
  return (
    <Link
      href="https://github.com/tobiager/transfergit"
      target="_blank"
      rel="noreferrer"
      aria-label="Star on GitHub"
      className="group flex h-10 shrink-0 items-center gap-2 rounded-full border border-border px-4 font-mono text-xs text-foreground backdrop-blur-md transition duration-200 hover:border-accent-bright hover:shadow-[0_0_14px_rgba(47,255,0,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright"
    >
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        width="16"
        height="16"
        fill="currentColor"
        className="shrink-0 text-foreground transition-colors duration-200 group-hover:text-accent-bright"
      >
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
      </svg>
      <span aria-hidden className="text-value-green">
        ★
      </span>
      {stars !== null && stars >= 20 && <span className="tabular-nums text-value-green">{formatNumber(stars)}</span>}
    </Link>
  );
}
