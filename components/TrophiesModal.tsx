"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { TrophyRow } from "./TrophyCabinetClient";
import { TrophyIcon } from "./TrophyIcon";

const CATEGORY_ORDER = ["Repositories", "Impact", "Career", "Medical Record", "Dev Culture"] as const;

const TIER_LABEL: Record<TrophyRow["tier"], string> = {
  "ballon-dor": "Ballon d'Or",
  international: "International",
  squad: "Squad",
};

const TIER_COLOR: Record<TrophyRow["tier"], string> = {
  "ballon-dor": "text-gold border-gold/40",
  international: "text-value-green border-value-green/40",
  squad: "text-muted border-border",
};

const MAX_YEARS_SHOWN = 6;

function TrophyState({ trophy }: { trophy: TrophyRow }) {
  if (!trophy.unlocked) {
    if (!trophy.progress) {
      return <span className="flex items-center gap-1 text-xs text-muted">🔒 Locked</span>;
    }
    const pct = Math.min(100, (trophy.progress.current / trophy.progress.target) * 100);
    return (
      <div className="mt-1.5 max-w-xs">
        <p className="text-xs text-muted">
          🔒 {trophy.progressLabel ?? "Progress"}: {trophy.progress.current}/{trophy.progress.target}
        </p>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
          <div className="h-full rounded-full bg-muted" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  }

  if (trophy.occurrences.length > 1) {
    const shown = trophy.occurrences.slice(0, MAX_YEARS_SHOWN);
    const hiddenCount = trophy.occurrences.length - shown.length;
    return (
      <p className="mt-1 text-xs font-medium text-value-green">
        ×{trophy.occurrences.length} · {shown.map((o) => (o.detail ? `${o.year} (${o.detail})` : `${o.year}`)).join(" · ")}
        {hiddenCount > 0 && ` · +${hiddenCount} more`}
      </p>
    );
  }

  const single = trophy.occurrences[0];
  return (
    <p className="mt-1 text-xs font-medium text-value-green">
      {single?.detail ? `${single.year} (${single.detail})` : (trophy.dateHint ?? "Unlocked")}
    </p>
  );
}

function TrophyModalRow({ trophy, index }: { trophy: TrophyRow; index: number }) {
  return (
    <li
      className="animate-modal-row flex items-start gap-3 border-b border-border py-3 last:border-b-0"
      style={{ animationDelay: `${index * 25}ms` }}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${
          trophy.unlocked ? "border-gold bg-gold/10" : "border-border bg-surface-elevated/60"
        }`}
      >
        <div className={trophy.unlocked ? "" : "opacity-40 grayscale"}>
          <TrophyIcon src={trophy.iconSrc} size={20} />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{trophy.name}</span>
          <span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase ${TIER_COLOR[trophy.tier]}`}>
            {TIER_LABEL[trophy.tier]}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted">{trophy.description}</p>
        <TrophyState trophy={trophy} />
      </div>
    </li>
  );
}

export function TrophiesModal({
  trophies,
  unlockedCount,
  honours,
  onClose,
}: {
  trophies: TrophyRow[];
  unlockedCount: number;
  honours: number;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
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
  }, [onClose]);

  const byCategory = CATEGORY_ORDER.map((category) => ({
    category,
    trophies: trophies.filter((t) => t.category === category),
  })).filter((group) => group.trophies.length > 0);

  return createPortal(
    <div
      role="presentation"
      className="animate-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="trophies-modal-title"
        className="animate-modal-panel max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-surface p-6 text-left shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="float-right text-muted hover:text-foreground"
          aria-label="Close"
        >
          ✕
        </button>

        <h2 id="trophies-modal-title" className="font-display text-xl font-extrabold uppercase tracking-tight">
          Trophy Cabinet
        </h2>
        <p className="mt-1 text-sm text-muted">
          {unlockedCount}/{trophies.length} unlocked · {honours} honours
        </p>

        {byCategory.map((group) => (
          <section key={group.category} className="mt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-value-green">
              {group.category}
            </h3>
            <ul>
              {group.trophies.map((trophy, i) => (
                <TrophyModalRow key={trophy.id} trophy={trophy} index={i} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>,
    document.body
  );
}
