"use client";

import { useEffect, useId, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { detectQueryKind, parseRepoSlug, type QueryKind } from "@/lib/parseRepoSlug";
import { SCOUT_SQUAD_EVENT } from "./ScoutCta";

const CHIPS = ["torvalds", "vercel/next.js", "addyosmani", "facebook/react"];
const SQUAD_HINT_MS = 2000;
const PULSE_MS = 1600;

function hintFor(query: string): { kind: QueryKind | null; hint: string } {
  const kind = detectQueryKind(query);
  if (!kind) return { kind, hint: "TYPE A USERNAME OR OWNER/REPO — WE'LL DETECT IT" };
  if (kind === "squad") return { kind, hint: `↵ Scout ${query.trim()} squad` };
  const name = query.trim();
  return { kind, hint: `↵ Calculate ${name}${name.endsWith("s") ? "'" : "'s"} market value` };
}

export function OmniSearch({ autoFocus = false }: { autoFocus?: boolean }) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [squadHintMode, setSquadHintMode] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  // Fired by the "Scout your repo" CTA further down the page — see
  // ScoutCta.tsx. It scrolls to the hero itself; this just focuses the
  // input and nudges the copy toward squad usage for a moment.
  useEffect(() => {
    function onScoutSquad() {
      setSquadHintMode(true);
      setPulse(true);
      inputRef.current?.focus();
      setTimeout(() => setSquadHintMode(false), SQUAD_HINT_MS);
      setTimeout(() => setPulse(false), PULSE_MS);
    }
    window.addEventListener(SCOUT_SQUAD_EVENT, onScoutSquad);
    return () => window.removeEventListener(SCOUT_SQUAD_EVENT, onScoutSquad);
  }, []);

  const { kind, hint } = hintFor(value);
  const cta = kind === "player" ? "Calculate" : "Scout";

  function navigate(query: string) {
    const trimmed = query.trim();
    const detected = detectQueryKind(trimmed);
    if (!detected) return;
    startTransition(() => {
      if (detected === "squad") {
        const repo = parseRepoSlug(trimmed);
        if (!repo) return;
        router.push(`/squad/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}`);
      } else {
        router.push(`/${encodeURIComponent(trimmed)}`);
      }
      setValue("");
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    navigate(value);
  }

  return (
    <div data-reveal="input" className="w-full max-w-[560px]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        <label htmlFor={inputId} className="sr-only">
          Scout a GitHub username or owner/repo
        </label>
        <div
          className={`flex h-[58px] items-center gap-3 rounded-xl border bg-[var(--tg-surface-elevated)] pl-5 pr-1.5 transition-[border-color,box-shadow] duration-200 sm:h-[68px] ${
            focused ? "border-[var(--tg-accent)] shadow-[0_0_0_3px_rgba(47,255,0,0.12),0_0_32px_rgba(47,255,0,0.18)]" : "border-[var(--tg-border)]"
          } ${pulse ? "tg-glow-pulse" : ""}`}
        >
          <span aria-hidden className="shrink-0 font-mono text-base text-[var(--tg-accent)] sm:text-lg">
            @
          </span>
          <span className="relative min-w-0 flex-1">
            {!value && (
              <span
                aria-hidden
                data-tg-fade-up
                className="tg-blink pointer-events-none absolute inset-y-0 left-0 flex items-center font-mono text-base text-[var(--tg-accent)] sm:text-lg"
              >
                _
              </span>
            )}
            <input
              ref={inputRef}
              id={inputId}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              autoFocus={autoFocus}
              placeholder={squadHintMode ? "owner/repo — we'll detect it" : "Scout a player or a repo…"}
              disabled={isPending}
              className="w-full min-w-0 bg-transparent font-mono text-base text-[var(--tg-fg-soft)] placeholder:text-[#4a5d54] focus:outline-none disabled:opacity-60 sm:text-lg"
            />
          </span>
          <button
            type="submit"
            disabled={isPending || !kind}
            className="tg-glow-pulse shrink-0 rounded-lg bg-[var(--tg-accent)] px-4 py-3 font-oswald text-sm font-semibold uppercase tracking-wide text-[#04120a] transition hover:brightness-110 disabled:animate-none disabled:opacity-60 sm:px-6 sm:py-3.5 sm:text-base"
          >
            {isPending ? "…" : `${cta} →`}
          </button>
        </div>

        <div className="flex min-h-[26px] items-center gap-2 px-1">
          {kind && (
            <span
              className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide sm:text-[10px] ${
                kind === "squad"
                  ? "border-[rgba(102,179,255,0.35)] bg-[rgba(102,179,255,0.08)] text-[var(--tg-blue)]"
                  : "border-[rgba(47,255,0,0.4)] bg-[rgba(47,255,0,0.08)] text-[var(--tg-accent)]"
              }`}
            >
              {kind}
            </span>
          )}
          <span
            className={`truncate font-mono text-[11px] sm:text-[13px] ${kind ? "text-[#b8ccc1]" : "text-[#4a5d54]"}`}
          >
            {hint}
          </span>
        </div>
      </form>

      <div data-reveal="helper" className="mt-3.5 flex flex-wrap items-center gap-2">
        <span className="mr-0.5 font-mono text-[11px] text-[var(--tg-muted-faint)]">TRY</span>
        {CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => {
              setValue(chip);
              navigate(chip);
            }}
            className="rounded-full border border-[var(--tg-border)] px-3.5 py-1.5 font-mono text-xs text-[#b8ccc1] transition hover:border-[var(--tg-accent)] hover:text-[var(--tg-accent)]"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
