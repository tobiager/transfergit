// Pure presentational: the PNG-vs-SVG choice is resolved server-side by
// resolveTrophyIconSrc (lib/trophyAssets.ts), not by an <img onError> fallback.
export function TrophyIcon({
  src,
  size = 40,
  className,
}: {
  src: string;
  size?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- src is resolved server-side per achievement; next/image adds no value for these small static icons.
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
}
