// Circle flag SVGs (github.com/HatScripts/circle-flags, MIT) served from
// /public/flags. Emoji flags don't render on Chrome/Windows, hence SVGs.
export function Flag({
  code,
  size = 20,
  className,
}: {
  code: string | null;
  size?: number;
  className?: string;
}) {
  if (!code) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className={className}
        role="img"
        aria-label="Unknown country"
      >
        <circle cx="16" cy="16" r="15.5" fill="#3a4356" stroke="#5b6472" />
        <g stroke="#8a94a6" strokeWidth="1" fill="none">
          <ellipse cx="16" cy="16" rx="15.5" ry="7" />
          <ellipse cx="16" cy="16" rx="7" ry="15.5" />
          <line x1="0.5" y1="16" x2="31.5" y2="16" />
          <line x1="16" y1="0.5" x2="16" y2="31.5" />
        </g>
      </svg>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- static local SVG, next/image optimization adds no value here.
    <img
      src={`/flags/${code.toLowerCase()}.svg`}
      alt=""
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, borderRadius: "50%", display: "inline-block" }}
    />
  );
}
