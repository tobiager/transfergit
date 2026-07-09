"use client";

import { useEffect, useRef } from "react";
import { useValuationModal } from "./ValuationModalContext";

const FORMULA_ROWS: Array<[string, string]> = [
  ["Base", "€50,000"],
  ["Total commits", "× €800"],
  ["Total stars", "× €4,000"],
  ["Followers", "× €6,000"],
  ["Total pull requests", "× €2,500"],
  ["Repos with 10+ stars", "× €25,000"],
];

const MULTIPLIER_ROWS: Array<[string, string]> = [
  ["Form", "× (1 + min(commits last 12 months / 2000, 0.5))"],
  ["Young account (< 2 years)", "× 0.8"],
  ["Veteran account (> 6 years)", "× 1.1"],
];

const MAPPING_ROWS: Array<[string, string]> = [
  ["Goals", "Commits"],
  ["Assists", "Pull requests"],
  ["Appearances", "Active days"],
  ["Yellow cards", "Open issues"],
  ["Minutes played", "Total contributions"],
  ["Passing / Vision", "Pull requests / code reviews"],
];

export function ValuationModal() {
  const { open, closeModal } = useValuationModal();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeModal();
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
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, closeModal]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      className="animate-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={closeModal}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="valuation-modal-title"
        className="animate-modal-panel max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-surface p-6 text-left shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={closeModal}
          className="float-right text-muted hover:text-foreground"
          aria-label="Close"
        >
          ✕
        </button>

        <h2
          id="valuation-modal-title"
          className="font-display text-2xl font-extrabold uppercase tracking-tight"
        >
          We don&apos;t appraise you. <span className="text-value-green">We read you.</span>
        </h2>

        <section className="mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-tm-blue-bright">
            1. What signals we read
          </h3>
          <p className="mt-1 text-sm text-muted">
            Commits, stars, pull requests, followers, code reviews and your activity streak:
            all public, all from your real GitHub profile.
          </p>
        </section>

        <section className="mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-tm-blue-bright">
            2. How it becomes market value
          </h3>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {FORMULA_ROWS.map(([label, value]) => (
                <tr key={label} className="border-b border-border/60">
                  <td className="py-1.5 text-muted">{label}</td>
                  <td className="py-1.5 text-right font-medium tabular-nums">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {MULTIPLIER_ROWS.map(([label, value]) => (
                <tr key={label} className="border-b border-border/60">
                  <td className="py-1.5 text-muted">{label}</td>
                  <td className="py-1.5 text-right font-medium">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-tm-blue-bright">
            3. Football → GitHub mapping
          </h3>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {MAPPING_ROWS.map(([term, source]) => (
                <tr key={term} className="border-b border-border/60">
                  <td className="py-1.5 font-medium">{term}</td>
                  <td className="py-1.5 text-right text-muted">{source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <p className="mt-5 text-xs text-muted">
          Read live from your public GitHub via GraphQL. No inputs, no edits.
        </p>
      </div>
    </div>
  );
}
