import type { Player } from "@/lib/types";

export interface ReadmeCardData {
  player: Player;
  siteHost: string;
  // Base64 data URI, resolved server-side by fetchAvatarDataUri. Null falls
  // back to an initials circle (avatar fetch failed, timed out, or wasn't
  // attempted).
  avatarDataUri: string | null;
  // Base64 data URI of the player's nationality flag (public/flags/*.svg),
  // resolved server-side by getFlagDataUri. Null omits the flag badge
  // (no nationality resolved, or the file lookup failed).
  flagDataUri: string | null;
  // false renders the card without the <style> animation block (?animate=false).
  animate: boolean;
}
