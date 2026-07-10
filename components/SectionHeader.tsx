export function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 bg-tm-blue-deep px-4 py-2">
      <h2 className="font-table text-lg font-bold uppercase tracking-wide text-white">{title}</h2>
      {right}
    </div>
  );
}
