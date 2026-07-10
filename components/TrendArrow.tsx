export function TrendArrow({
  direction,
  size = 12,
  className,
}: {
  direction: "up" | "down";
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      {direction === "up" ? (
        <path d="M6 1.5 L11 9.5 L1 9.5 Z" />
      ) : (
        <path d="M6 10.5 L1 2.5 L11 2.5 Z" />
      )}
    </svg>
  );
}
