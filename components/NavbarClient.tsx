"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useValuationModal } from "./ValuationModalContext";
import { Logo } from "./Logo";
import { SearchInput } from "./SearchInput";
import { StarButton } from "./StarButton";

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
          </div>
        )}
      </nav>
    </header>
  );
}
