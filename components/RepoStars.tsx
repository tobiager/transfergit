"use client";

import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/format";

export function RepoStars() {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("https://api.github.com/repos/tobiager/transfergit")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { stargazers_count?: number } | null) => {
        if (!cancelled && data?.stargazers_count !== undefined) {
          setStars(data.stargazers_count);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  if (stars === null) return null;

  return <span>★ {formatNumber(stars)}</span>;
}
