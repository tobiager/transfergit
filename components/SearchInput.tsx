"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function SearchInput({
  compact = false,
  placeholder = "github-username",
  autoFocus = false,
  reveal = true,
}: {
  compact?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  // Set false outside the landing hero: the "data-reveal" scroll-in
  // animation is driven by ProfileReveal's ScrollTrigger scan, which only
  // reliably resolves for above-the-fold placements — reused far down a
  // long, image-heavy page (e.g. the profile's bottom CTA), the trigger
  // point can end up past the page's actual scrollable range and the
  // input never fades in at all.
  reveal?: boolean;
}) {
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const username = value.trim();
    if (!username) return;
    startTransition(() => {
      router.push(`/${encodeURIComponent(username)}`);
      setValue("");
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") setValue("");
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="relative w-full max-w-sm">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-value-green">
          @
        </span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isPending}
          className="h-9 w-full rounded-full border border-border bg-surface pl-8 pr-4 font-mono text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-value-green disabled:opacity-60"
        />
        {isPending && (
          <span
            aria-hidden
            className="absolute right-4 top-1/2 h-1.5 w-1.5 -translate-y-1/2 animate-pulse rounded-full bg-value-green"
          />
        )}
      </form>
    );
  }

  return (
    <form {...(reveal ? { "data-reveal": "input" } : {})} onSubmit={handleSubmit} className="flex w-full max-w-lg gap-2">
      <div className="relative flex-1">
        <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 font-mono text-lg text-value-green">
          @
        </span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full rounded-md border border-border bg-surface py-4 pl-9 pr-5 font-mono text-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-value-green"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="glow-green rounded-md bg-value-green px-6 py-4 font-display text-lg text-pitch transition hover:brightness-110 disabled:opacity-60"
      >
        {isPending ? "..." : "SCOUT →"}
      </button>
    </form>
  );
}
