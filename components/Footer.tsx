"use client";

import Image from "next/image";
import Link from "next/link";
import { useValuationModal } from "./ValuationModalContext";
import { Logo } from "./Logo";

// Shared footer: mono strip + a rotated "peel me" logo sticker
// (design/home/TransferGit Home.dc.html). `minimal` (home only) is the
// strip alone — the home's own Navbar/OmniSearch/ticker already cover
// navigation and search. Every other page's Navbar is in compact "Scout
// another player" mode and doesn't carry the "How it works"/"Hall of Fame"
// links, so the default (non-minimal) variant adds a discrete nav-links row
// above the strip as this footer's only path to either — one component, one
// visual language, not two different footers.
export function Footer({ minimal = false }: { minimal?: boolean }) {
  const { openModal } = useValuationModal();

  return (
    <footer className={`border-t border-border px-6 py-7 md:px-12 ${minimal ? "" : "mt-auto"}`}>
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
        {!minimal && (
          <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
            <Logo iconSize={18} />
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
        )}

        {/* No flex-wrap on this row — the sticker (shrink-0) must always
            stay pinned to the far right; only the mono text block's own
            children (below) wrap onto a second line on narrow screens. */}
        <div className="flex w-full items-center justify-between gap-4">
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
      </div>
    </footer>
  );
}
