"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Download, Link2, Share2, X as XIcon } from "lucide-react";
import { TiltCard } from "./TiltCard";

type Variant = "readme" | "card" | "portrait" | "story" | "social";

const VARIANT_META: Record<
  Variant,
  { path: string; width: number; height: number; readmeWidth: number; label: string; ratio: string }
> = {
  readme: { path: "/readme", width: 1200, height: 1500, readmeWidth: 500, label: "README · Full", ratio: "4:5" },
  card: { path: "/card", width: 1200, height: 1200, readmeWidth: 420, label: "Player card", ratio: "1:1" },
  portrait: {
    path: "/portrait",
    width: 900,
    height: 1200,
    readmeWidth: 400,
    label: "Player card · Portrait",
    ratio: "3:4",
  },
  story: { path: "/story", width: 1080, height: 1920, readmeWidth: 320, label: "Story", ratio: "9:16" },
  social: { path: "/social", width: 1200, height: 630, readmeWidth: 800, label: "Banner", ratio: "16:9" },
};

export function ExportPanel({ login, marketValueFormatted }: { login: string; marketValueFormatted: string }) {
  const [variant, setVariant] = useState<Variant>("readme");
  const [toast, setToast] = useState<string | null>(null);
  const [copiedAction, setCopiedAction] = useState<"link" | "markdown" | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [loaded, setLoaded] = useState<Record<Variant, boolean>>({
    readme: false,
    card: false,
    portrait: false,
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
    const meta = VARIANT_META[variant];
    const markdown = `<p align="center">\n  <a href="${profileUrl()}">\n    <img src="${origin}${imagePath(variant)}" alt="TransferGit ${meta.label}" width="${meta.readmeWidth}" />\n  </a>\n</p>`;
    try {
      await navigator.clipboard.writeText(markdown);
      setCopiedAction("markdown");
      showToast("Copied! Paste it in your README");
      setTimeout(() => setCopiedAction((a) => (a === "markdown" ? null : a)), 2000);
    } catch {
      showToast("Couldn't copy — select and copy manually");
    }
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(profileUrl());
      setCopiedAction("link");
      showToast("Link copied!");
      setTimeout(() => setCopiedAction((a) => (a === "link" ? null : a)), 2000);
    } catch {
      showToast("Couldn't copy — select and copy manually");
    }
  }

  function shareText(): string {
    return `My market value as a developer is ${marketValueFormatted}. Think you can beat it? Calculate yours on TransferGit ⚽`;
  }

  function shareToX() {
    const params = new URLSearchParams({ text: shareText(), url: profileUrl() });
    window.open(`https://twitter.com/intent/tweet?${params}`, "_blank", "noopener,noreferrer");
  }

  function shareToLinkedIn() {
    const params = new URLSearchParams({ url: profileUrl() });
    window.open(`https://www.linkedin.com/sharing/share-offsite/?${params}`, "_blank", "noopener,noreferrer");
  }

  async function openShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "TransferGit", text: shareText(), url: profileUrl() });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return; // user cancelled, don't fall back
      }
    }
    setShareOpen(true);
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

          <div className="mt-6 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={copyShareLink}
              className="flex items-center justify-center gap-2 rounded-md border border-border bg-surface-elevated px-4 py-2.5 text-sm font-medium transition hover:bg-border/40"
            >
              {copiedAction === "link" ? <Check size={16} className="text-value-green" /> : <Link2 size={16} />}
              {copiedAction === "link" ? "Copied!" : "Copy Link"}
            </button>
            <button
              type="button"
              onClick={copyMarkdown}
              className="flex items-center justify-center gap-2 rounded-md border border-border bg-surface-elevated px-4 py-2.5 text-sm font-medium transition hover:bg-border/40"
            >
              {copiedAction === "markdown" ? <Check size={16} className="text-value-green" /> : <Copy size={16} />}
              {copiedAction === "markdown" ? "Copied!" : "Copy README Markdown"}
            </button>
            <button
              type="button"
              onClick={downloadPng}
              className="glow-green flex items-center justify-center gap-2 rounded-md bg-value-green px-4 py-2.5 font-display text-sm text-pitch transition hover:brightness-110"
            >
              <Download size={16} />
              Download PNG
            </button>
            <button
              type="button"
              onClick={openShare}
              className="flex items-center justify-center gap-2 rounded-md border border-border bg-surface-elevated px-4 py-2.5 text-sm font-medium transition hover:bg-border/40"
            >
              <Share2 size={16} />
              Share on Socials
            </button>
          </div>

          <p className="mt-4 font-mono text-xs text-muted">{host()}/{login}</p>
        </div>
      </div>

      {shareOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="animate-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShareOpen(false)}
        >
          <div
            className="animate-modal-panel w-full max-w-sm rounded-xl border border-border bg-surface-elevated p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg uppercase">Share your value</h3>
              <button
                type="button"
                onClick={() => setShareOpen(false)}
                aria-label="Close"
                className="text-muted transition hover:text-foreground"
              >
                <XIcon size={18} />
              </button>
            </div>
            <p className="mt-2 text-sm text-muted">Challenge your network to beat your market value.</p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={shareToX}
                className="rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-medium transition hover:bg-border/40"
              >
                Share on X
              </button>
              <button
                type="button"
                onClick={shareToLinkedIn}
                className="rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-medium transition hover:bg-border/40"
              >
                Share on LinkedIn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
