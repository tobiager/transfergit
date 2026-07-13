import { getSiteUrl } from "@/lib/site-url";
import { OG_COLORS as C } from "./theme";

// Circle flag SVGs from /public/flags (see components/Flag.tsx for the
// client-side twin). Satori has no DOM/base URL, so local public assets
// must go through an absolute same-origin URL — same trick already used
// for player.avatarUrl, just pointed at our own deployment instead of
// GitHub's CDN.
export function flagUrl(iso2: string | null): string | null {
  if (!iso2) return null;
  return `${getSiteUrl()}/flags/${iso2.toLowerCase()}.svg`;
}

export function FlagBadge({ iso2, size = 40 }: { iso2: string | null; size?: number }) {
  const src = flagUrl(iso2);
  if (!src) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- Satori (ImageResponse) only renders native <img>.
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      style={{ borderRadius: size / 2, borderWidth: 2, borderStyle: "solid", borderColor: C.border }}
    />
  );
}
