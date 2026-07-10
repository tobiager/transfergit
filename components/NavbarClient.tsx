"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { formatNumber } from "@/lib/format";
import { useValuationModal } from "./ValuationModalContext";

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount flag to avoid SSR/client theme mismatch, not a state sync.
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className="h-8 w-8 shrink-0" aria-hidden />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface-elevated text-muted transition hover:text-foreground"
    >
      {isDark ? (
        <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 4a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V5a1 1 0 0 1 1-1Zm0 14a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1ZM4 11a1 1 0 1 0 0 2h1a1 1 0 1 0 0-2H4Zm14 0a1 1 0 1 0 0 2h1a1 1 0 1 0 0-2h-1ZM5.64 5.64a1 1 0 0 1 1.41 0l.71.7a1 1 0 1 1-1.42 1.42l-.7-.71a1 1 0 0 1 0-1.41Zm10.6 10.6a1 1 0 0 1 1.42 0l.7.71a1 1 0 0 1-1.41 1.41l-.71-.7a1 1 0 0 1 0-1.42ZM18.36 5.64a1 1 0 0 1 0 1.41l-.7.71a1 1 0 1 1-1.42-1.42l.71-.7a1 1 0 0 1 1.41 0ZM7.76 16.24a1 1 0 0 1 0 1.42l-.71.7a1 1 0 0 1-1.41-1.41l.7-.71a1 1 0 0 1 1.42 0ZM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z" />
        </svg>
      ) : (
        <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a.75.75 0 0 0-.94-.98A10 10 0 1 0 21.48 15.44a.75.75 0 0 0-.98-.94Z" />
        </svg>
      )}
    </button>
  );
}

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
          className="flex items-center font-display text-sm uppercase tracking-wide text-tm-blue-bright transition hover:text-foreground"
        >
          Transfergit
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
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
