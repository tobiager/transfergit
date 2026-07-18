"use client";

import { useCallback, useMemo, useState } from "react";
import type { Starter } from "@/lib/squad";
import type { FormationName } from "@/lib/squad/formations";
import { CUSTOM_FORMATION } from "@/lib/squad/formations";
import { encodeLayout, type CustomLayout } from "@/lib/squad/customLayout";
import { FormationSelector } from "./FormationSelector";
import { SquadPitch } from "./SquadPitch";
import { SquadExportPanel } from "./SquadExportPanel";

// Owns the one piece of state the URL's ?formation=custom&layout=... can't
// (a raw history.replaceState doesn't trigger a Next.js navigation, so
// useSearchParams() won't see it) — which formation pill reads as active,
// where each starter's chip currently sits, and — since the export panel is
// rendered here too — the exact query string every export URL must carry to
// stay WYSIWYG with whatever's currently on the pitch. Standard formation
// pills still do a real navigation (FormationSelector's Links), which
// server-resolves a fresh role assignment; only Custom's positions are
// client-only until the next drag/reset.
export function SquadInteractive({
  owner,
  repo,
  starters,
  captainLogin,
  mvpLogin,
  standardOptions,
  initialFormation,
  baseFormation,
}: {
  owner: string;
  repo: string;
  starters: Starter[];
  captainLogin: string;
  mvpLogin: string;
  standardOptions: FormationName[];
  initialFormation: FormationName;
  baseFormation: FormationName;
}) {
  const [formation, setFormation] = useState<string>(initialFormation);
  const [positions, setPositions] = useState<CustomLayout>(() =>
    Object.fromEntries(starters.map((s) => [s.position.id, { x: s.position.x, y: s.position.y }]))
  );

  const handleDragStart = useCallback(() => {
    setFormation(CUSTOM_FORMATION);
  }, []);

  const handleDragEnd = useCallback(
    (slotId: string, x: number, y: number) => {
      setPositions((prev) => {
        const next = { ...prev, [slotId]: { x, y } };
        // Not a Next.js navigation — router state (useSearchParams etc.)
        // deliberately doesn't see this; only the raw address bar/back
        // button does, which is exactly what makes the link shareable
        // without a full page reload on every drag.
        const url = new URL(window.location.href);
        url.searchParams.set("formation", CUSTOM_FORMATION);
        url.searchParams.set("base", baseFormation);
        url.searchParams.set("layout", encodeLayout(next));
        window.history.replaceState(null, "", url);
        return next;
      });
    },
    [baseFormation]
  );

  const renderedStarters = starters.map((starter) => {
    const pos = positions[starter.position.id];
    if (!pos) return starter;
    return { ...starter, position: { ...starter.position, x: pos.x, y: pos.y } };
  });

  // WYSIWYG: every export URL (preview, Copy Markdown, Download, Share)
  // needs the same formation state the pitch/URL already carry — including
  // an in-progress Custom drag — so the exported image/markdown always
  // matches what's actually on screen right now, not just whatever formation
  // the page originally loaded with.
  const formationQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (formation === CUSTOM_FORMATION) {
      params.set("formation", CUSTOM_FORMATION);
      params.set("base", baseFormation);
      params.set("layout", encodeLayout(positions));
    } else {
      params.set("formation", formation);
    }
    return params.toString();
  }, [formation, baseFormation, positions]);

  return (
    <>
      <div className="lg:col-start-8 lg:col-span-5 lg:row-start-2">
        <FormationSelector
          owner={owner}
          repo={repo}
          current={formation}
          options={standardOptions}
          resetHref={`/squad/${owner}/${repo}?formation=${baseFormation}`}
        />
      </div>

      <div className="lg:sticky lg:top-6 lg:col-start-1 lg:col-span-7 lg:row-span-6 lg:row-start-1 lg:self-start">
        <SquadPitch
          starters={renderedStarters}
          captainLogin={captainLogin}
          mvpLogin={mvpLogin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
      </div>

      <div className="lg:col-start-8 lg:col-span-5 lg:row-start-6">
        <SquadExportPanel owner={owner} repo={repo} formationQuery={formationQuery} />
      </div>
    </>
  );
}
