import Link from "next/link";
import { formatNumber } from "@/lib/format";

function GithubIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden className="transition group-hover:text-value-green">
      <path d="M12 1C5.9225 1 1 5.9225 1 12c0 4.8656 3.14975 8.9787 7.52075 10.4362.5.0975.6825-.2225.6825-.4938v-1.7275c-3.06.665-3.7075-1.475-3.7075-1.475-.5-1.27-1.2213-1.6088-1.2213-1.6088-.9987-.6825.0763-.6688.0763-.6688 1.105.0762 1.6862 1.135 1.6862 1.135.98 1.6787 2.5725 1.1938 3.1988.9125.0988-.71.3838-1.1938.6975-1.4688-2.435-.2762-4.9975-1.2175-4.9975-5.4212 0-1.1975.4275-2.175 1.1275-2.9412-.1125-.2763-.4888-1.3875.1075-2.8925 0 0 .92-.2938 3.0175.9862.875-.2438 1.8125-.365 2.7475-.3688.935.0037 1.8725.125 2.75.3688 2.0975-1.28 3.0163-.99 3.0163-.99.5975 1.505.2213 2.6163.11 2.8925.7013.7663 1.1263 1.7438 1.1263 2.9413 0 4.2137-2.5675 5.1412-5.0125 5.4137.3925.3387.745.995.745 2.0075 0 1.45-.0125 2.6175-.0125 2.9738 0 .2738.1825.5975.6925.4963C19.8525 20.9762 23 16.8637 23 12 23 5.9225 18.0775 1 12 1Z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden className="text-value-green">
      <path d="M12 2.5l2.9 6.3 6.9.7-5.2 4.7 1.5 6.8L12 17.6l-6.1 3.4 1.5-6.8-5.2-4.7 6.9-.7L12 2.5z" />
    </svg>
  );
}

export function StarButton({ stars }: { stars: number | null }) {
  return (
    <Link
      href="https://github.com/tobiager/transfergit"
      target="_blank"
      rel="noreferrer"
      className="group flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 text-sm font-medium text-muted backdrop-blur-md transition hover:border-value-green/60 hover:bg-white/10 hover:text-foreground"
    >
      <GithubIcon />
      <StarIcon />
      {stars !== null && <span className="tabular-nums text-value-green">{formatNumber(stars)}</span>}
    </Link>
  );
}
