"use client";

import Link from "next/link";
import { useValuationModal } from "./ValuationModalContext";
import { Logo } from "./Logo";

// Shared footer for the profile and Hall of Fame pages. The landing page
// merges the same content into its bottom ticker bar instead (see Ticker.tsx).
export function Footer() {
  const { openModal } = useValuationModal();

  return (
    <footer className="mt-auto border-t border-border bg-surface/40">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-2 px-4 py-6 text-sm text-muted sm:flex-row sm:justify-between sm:px-6">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Logo />
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
