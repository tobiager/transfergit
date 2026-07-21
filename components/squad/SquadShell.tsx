"use client";

import { useState, type ReactNode } from "react";
import { PanelLeft } from "lucide-react";
import { Footer } from "@/components/Footer";

const TABS = [
  { id: "pitch", label: "Pitch" },
  { id: "squad", label: "Squad" },
  { id: "export", label: "Export" },
] as const;
type Tab = (typeof TABS)[number]["id"];

// Match-center layout shared by the real squad body and its Suspense
// skeleton (so streaming in never shifts layout):
//   <1024px  — segmented [Pitch|Squad|Export] tabs under the sticky navbar.
//   1024-1279 — 2 columns (pitch + export); the sidebar collapses to a
//               "Squad info" button that opens an off-canvas drawer.
//   ≥1280px  — 3 columns: sidebar / pitch / export.
// On desktop with ≥680px of height the page locks to exactly one viewport
// and only the side columns scroll internally — see the .squad-shell /
// .squad-scroll / .pitch-stage rules in globals.css. Shorter windows fall
// back to normal page scroll automatically (those rules don't apply).
//
// The sidebar is split into a fixed identity block (`sidebarTop`, pinned —
// never scrolls, never touched by the scroll region's fade mask) and a
// scrolling body (`sidebar`: bench + reserves + credit).
export function SquadShell({
  sidebarTop,
  sidebar,
  toolbar,
  pitch,
  exportPanel,
}: {
  sidebarTop: ReactNode;
  sidebar: ReactNode;
  toolbar: ReactNode;
  pitch: ReactNode;
  exportPanel: ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("pitch");
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="squad-shell lg:grid lg:grid-cols-[minmax(0,1fr)_clamp(360px,22vw,440px)] lg:gap-x-6 lg:px-6 xl:grid-cols-[clamp(360px,24vw,480px)_minmax(0,1fr)_clamp(360px,22vw,440px)] xl:gap-x-8 xl:px-8">
      {/* Mobile/tablet: segmented tabs, sticky under the h-16 navbar */}
      <div className="sticky top-16 z-30 border-b border-border bg-pitch/90 px-4 py-2 backdrop-blur-md lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-1 rounded-full border border-border bg-surface p-1 font-mono text-xs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
              className={`rounded-full px-3 py-1.5 uppercase tracking-wide transition ${
                tab === t.id ? "bg-value-green text-pitch" : "text-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sidebar: "Squad" tab below lg, off-canvas drawer at lg, static column
          at xl. Fixed identity block on top; only the body below it scrolls. */}
      <aside
        className={`${tab === "squad" ? "flex" : "hidden"} min-h-0 flex-col lg:fixed lg:bottom-0 lg:left-0 lg:top-16 lg:z-40 lg:flex lg:w-[clamp(360px,24vw,480px)] lg:border-r lg:border-border lg:bg-pitch lg:transition-transform lg:duration-200 ${
          drawerOpen ? "lg:translate-x-0" : "lg:-translate-x-full"
        } xl:static xl:z-auto xl:w-auto xl:translate-x-0 xl:border-r-0 xl:bg-transparent xl:transition-none`}
      >
        <div className="shrink-0 px-4 pt-4 lg:px-4 xl:px-0">{sidebarTop}</div>
        <div className="squad-scroll min-h-0 flex-1 px-4 pb-4 pt-3 lg:px-4 xl:px-0">{sidebar}</div>
      </aside>

      {/* Drawer backdrop — lg only */}
      {drawerOpen && (
        <div
          aria-hidden
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-30 hidden bg-black/60 lg:block xl:hidden"
        />
      )}

      {/* Center: toolbar + pitch */}
      <section
        className={`${tab === "pitch" ? "flex" : "hidden"} squad-center-lock flex-col gap-3 px-4 py-4 lg:flex lg:px-2 xl:px-2`}
      >
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setDrawerOpen((o) => !o)}
            className="hidden items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 font-mono text-xs text-muted transition hover:border-value-green/50 hover:text-foreground lg:inline-flex xl:hidden"
          >
            <PanelLeft size={13} />
            Squad info
          </button>
          {toolbar}
        </div>
        <div className="pitch-stage flex min-h-0 flex-1 items-center justify-center">{pitch}</div>
      </section>

      {/* Export column. Desktop's footer lives here (not as a page-level
          footer below everything) because .squad-shell locks to 100dvh with
          overflow:hidden at that breakpoint — this column's own
          .squad-scroll is the only place content can scroll into view.
          Mobile/tablet gets the real page-level Footer instead (see
          app/squad/[owner]/[repo]/page.tsx), so this copy is lg-only. */}
      <aside className={`${tab === "export" ? "block" : "hidden"} squad-scroll min-h-0 px-4 py-4 lg:block lg:px-0`}>
        {exportPanel}
        <div className="hidden lg:block">
          <Footer minimal />
        </div>
      </aside>
    </div>
  );
}
