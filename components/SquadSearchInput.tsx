"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { parseRepoSlug } from "@/lib/parseRepoSlug";

export function SquadSearchInput({ autoFocus = false }: { autoFocus?: boolean }) {
  const [value, setValue] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = parseRepoSlug(value);
    if (!parsed) {
      setInvalid(true);
      return;
    }
    startTransition(() => {
      router.push(`/squad/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}`);
      setValue("");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-sm">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-tm-blue-bright">
        ⚽
      </span>
      <input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (invalid) setInvalid(false);
        }}
        placeholder="owner/repo or GitHub URL"
        autoFocus={autoFocus}
        disabled={isPending}
        className={`h-9 w-full rounded-full border bg-surface pl-9 pr-20 font-mono text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-tm-blue-bright disabled:opacity-60 ${
          invalid ? "border-value-red" : "border-border"
        }`}
      />
      <button
        type="submit"
        disabled={isPending}
        className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-tm-blue-bright px-3 py-1 font-mono text-xs text-pitch transition hover:brightness-110 disabled:opacity-60"
      >
        {isPending ? "..." : "SCOUT"}
      </button>
      {invalid && (
        <p className="absolute left-1 top-full mt-1 text-xs text-value-red">
          Use &quot;owner/repo&quot; or a GitHub repo URL.
        </p>
      )}
    </form>
  );
}
