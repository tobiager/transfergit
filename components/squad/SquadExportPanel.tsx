"use client";

import { useState } from "react";
import { Check, Copy, Download, Link2, Share2, X as XIcon } from "lucide-react";
import { getSiteHost, getSiteUrl } from "@/lib/site-url";

function XLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z" />
    </svg>
  );
}

function LinkedInLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.446-2.136 2.94v5.666H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.114 20.452H3.558V9h3.556v11.452z" />
    </svg>
  );
}

type Format = "portrait" | "landscape" | "full";
type Theme = "floodlight" | "grass";
type ReadmeFormat = "svg" | "png";

const FORMAT_META: Record<Format, { label: string; ratio: string }> = {
  portrait: { label: "README", ratio: "4:5" },
  landscape: { label: "Social", ratio: "16:9" },
  full: { label: "Full squad", ratio: "2:3" },
};

const THEME_META: Record<Theme, { label: string }> = {
  floodlight: { label: "Floodlight" },
  grass: { label: "Grass" },
};

// `formationQuery` is a pre-built "formation=...&base=...&layout=..." string
// (see SquadInteractive.tsx) reflecting exactly what's on the pitch right
// now, including an in-progress Custom drag — every URL this panel builds
// (preview, Copy Markdown, Download, Share) carries it, so the export is
// always WYSIWYG instead of always rendering whatever formation the page
// happened to load with.
export function SquadExportPanel({ owner, repo, formationQuery }: { owner: string; repo: string; formationQuery: string }) {
  const [format, setFormat] = useState<Format>("portrait");
  const [theme, setTheme] = useState<Theme>("floodlight");
  // Only meaningful for the "portrait" (README) format — the social banner
  // and full squad formats have no SVG variant.
  const [readmeFormat, setReadmeFormat] = useState<ReadmeFormat>("svg");
  const [copiedAction, setCopiedAction] = useState<"markdown" | "link" | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const isSvgReadme = format === "portrait" && readmeFormat === "svg";

  function pngPath(f: Format, t: Theme): string {
    return `/api/og/squad/${owner}/${repo}?format=${f}&theme=${t}&${formationQuery}`;
  }

  function svgPath(): string {
    return `/api/svg/squad/${owner}/${repo}?${formationQuery}`;
  }

  function imagePath(f: Format, t: Theme): string {
    if (f === "portrait" && readmeFormat === "svg") {
      return svgPath();
    }
    return pngPath(f, t);
  }

  function pageUrl(): string {
    return `${getSiteUrl()}/squad/${owner}/${repo}?${formationQuery}`;
  }

  function shareText(): string {
    return `The starting XI of ${owner}/${repo} ⚽`;
  }

  async function copyMarkdown() {
    const host = getSiteUrl();
    const markdown = isSvgReadme
      ? `[![${owner}/${repo} — Repo Squad by TransferGit](${host}${svgPath()})](${pageUrl()})`
      : `[![${owner}/${repo} squad — TransferGit](${host}${pngPath(format, theme)})](${pageUrl()})`;
    try {
      await navigator.clipboard.writeText(markdown);
      setCopiedAction("markdown");
      setTimeout(() => setCopiedAction((a) => (a === "markdown" ? null : a)), 2000);
    } catch {
      // best-effort — the markdown pattern is documented below the button
      // so the user can still copy it by hand.
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl());
      setCopiedAction("link");
      setTimeout(() => setCopiedAction((a) => (a === "link" ? null : a)), 2000);
    } catch {
      // best-effort
    }
  }

  async function downloadPng() {
    try {
      const res = await fetch(pngPath(format, theme));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transfergit-squad-${owner}-${repo}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // best-effort — the OG route itself is the fallback download target
      window.open(pngPath(format, theme), "_blank", "noopener,noreferrer");
    }
  }

  async function share() {
    // We share the squad page's URL (its own OG metadata already renders
    // the landscape card), never the raw image — mobile gets the native
    // share sheet when available, desktop falls back to an X/LinkedIn/copy
    // picker.
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: shareText(), text: shareText(), url: pageUrl() });
      } catch {
        // user cancelled — no-op
      }
      return;
    }
    setShareOpen(true);
  }

  function shareToX() {
    const params = new URLSearchParams({ text: shareText(), url: pageUrl() });
    window.open(`https://twitter.com/intent/tweet?${params}`, "_blank", "noopener,noreferrer");
  }

  function shareToLinkedIn() {
    const params = new URLSearchParams({ url: pageUrl() });
    window.open(`https://www.linkedin.com/sharing/share-offsite/?${params}`, "_blank", "noopener,noreferrer");
  }

  const previewKey = `${format}-${theme}-${readmeFormat}`;

  return (
    <div data-reveal="squad-export" className="relative overflow-hidden rounded-xl tm-card tm-card-green">
      <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-2 md:p-10">
        <div className="flex justify-center">
          <div
            className="glow-green-border relative overflow-hidden rounded-2xl border bg-surface"
            style={{
              width: "100%",
              maxWidth: format === "portrait" ? 300 : format === "full" ? 260 : 380,
              aspectRatio: format === "portrait" ? "4 / 5" : format === "full" ? "2 / 3" : "1200 / 630",
            }}
          >
            {loadedKey !== previewKey && <div className="shimmer absolute inset-0" aria-hidden />}
            {/* eslint-disable-next-line @next/next/no-img-element -- real unoptimized OG/SVG endpoint, preview must match the export exactly */}
            <img
              key={previewKey}
              src={imagePath(format, theme)}
              alt={`Preview of ${owner}/${repo} squad card`}
              onLoad={() => setLoadedKey(previewKey)}
              className={`h-full w-full object-contain transition-opacity duration-300 ${
                loadedKey === previewKey ? "opacity-100" : "opacity-0"
              }`}
            />
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-value-green">Export the squad</p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[0.95] tracking-tight md:text-3xl">
            Flex the whole XI.
          </h2>
          <p className="mt-3 max-w-sm text-sm text-muted">
            Drop this in the repo&apos;s README — it updates on its own as contributors and market
            values change, no re-upload needed.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {(Object.keys(FORMAT_META) as Format[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={`rounded-full border px-3 py-1.5 font-mono text-xs transition ${
                  format === f ? "border-value-green text-value-green" : "border-border text-muted hover:text-foreground"
                }`}
              >
                {FORMAT_META[f].label} · {FORMAT_META[f].ratio}
              </button>
            ))}
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(THEME_META) as Theme[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={`rounded-full border px-3 py-1.5 font-mono text-xs transition ${
                  theme === t ? "border-value-green text-value-green" : "border-border text-muted hover:text-foreground"
                }`}
              >
                {THEME_META[t].label}
              </button>
            ))}
          </div>

          <div className="mt-3">
            <div
              className="inline-flex rounded-full border border-border p-0.5 font-mono text-xs"
              title={format !== "portrait" ? "Dynamic SVG is only available for the README format" : undefined}
            >
              <button
                type="button"
                onClick={() => setReadmeFormat("svg")}
                disabled={format !== "portrait"}
                aria-pressed={readmeFormat === "svg"}
                className={`rounded-full px-3 py-1 transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  readmeFormat === "svg" && format === "portrait"
                    ? "bg-value-green text-pitch"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Dynamic SVG
              </button>
              <button
                type="button"
                onClick={() => setReadmeFormat("png")}
                disabled={format !== "portrait"}
                aria-pressed={readmeFormat === "png"}
                className={`rounded-full px-3 py-1 transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  readmeFormat === "png" && format === "portrait"
                    ? "bg-value-green text-pitch"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Static PNG
              </button>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={copyMarkdown}
              className="glow-green flex w-full items-center justify-center gap-2 rounded-md bg-value-green px-4 py-2.5 font-display text-sm text-pitch transition hover:brightness-110"
            >
              {copiedAction === "markdown" ? <Check size={16} /> : <Copy size={16} />}
              {copiedAction === "markdown" ? "Copied!" : "Copy Markdown"}
            </button>
            <p className="mt-2 text-xs text-muted">
              {isSvgReadme
                ? "Auto-updates as contributors join · give your contributors credit"
                : "Embeds the format and theme selected above."}
            </p>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={downloadPng}
              className="flex items-center justify-center gap-2 rounded-md border border-border bg-surface-elevated px-4 py-2.5 text-sm font-medium transition hover:bg-border/40"
            >
              <Download size={16} />
              Download PNG
            </button>
            <button
              type="button"
              onClick={share}
              className="flex items-center justify-center gap-2 rounded-md border border-border bg-surface-elevated px-4 py-2.5 text-sm font-medium transition hover:bg-border/40"
            >
              <Share2 size={16} />
              Share
            </button>
          </div>

          <p className="mt-4 font-mono text-xs text-muted">
            {getSiteHost()}/squad/{owner}/{repo}
          </p>
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
              <h3 className="font-display text-lg uppercase">Share the squad</h3>
              <button
                type="button"
                onClick={() => setShareOpen(false)}
                aria-label="Close"
                className="text-muted transition hover:text-foreground"
              >
                <XIcon size={18} />
              </button>
            </div>
            <p className="mt-2 text-sm text-muted">Challenge them to field a better XI.</p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={shareToX}
                className="flex items-center gap-3 rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-medium transition hover:bg-border/40"
              >
                <XLogo />
                Share on X
              </button>
              <button
                type="button"
                onClick={shareToLinkedIn}
                className="flex items-center gap-3 rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-medium transition hover:bg-border/40"
              >
                <LinkedInLogo />
                Share on LinkedIn
              </button>
              <button
                type="button"
                onClick={copyLink}
                className="flex items-center gap-3 rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-medium transition hover:bg-border/40"
              >
                {copiedAction === "link" ? <Check size={16} className="text-value-green" /> : <Link2 size={16} />}
                {copiedAction === "link" ? "Copied!" : "Copy link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
