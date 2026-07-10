import { SITE_URL } from "@/lib/site";

// Circle flag SVGs served from /public/flags, embedded by absolute URL since
// Satori (ImageResponse) fetches <img src> over the network, not from disk.
export function OgFlag({ iso2, size }: { iso2: string | null; size: number }) {
  if (!iso2) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="15.5" fill="#3a4356" stroke="#5b6472" />
        <ellipse cx="16" cy="16" rx="15.5" ry="7" fill="none" stroke="#8a94a6" />
        <ellipse cx="16" cy="16" rx="7" ry="15.5" fill="none" stroke="#8a94a6" />
        <line x1="0.5" y1="16" x2="31.5" y2="16" stroke="#8a94a6" />
        <line x1="16" y1="0.5" x2="16" y2="31.5" stroke="#8a94a6" />
      </svg>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- Satori (ImageResponse) only renders native <img>, not next/image.
    <img
      src={`${SITE_URL}/flags/${iso2}.svg`}
      alt=""
      width={size}
      height={size}
      style={{ borderRadius: "50%" }}
    />
  );
}
