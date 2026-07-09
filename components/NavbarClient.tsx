"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatNumber } from "@/lib/format";
import { useValuationModal } from "./ValuationModalContext";

export function NavbarClient({ stars }: { stars: number | null }) {
  const [scrolled, setScrolled] = useState(false);
  const { openModal } = useValuationModal();

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 4);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 backdrop-blur-md transition-colors ${
        scrolled ? "border-b border-border bg-pitch/80" : "border-b border-transparent bg-pitch/40"
      }`}
    >
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-sm uppercase tracking-wide text-foreground transition hover:text-tm-blue-bright"
        >
          <span aria-hidden>←</span>
          <span>GET SCOUTED</span>
          <span className="ml-2 hidden text-tm-blue-bright sm:inline">Transfergit</span>
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <button
            type="button"
            onClick={openModal}
            className="font-medium text-muted transition hover:text-foreground"
          >
            How it works ↗
          </button>
          <Link
            href="https://github.com/tobiager/transfergit"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-md border border-border bg-surface-elevated px-3 py-1.5 font-medium transition hover:bg-border/40"
          >
            <span>Star on GitHub ⭐</span>
            {stars !== null && <span className="tabular-nums">{formatNumber(stars)}</span>}
          </Link>
        </div>
      </nav>
    </header>
  );
}
