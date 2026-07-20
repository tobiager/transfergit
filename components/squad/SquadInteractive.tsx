"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import type { Starter } from "@/lib/squad";
import type { FormationName } from "@/lib/squad/formations";
import { CUSTOM_FORMATION } from "@/lib/squad/formations";
import { encodeLayout, type CustomLayout } from "@/lib/squad/customLayout";
import { FormationSelector } from "./FormationSelector";
import { SquadPitch } from "./SquadPitch";
import { SquadExportPanel } from "./SquadExportPanel";
import { SquadShell } from "./SquadShell";

function layoutFromStarters(starters: Starter[]): CustomLayout {
  return Object.fromEntries(starters.map((s) => [s.position.id, { x: s.position.x, y: s.position.y }]));
}

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
  sidebarTop,
  sidebar,
}: {
  owner: string;
  repo: string;
  starters: Starter[];
  captainLogin: string;
  mvpLogin: string;
  standardOptions: FormationName[];
  initialFormation: FormationName;
  baseFormation: FormationName;
  // Server-rendered sidebar content, split for the shell: `sidebarTop` is the
  // pinned identity block (header + captain/MVP); `sidebar` is the scrolling
  // body (bench, reserves, credit).
  sidebarTop: ReactNode;
  sidebar: ReactNode;
}) {
  // The URL is the single source of truth for which pill is active. A standard
  // pill is a real Next navigation (?formation=442) that useSearchParams
  // reflects — on load, on pill clicks, and on back/forward (Next's router
  // updates useSearchParams for all of them). This is what fixes the
  // "?formation=442 lights up 433" desync: previously the active pill was a
  // useState seeded once at mount, so a client-side pill navigation never
  // updated it.
  //
  // A Custom drag is the one thing the URL-via-router can't carry: it's a raw
  // history.replaceState (deliberately, so dragging doesn't reload the page),
  // which useSearchParams never observes. So it's tracked as a client-only
  // override that any real navigation clears — see the render-time reset
  // below (React's "adjust state during render on prop change" pattern, no
  // effect / no cascading render).
  const searchParams = useSearchParams();
  const urlFormation = searchParams.get("formation");

  const [customOverride, setCustomOverride] = useState<string | null>(
    urlFormation === CUSTOM_FORMATION ? CUSTOM_FORMATION : null
  );
  const [prevUrlFormation, setPrevUrlFormation] = useState(urlFormation);
  if (prevUrlFormation !== urlFormation) {
    setPrevUrlFormation(urlFormation);
    // A pill click / back-forward moves the URL to a STANDARD formation —
    // drop the client-only Custom-drag override so the pill follows the URL.
    // A drag itself moves the URL to `custom` (via replaceState, which Next's
    // patched history surfaces here); that must NOT clear the override.
    if (urlFormation !== CUSTOM_FORMATION) {
      setCustomOverride(null);
    }
  }
  const formation = customOverride ?? urlFormation ?? initialFormation;

  const [positions, setPositions] = useState<CustomLayout>(() => layoutFromStarters(starters));
  const [prevStarters, setPrevStarters] = useState(starters);
  if (prevStarters !== starters) {
    // A real navigation ships fresh server-resolved starter positions (custom
    // layouts already applied server-side via getSquadFromParams), so reset
    // the client overrides to match — otherwise switching formations would
    // keep the previous layout's coordinates on the new slots. This fires only
    // when the `starters` reference changes (navigation), never on a local
    // drag re-render (which keeps the same prop reference).
    setPrevStarters(starters);
    setPositions(layoutFromStarters(starters));
  }

  const handleDragStart = useCallback(() => {
    setCustomOverride(CUSTOM_FORMATION);
  }, []);

  const handleDragEnd = useCallback(
    (slotId: string, x: number, y: number) => {
      const next = { ...positions, [slotId]: { x, y } };
      setPositions(next);
      // Persist the drag to the address bar for a shareable link, WITHOUT a
      // Next navigation (no full reload per drag). This runs in the pointerup
      // handler — never inside a setState updater, which React can execute
      // during render, where Next's patched replaceState would try to update
      // the Router mid-render ("Cannot update Router while rendering" error).
      const url = new URL(window.location.href);
      url.searchParams.set("formation", CUSTOM_FORMATION);
      url.searchParams.set("base", baseFormation);
      url.searchParams.set("layout", encodeLayout(next));
      window.history.replaceState(null, "", url);
    },
    [positions, baseFormation]
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
    <SquadShell
      sidebarTop={sidebarTop}
      sidebar={sidebar}
      toolbar={
        <FormationSelector
          owner={owner}
          repo={repo}
          current={formation}
          options={standardOptions}
          resetHref={`/squad/${owner}/${repo}?formation=${baseFormation}`}
        />
      }
      pitch={
        <SquadPitch
          starters={renderedStarters}
          captainLogin={captainLogin}
          mvpLogin={mvpLogin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
      }
      exportPanel={<SquadExportPanel owner={owner} repo={repo} formationQuery={formationQuery} />}
    />
  );
}
