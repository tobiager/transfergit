"use client";

import Image from "next/image";
import Link from "next/link";
import { useValuationModal } from "./ValuationModalContext";
import { Logo } from "./Logo";

// Shared footer. `minimal` (home only) matches the mockup's stripped-down
// closing row (design/home/TransferGit Home.dc.html) — mono strip + a
// rotated "peel me" logo sticker, no nav links, since the home's own
// Navbar/OmniSearch/ticker already cover navigation and search. The
// profile/Hall of Fame pages keep the fuller default footer below: their
// Navbar is in compact "Scout another player" mode and doesn't carry the
// "How it works"/"Hall of Fame" links, so this footer is their only path to
// either — dropping those here would be a real loss of navigation, not just
// a style change.
export function Footer({ minimal = false }: { minimal?: boolean }) {
  const { openModal } = useValuationModal();

  if (minimal) {
    return (
      <footer className="border-t border-border px-6 py-7 md:px-12">
        {/* No flex-wrap on this outer row — the sticker (shrink-0) must
            always stay pinned to the far right; only the mono text block's
            own children (below) wrap onto a second line on narrow screens. */}
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-3 font-mono text-[11.5px] uppercase tracking-[0.1em] text-muted">
            <span>Public data only</span>
            <span className="text-border">·</span>
            <span>No sign-up</span>
            <span className="text-border">·</span>
            <span>
              Built by{" "}
              <Link
                href="https://github.com/tobiager"
                target="_blank"
                rel="noreferrer"
                className="text-value-green transition hover:text-accent-bright"
              >
                @tobiager
              </Link>
            </span>
          </div>
          <Link href="/" title="peel me" className="group shrink-0">
            <span className="block h-11 w-11 overflow-hidden rounded-[10px] shadow-[2px_4px_10px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-out [transform:rotate(-8deg)] group-hover:-translate-y-1 group-hover:scale-[1.12] group-hover:shadow-[4px_12px_22px_rgba(0,0,0,0.7),0_0_18px_rgba(47,255,0,0.3)] group-hover:[transform:rotate(4deg)_scale(1.12)_translateY(-4px)]">
              <Image src="/transfergit/tg.png" alt="tg sticker" width={44} height={44} className="h-full w-full object-cover" />
            </span>
          </Link>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-auto border-t border-border bg-surface/40">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-2 px-4 py-6 text-sm text-muted sm:flex-row sm:justify-between sm:px-6">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Logo iconSize={22} />
          <span className="text-border">|</span>
          <Link
            href="https://github.com/tobiager/transfergit"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-foreground"
          >
            GitHub
          </Link>
          <span className="text-border">·</span>
          <button type="button" onClick={openModal} className="transition hover:text-foreground">
            How it works
          </button>
          <span className="text-border">·</span>
          <Link href="/hall-of-fame" className="transition hover:text-foreground">
            Hall of Fame
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="https://github.com/tobiager"
            target="_blank"
            rel="noreferrer"
            className="font-medium transition hover:text-foreground"
          >
            Built by @tobiager
          </Link>
          <span className="text-border">·</span>
          <span className="font-mono text-xs uppercase tracking-wide">Public data only · No sign-up</span>
        </div>
      </div>
    </footer>
  );
}
