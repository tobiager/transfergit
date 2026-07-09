"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function SearchInput() {
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const username = value.trim();
    if (!username) return;
    startTransition(() => {
      router.push(`/${encodeURIComponent(username)}`);
    });
  }

  return (
    <form
      data-reveal="input"
      onSubmit={handleSubmit}
      className="flex w-full max-w-lg gap-2"
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="github-username"
        className="flex-1 rounded-md border border-border bg-surface px-5 py-4 text-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-tm-blue-bright"
        autoFocus
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-value-green px-6 py-4 font-display text-lg text-pitch transition hover:brightness-110 disabled:opacity-60"
      >
        {isPending ? "..." : "SCOUT →"}
      </button>
    </form>
  );
}
