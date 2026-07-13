"use client";

import { useEffect, useState } from "react";
import { TiltCard } from "./TiltCard";

type Variant = "readme" | "card" | "story" | "social";

const VARIANT_META: Record<Variant, { path: string; width: number; height: number; label: string; ratio: string }> = {
  readme: { path: "/readme", width: 1200, height: 1500, label: "README · Full", ratio: "4:5" },
  card: { path: "/card", width: 1200, height: 1600, label: "Player card", ratio: "3:4" },
  story: { path: "/story", width: 1080, height: 1920, label: "Story", ratio: "9:16" },
  social: { path: "/social", width: 1200, height: 630, label: "Banner", ratio: "16:9" },
};

export function ExportPanel({ login, marketValueFormatted }: { login: string; marketValueFormatted: string }) {
  const [variant, setVariant] = useState<Variant>("readme");
  const [toast, setToast] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Record<Variant, boolean>>({
    readme: false,
    card: false,
    story: false,
    social: false,
  });
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads window.location after mount so SSR/client markup match; not a state sync.
    setOrigin(window.location.origin);
  }, []);

  function host(): string {
    return origin.replace(/^https?:\/\//, "");
  }

  function profileUrl(): string {
    return `${origin}/${login}`;
  }

  function imagePath(v: Variant): string {
    return `/api/og/${login}${VARIANT_META[v].path}`;
  }

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  }

  async function copyMarkdown() {
    const markdown = `[![${login} — Transfergit](${origin}${imagePath("readme")})](${profileUrl()})`;
    try {
      await navigator.clipboard.writeText(markdown);
      showToast("Copied! Paste it in your README");
    } catch {
      showToast("Couldn't copy — select and copy manually");
    }
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(profileUrl());
      showToast("Link copied!");
    } catch {
      showToast("Couldn't copy — select and copy manually");
    }
  }

  function shareToX() {
    const text = `My market value as a developer is ${marketValueFormatted} ⚽ Get scouted → ${profileUrl()}`;
    const params = new URLSearchParams({ text });
    window.open(`https://twitter.com/intent/tweet?${params}`, "_blank", "noopener,noreferrer");
  }

  function downloadPng() {
    const a = document.createElement("a");
    a.href = imagePath(variant);
    a.download = `transfergit-${login}-${variant}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  const meta = VARIANT_META[variant];

  return (
    <div data-reveal="share" className="relative overflow-hidden rounded-xl tm-card tm-card-green">
      {toast && (
        <div className="absolute right-4 top-4 z-10 rounded-md bg-value-green px-3 py-1.5 text-xs font-semibold text-pitch shadow-lg">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-2 md:p-10">
        <div className="flex justify-center">
          <TiltCard
            className="glow-green-border relative overflow-hidden rounded-2xl border bg-surface"
            style={{ width: "100%", maxWidth: 340, height: 540 }}
          >
            {!loaded[variant] && <div className="shimmer absolute inset-0" aria-hidden />}
            {/* eslint-disable-next-line @next/next/no-img-element -- this is the real, unoptimized OG endpoint image (preview = exact export), next/image's optimizer adds nothing here. */}
            <img
              key={variant}
              src={imagePath(variant)}
              alt={`Preview of ${login}'s ${meta.label} card`}
              onLoad={() => setLoaded((prev) => ({ ...prev, [variant]: true }))}
              className={`h-full w-full object-contain transition-opacity duration-300 ${
                loaded[variant] ? "opacity-100" : "opacity-0"
              }`}
            />
          </TiltCard>
        </div>

        <div className="flex flex-col justify-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-value-green">Share your file</p>
          <h2 className="mt-2 font-display text-3xl uppercase leading-[0.95] tracking-tight md:text-4xl">
            Export the card.
            <br />
            Flex the value.
          </h2>
          <p className="mt-3 max-w-sm text-sm text-muted">
            Exactly what you see here — same card, same glow. Pick a format and it renders
            pixel-perfect for X, LinkedIn or your README.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {(Object.keys(VARIANT_META) as Variant[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVariant(v)}
                className={`rounded-full border px-3 py-1.5 font-mono text-xs transition ${
                  variant === v
                    ? "border-value-green text-value-green"
                    : "border-border text-muted hover:text-foreground"
                }`}
              >
                {VARIANT_META[v].label} · {VARIANT_META[v].ratio}
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyMarkdown}
              className="rounded-md border border-border bg-surface-elevated px-4 py-2.5 text-sm font-medium hover:bg-border/40"
            >
              Copy Markdown
            </button>
            <button
              type="button"
              onClick={downloadPng}
              className="glow-green rounded-md bg-value-green px-4 py-2.5 font-display text-sm text-pitch transition hover:brightness-110"
            >
              ↓ Download PNG
            </button>
            <button
              type="button"
              onClick={copyShareLink}
              className="rounded-md border border-border bg-surface-elevated px-4 py-2.5 text-sm font-medium hover:bg-border/40"
            >
              Copy share link
            </button>
            <button
              type="button"
              onClick={shareToX}
              className="rounded-md border border-border bg-surface-elevated px-4 py-2.5 text-sm font-medium hover:bg-border/40"
            >
              Share on X
            </button>
          </div>

          <p className="mt-4 font-mono text-xs text-muted">{host()}/{login}</p>
        </div>
      </div>
    </div>
  );
}
