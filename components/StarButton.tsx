import Link from "next/link";
import { formatNumber } from "@/lib/format";

// "★ STAR 2.4k" pill (design/home/TransferGit Home.dc.html's nav) — real
// count from lib/repoStats.ts (1h cache), hidden below 20 to skip a
// not-yet-meaningful number rather than show a misleading "3".
export function StarButton({ stars }: { stars: number | null }) {
  return (
    <Link
      href="https://github.com/tobiager/transfergit"
      target="_blank"
      rel="noreferrer"
      className="group flex h-10 shrink-0 items-center gap-2 rounded-full border border-border px-5 font-mono text-xs text-foreground backdrop-blur-md transition hover:border-accent-bright"
    >
      <span aria-hidden className="text-accent-bright">
        ★
      </span>
      <span className="tracking-[0.08em]">STAR</span>
      {stars !== null && stars >= 20 && <span className="tabular-nums text-value-green">{formatNumber(stars)}</span>}
    </Link>
  );
}
