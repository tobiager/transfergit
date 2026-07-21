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
  // Squad already has its own "EXPORT THE SQUAD" sidebar panel — the navbar's
  // export shortcut would just duplicate it.
  const isSquad = pathname.startsWith("/squad/");

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 pt-2 transition-[background-color,backdrop-filter,border-color] duration-300 ${
        scrolled
          ? "border-b border-[var(--nav-scrolled-border)] bg-[var(--nav-scrolled-bg)] backdrop-blur-md"
          : "border-b-0 bg-transparent"
      }`}
    >
      {/* Same max-width + side padding as the hero row in app/page.tsx
          (max-w-[1400px], lg:px-[72px]) so the logo and star pill land
          exactly on the hero content's outer edges — not a separate
          max-w-7xl container that centers differently. nav's own height is
          fixed (60px/76px, the mockup's own bar) — the header's pt-2 above
          is the small top gap, and --nav-h in globals.css is their sum
          (68px/84px), not a var nav reads directly anymore, so the two
          can't drift apart from each other. */}
      <nav className="mx-auto flex h-[60px] w-full max-w-[1400px] items-center justify-between gap-4 px-4 md:px-6 lg:h-[76px] lg:px-[72px]">
        <Link href="/" className="shrink-0 text-foreground transition hover:text-accent-bright">
          <Logo iconSize={40} glow="subtle" />
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
              {!isSquad && (
                <Link
                  href="#export"
                  className="glow-green flex h-9 shrink-0 items-center rounded-md bg-value-green px-4 font-display text-sm text-pitch transition hover:brightness-110"
                >
                  ↓ Export card
                </Link>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-9 font-mono text-xs uppercase tracking-[0.12em]">
            <button
              type="button"
              onClick={openModal}
              className="hidden font-mono text-xs uppercase tracking-[0.12em] text-muted transition hover:text-accent-bright sm:inline"
            >
              How it works
            </button>
            <Link href="/hall-of-fame" className="hidden text-muted transition hover:text-accent-bright sm:inline">
              Hall of Fame
            </Link>
            <StarButton stars={stars} />
          </div>
        )}
      </nav>
    </header>
  );
}
