"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useValuationModal } from "./ValuationModalContext";
import { Logo } from "./Logo";
import { SearchInput } from "./SearchInput";
import { StarButton } from "./StarButton";

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount flag to avoid SSR/client theme mismatch, not a state sync.
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className="h-9 w-9 shrink-0" aria-hidden />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface-elevated text-muted transition hover:text-foreground"
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
  const pathname = usePathname();
  const isProfile = pathname !== "/" && pathname !== "/hall-of-fame" && !pathname.startsWith("/api");

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
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/" className="shrink-0 text-foreground transition hover:text-value-green">
          <Logo />
        </Link>

        {isProfile ? (
          <>
            <div className="hidden flex-1 justify-center sm:flex">
              <SearchInput compact placeholder="Scout another player..." />
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:block">
                <StarButton stars={stars} />
              </div>
              <Link
                href="#export"
                className="glow-green flex h-9 shrink-0 items-center rounded-md bg-value-green px-4 font-display text-sm text-pitch transition hover:brightness-110"
              >
                ↓ Export card
              </Link>
              <ThemeToggle />
            </div>
          </>
        ) : (
          <div className="flex items-center gap-4 text-sm">
            <button
              type="button"
              onClick={openModal}
              className="hidden font-medium text-muted transition hover:text-foreground sm:inline"
            >
              How it works
            </button>
            <Link
              href="/hall-of-fame"
              className="hidden font-medium text-muted transition hover:text-foreground sm:inline"
            >
              Hall of Fame
            </Link>
            <StarButton stars={stars} />
            <ThemeToggle />
          </div>
        )}
      </nav>
    </header>
  );
}
