export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display text-sm uppercase tracking-wide ${className}`}>
      <span
        aria-hidden
        className="h-2 w-2 shrink-0 rounded-full bg-value-green"
        style={{ boxShadow: "0 0 8px rgba(var(--value-green-rgb), 0.7)" }}
      />
      Transfergit
    </span>
  );
}
