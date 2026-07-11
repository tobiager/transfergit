export function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
      <h2 className="font-table text-lg font-bold uppercase tracking-wide text-foreground">{title}</h2>
      {right && <span className="font-mono text-xs uppercase tracking-wide text-muted">{right}</span>}
    </div>
  );
}
