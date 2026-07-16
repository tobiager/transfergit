"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { getSiteUrl } from "@/lib/site-url";

type Format = "portrait" | "landscape";
type Theme = "floodlight" | "grass";

const FORMAT_META: Record<Format, { label: string; ratio: string }> = {
  portrait: { label: "README", ratio: "4:5" },
  landscape: { label: "Social banner", ratio: "16:9" },
};

const THEME_META: Record<Theme, { label: string }> = {
  floodlight: { label: "Floodlight" },
  grass: { label: "Grass" },
};

export function SquadExportPanel({ owner, repo }: { owner: string; repo: string }) {
  const [format, setFormat] = useState<Format>("portrait");
  const [theme, setTheme] = useState<Theme>("floodlight");
  const [copied, setCopied] = useState(false);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  function imagePath(f: Format, t: Theme): string {
    return `/api/og/squad/${owner}/${repo}?format=${f}&theme=${t}`;
  }

  async function copyMarkdown() {
    const host = getSiteUrl();
    // Always embeds the README (portrait) format, regardless of what's
    // currently previewed — landscape only exists for social/OG metadata.
    const markdown = `[![${owner}/${repo} squad — TransferGit](${host}${imagePath("portrait", theme)})](${host}/squad/${owner}/${repo})`;
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // best-effort — the markdown pattern is documented below the button
      // so the user can still copy it by hand.
    }
  }

  const previewKey = `${format}-${theme}`;

  return (
    <div data-reveal="squad-export" className="overflow-hidden rounded-xl tm-card tm-card-green">
      <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-2 md:p-10">
        <div className="flex justify-center">
          <div
            className="glow-green-border relative overflow-hidden rounded-2xl border bg-surface"
            style={{
              width: "100%",
              maxWidth: format === "portrait" ? 300 : 380,
              aspectRatio: format === "portrait" ? "4 / 5" : "1200 / 630",
            }}
          >
            {loadedKey !== previewKey && <div className="shimmer absolute inset-0" aria-hidden />}
            {/* eslint-disable-next-line @next/next/no-img-element -- real unoptimized OG endpoint, preview must match the export exactly */}
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

          <div className="mt-6">
            <button
              type="button"
              onClick={copyMarkdown}
              className="glow-green flex w-full items-center justify-center gap-2 rounded-md bg-value-green px-4 py-2.5 font-display text-sm text-pitch transition hover:brightness-110 sm:w-auto"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied!" : "Copy Markdown"}
            </button>
            <p className="mt-2 text-xs text-muted">Always the README (portrait) format, in the theme selected above.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
