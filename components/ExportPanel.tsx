"use client";

import { useState } from "react";
import Image from "next/image";

type Variant = "full" | "compact";

const VARIANT_META: Record<Variant, { path: string; width: number; height: number; label: string }> = {
  full: { path: "", width: 1200, height: 1300, label: "Full card" },
  compact: { path: "/card", width: 900, height: 1200, label: "Compact" },
};

export function ExportPanel({
  login,
  marketValueFormatted,
}: {
  login: string;
  marketValueFormatted: string;
}) {
  const [variant, setVariant] = useState<Variant>("full");
  const [toast, setToast] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Record<Variant, boolean>>({ full: false, compact: false });

  function origin(): string {
    return typeof window !== "undefined" ? window.location.origin : "";
  }

  function profileUrl(): string {
    return `${origin()}/${login}`;
  }

  function imagePath(v: Variant): string {
    return `/api/og/${login}${VARIANT_META[v].path}`;
  }

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  }

  async function copyMarkdown() {
    const markdown = `[![⚽ ${login} — Transfergit](${origin()}${imagePath("full")})](${profileUrl()})`;
    try {
      await navigator.clipboard.writeText(markdown);
      showToast("Copied! Paste it in your README");
    } catch {
      showToast("Couldn't copy — select and copy manually");
    }
  }

  function downloadPng() {
    const a = document.createElement("a");
    a.href = imagePath(variant);
    a.download = `transfergit-${login}-${variant}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function shareToX() {
    const text = `My market value as a developer is ${marketValueFormatted} ⚽ Get scouted → ${profileUrl()}`;
    const params = new URLSearchParams({ text });
    window.open(`https://twitter.com/intent/tweet?${params}`, "_blank", "noopener,noreferrer");
  }

  function shareToLinkedIn() {
    const params = new URLSearchParams({ url: profileUrl() });
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?${params}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  const meta = VARIANT_META[variant];

  return (
    <div data-reveal="share" className="relative rounded-xl tm-card p-4">
      {toast && (
        <div className="absolute right-4 top-4 z-10 rounded-md bg-value-green px-3 py-1.5 text-xs font-semibold text-pitch shadow-lg">
          {toast}
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-table text-lg font-bold uppercase tracking-wide">Export Card</h2>
        <div className="flex overflow-hidden rounded-md border border-border text-sm">
          {(Object.keys(VARIANT_META) as Variant[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVariant(v)}
              className={`px-3 py-1.5 font-medium transition ${
                variant === v ? "bg-tm-blue-deep text-white" : "text-muted hover:bg-surface-elevated"
              }`}
            >
              {VARIANT_META[v].label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex justify-center overflow-hidden rounded-lg border border-border bg-surface-elevated p-2">
        <div
          className={`relative ${variant === "full" ? "w-full max-w-sm" : "w-full max-w-[220px]"}`}
          style={{ aspectRatio: `${meta.width} / ${meta.height}` }}
        >
          {!loaded[variant] && <div className="shimmer absolute inset-0 rounded" aria-hidden />}
          <Image
            key={variant}
            src={imagePath(variant)}
            alt={`Preview of ${login}'s card (${meta.label})`}
            width={meta.width}
            height={meta.height}
            unoptimized
            loading="lazy"
            onLoad={() => setLoaded((prev) => ({ ...prev, [variant]: true }))}
            className={`h-auto w-full transition-opacity duration-300 ${
              loaded[variant] ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          type="button"
          onClick={copyMarkdown}
          className="col-span-2 rounded-md bg-value-green px-4 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-pitch transition hover:brightness-110"
        >
          Copy Markdown
        </button>
        <button
          type="button"
          onClick={downloadPng}
          className="rounded-md border border-border bg-surface-elevated px-3 py-2.5 text-sm font-medium hover:bg-border/40"
        >
          Download PNG
        </button>
        <button
          type="button"
          onClick={shareToX}
          className="rounded-md border border-border bg-surface-elevated px-3 py-2.5 text-sm font-medium hover:bg-border/40"
        >
          Share on X
        </button>
        <button
          type="button"
          onClick={shareToLinkedIn}
          className="col-span-2 rounded-md border border-border bg-surface-elevated px-3 py-2.5 text-sm font-medium hover:bg-border/40 sm:col-span-1"
        >
          LinkedIn
        </button>
      </div>
    </div>
  );
}
