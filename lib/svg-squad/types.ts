import type { Squad } from "../squad/types.ts";

export interface SquadCardData {
  squad: Squad;
  siteHost: string;
  // Base64 data URI per starter, keyed by avatarUrl. Missing/null falls
  // back to an initials circle instead of a broken image.
  avatarDataUris: Map<string, string | null>;
  // false renders the card without the <style> animation block (?animate=false).
  animate: boolean;
  // The tg logo, pre-loaded as a data URI (see app/api/og/_shared/logo.ts) —
  // render.ts stays a pure sync function, so the fs read happens in the
  // route handler, not here.
  logoDataUri: string;
}
