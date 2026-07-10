import { SITE_URL } from "@/lib/site";

// Real per-achievement SVG icons (public/trophies/{id}.svg), embedded by
// absolute URL since Satori (ImageResponse) fetches <img src> over the
// network rather than reading from disk.
export function TrophySilhouette({ id, size }: { id: string; size: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- Satori (ImageResponse) only renders native <img>, not next/image.
    <img src={`${SITE_URL}/trophies/${id}.svg`} alt="" width={size} height={size} />
  );
}
