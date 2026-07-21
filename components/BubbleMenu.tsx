"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { X } from "lucide-react";
import { useValuationModal } from "./ValuationModalContext";

type MenuItem =
  | { n: string; label: string; href: string }
  | { n: string; label: string; action: "modal" };

function buildItems(pathname: string): MenuItem[] {
  const isSquad = pathname.startsWith("/squad/");
  return [
    { n: "01", label: "Home", href: "/" },
    { n: "02", label: "Hall of Fame", href: "/hall-of-fame" },
    { n: "03", label: "How it works", action: "modal" },
    { n: "04", label: "Repo Squad", href: isSquad ? pathname : "/#squad" },
  ];
}

// Adapted from React Bits' "Bubble Menu" pattern, ported to GSAP (already a
// project dependency) instead of the original's framer-motion — a
// staggered, numbered right-side drawer driven off a circular hamburger.
// The drawer + backdrop are portaled straight into document.body: the
// navbar's <header> is `position: sticky` and, once scrolled, also gets
// `backdrop-blur-md` — a CSS filter, which (like `transform`) makes an
// element a containing block for its `position: fixed` descendants. Left
// un-portaled, the drawer would render fixed *inside the ~70px header box*
// instead of the viewport the moment the page had been scrolled, which is
// why the menu used to break after scrolling.
export function BubbleMenu() {
  const pathname = usePathname();
  const { openModal } = useValuationModal();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const items = buildItems(pathname ?? "/");

  function toggle() {
    if (!open) {
      setMounted(true);
      setOpen(true);
    } else {
      setOpen(false);
    }
  }

  function close() {
    setOpen(false);
  }

  // Exit animation, driven by `open` flipping false while the drawer stays
  // mounted long enough to play the reverse (slide-out) stagger.
  useEffect(() => {
    if (open || !mounted) return;

    const backdrop = backdropRef.current;
    const panel = panelRef.current;
    const rows = panel?.querySelectorAll<HTMLElement>("[data-bubble-item]");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!backdrop || !panel || reduceMotion) {
      setMounted(false);
      return;
    }

    const tl = gsap.timeline({ onComplete: () => setMounted(false) });
    if (rows?.length) {
      tl.to(rows, { opacity: 0, y: -12, duration: 0.18, stagger: 0.03, ease: "power2.in" }, 0);
    }
    tl.to(panel, { xPercent: 100, duration: 0.35, ease: "power3.in" }, 0);
    tl.to(backdrop, { opacity: 0, duration: 0.3 }, 0);
    return () => {
      tl.kill();
    };
  }, [open, mounted]);

  useEffect(() => {
    if (!mounted) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const backdrop = backdropRef.current;
    const panel = panelRef.current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rows = panel?.querySelectorAll<HTMLElement>("[data-bubble-item]");

    if (reduceMotion) {
      if (backdrop) gsap.set(backdrop, { opacity: 1 });
      if (panel) gsap.set(panel, { xPercent: 0 });
      if (rows?.length) gsap.set(rows, { opacity: 1, y: 0 });
    } else {
      if (backdrop) gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" });
      if (panel) gsap.fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: 0.45, ease: "power3.out" });
      if (rows?.length) {
        gsap.fromTo(
          rows,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: "power3.out", delay: 0.15 }
        );
      }
    }

    const focusable = panel?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab" || !focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    const triggerButton = btnRef.current;
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      triggerButton?.focus();
    };
  }, [mounted]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={toggle}
        className="group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface transition hover:border-accent-bright sm:hidden"
      >
        <span aria-hidden className="relative block h-3.5 w-4">
          <span className="absolute left-0 top-0 h-[2px] w-4 bg-foreground transition group-hover:bg-accent-bright" />
          <span className="absolute left-0 top-[6px] h-[2px] w-4 bg-foreground transition group-hover:bg-accent-bright" />
          <span className="absolute left-0 top-[12px] h-[2px] w-4 bg-foreground transition group-hover:bg-accent-bright" />
        </span>
      </button>

      {mounted &&
        createPortal(
          <div
            ref={backdropRef}
            role="presentation"
            className="fixed inset-0 z-[100] bg-pitch/80 backdrop-blur-sm"
            onClick={close}
          >
            <div
              ref={panelRef}
              id={menuId}
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
              className="fixed inset-y-0 right-0 z-[101] flex h-full w-full flex-col overflow-y-auto bg-pitch/95 px-6 py-8 shadow-[-12px_0_40px_rgba(0,0,0,0.5)] sm:max-w-sm sm:border-l sm:border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close menu"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-foreground transition hover:border-accent-bright hover:text-accent-bright"
                >
                  <X size={18} aria-hidden />
                </button>
              </div>

              <nav className="mt-10 flex flex-1 flex-col justify-center gap-5">
                {items.map((item) => (
                  <div key={item.n} data-bubble-item className="flex min-w-0 items-baseline gap-3">
                    <span className="shrink-0 font-mono text-xs text-muted">{item.n}</span>
                    {"action" in item ? (
                      <button
                        type="button"
                        onClick={() => {
                          close();
                          openModal();
                        }}
                        className="group min-w-0 text-left font-display text-3xl uppercase leading-tight tracking-tight text-foreground transition hover:text-value-green"
                      >
                        <span className="border-b-2 border-transparent group-hover:border-value-green">
                          {item.label}
                        </span>
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={close}
                        className="group min-w-0 break-words font-display text-3xl uppercase leading-tight tracking-tight text-foreground transition hover:text-value-green"
                      >
                        <span className="border-b-2 border-transparent group-hover:border-value-green">
                          {item.label}
                        </span>
                      </Link>
                    )}
                  </div>
                ))}
              </nav>

              <div
                data-bubble-item
                className="mt-8 flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.1em] text-muted"
              >
                <span>Socials</span>
                <span className="text-border">·</span>
                <Link
                  href="https://github.com/tobiager"
                  target="_blank"
                  rel="noreferrer"
                  onClick={close}
                  className="transition hover:text-foreground"
                >
                  @tobiager
                </Link>
                <span className="text-border">·</span>
                <Link
                  href="https://github.com/tobiager/transfergit"
                  target="_blank"
                  rel="noreferrer"
                  onClick={close}
                  className="transition hover:text-foreground"
                >
                  Transfergit repo
                </Link>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
