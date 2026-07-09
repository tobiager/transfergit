import type { Tier } from "@/lib/achievements";
import { OG_COLORS as C } from "./theme";

const TIER_COLOR: Record<Tier, string> = {
  squad: C.muted,
  international: "#d7dbe4",
  "ballon-dor": C.gold,
};

// No trophy PNGs exist yet (added out-of-band later), so OG cards always
// render this generic silhouette colored by tier.
export function TrophySilhouette({ tier, size }: { tier: Tier; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        fill={TIER_COLOR[tier]}
        d="M6 3h12v2h2a1 1 0 0 1 1 1v1a4 4 0 0 1-4 4h-.09A6 6 0 0 1 13 14.9V18h3v2H8v-2h3v-3.1A6 6 0 0 1 7.09 11H7a4 4 0 0 1-4-4V6a1 1 0 0 1 1-1h2V3zm0 4H5v1a2 2 0 0 0 2 2V7zm12 0v3a2 2 0 0 0 2-2V7h-2z"
      />
    </svg>
  );
}
