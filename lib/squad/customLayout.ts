import { CUSTOM_FORMATION } from "./formations.ts";
import type { Squad } from "./types.ts";

export type CustomLayout = Record<string, { x: number; y: number }>;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// Compact, URL-safe encoding for a dragged XI's slot positions: one decimal
// place per axis, semicolon-separated "slotId:x,y" triples — human-diffable
// in a pasted URL, no JSON/base64 needed for 11 short entries. Keyed by slot
// id (GK/RB/CB_L/...), not player login: a slot's role tag stays tied to
// whichever player was already assigned to it, only its x/y move, so the
// slot id is the stable identity a shared link needs to reapply the layout.
export function encodeLayout(layout: CustomLayout): string {
  return Object.entries(layout)
    .map(([slotId, { x, y }]) => `${slotId}:${x.toFixed(1)},${y.toFixed(1)}`)
    .join(";");
}

export function decodeLayout(raw: string): CustomLayout {
  const layout: CustomLayout = {};
  for (const part of raw.split(";")) {
    const [slotId, coords] = part.split(":");
    if (!slotId || !coords) continue;
    const [xRaw, yRaw] = coords.split(",");
    const x = Number(xRaw);
    const y = Number(yRaw);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    layout[slotId] = { x: clamp(x, 0, 100), y: clamp(y, 0, 100) };
  }
  return layout;
}

// Applies a decoded layout on top of an already-resolved squad (same
// player-per-slot assignment as whichever base formation was requested) —
// only each starter's position.x/y move; id/role/label (the GK/CB/ST tag)
// stay exactly as assignRoles put them, since drag never changes who plays
// where, only where they stand.
export function applyCustomLayout(squad: Squad, layout: CustomLayout): Squad {
  return {
    ...squad,
    formation: CUSTOM_FORMATION,
    starters: squad.starters.map((starter) => {
      const override = layout[starter.position.id];
      if (!override) return starter;
      return { ...starter, position: { ...starter.position, x: override.x, y: override.y } };
    }),
  };
}
