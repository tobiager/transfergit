"use client";

import { useEffect, useState } from "react";

const FORMULA_ROWS: Array<[string, string]> = [
  ["Base", "50.000 €"],
  ["Commits totales", "× 800 €"],
  ["Stars totales", "× 4.000 €"],
  ["Followers", "× 6.000 €"],
  ["Pull requests totales", "× 2.500 €"],
  ["Repos con +10 stars", "× 25.000 €"],
];

const MULTIPLIER_ROWS: Array<[string, string]> = [
  ["Forma", "× (1 + min(commits últimos 12 meses / 2000, 0.5))"],
  ["Cuenta joven (< 2 años)", "× 0.8"],
  ["Cuenta veterana (> 6 años)", "× 1.1"],
];

const MAPPING_ROWS: Array<[string, string]> = [
  ["Goles", "Commits"],
  ["Asistencias", "Pull requests"],
  ["Partidos jugados", "Días activos"],
  ["Amarillas", "Issues abiertas"],
  ["Minutos jugados", "Contribuciones totales"],
  ["Pase / Visión", "Pull requests / code reviews"],
];

export function HowItWorksModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[11px] font-medium text-tm-blue-bright/90 underline-offset-2 hover:underline"
      >
        ¿cómo se calcula? ↗
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-surface p-6 text-left shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="float-right text-muted hover:text-foreground"
              aria-label="Cerrar"
            >
              ✕
            </button>

            <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight">
              No te tasamos. <span className="text-value-green">Te leemos.</span>
            </h2>

            <section className="mt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-tm-blue-bright">
                1. Qué señales leemos
              </h3>
              <p className="mt-1 text-sm text-muted">
                Commits, stars, pull requests, followers, code reviews y tu racha de actividad:
                todo público, todo desde tu perfil real de GitHub.
              </p>
            </section>

            <section className="mt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-tm-blue-bright">
                2. Cómo se convierte en valor de mercado
              </h3>
              <table className="mt-2 w-full text-sm">
                <tbody>
                  {FORMULA_ROWS.map(([label, value]) => (
                    <tr key={label} className="border-b border-border/60">
                      <td className="py-1.5 text-muted">{label}</td>
                      <td className="py-1.5 text-right font-medium tabular-nums">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <table className="mt-3 w-full text-sm">
                <tbody>
                  {MULTIPLIER_ROWS.map(([label, value]) => (
                    <tr key={label} className="border-b border-border/60">
                      <td className="py-1.5 text-muted">{label}</td>
                      <td className="py-1.5 text-right font-medium">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="mt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-tm-blue-bright">
                3. Mapeo futbolero → GitHub
              </h3>
              <table className="mt-2 w-full text-sm">
                <tbody>
                  {MAPPING_ROWS.map(([term, source]) => (
                    <tr key={term} className="border-b border-border/60">
                      <td className="py-1.5 font-medium">{term}</td>
                      <td className="py-1.5 text-right text-muted">{source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <p className="mt-5 text-xs text-muted">
              Leído en vivo de tu GitHub público vía GraphQL. Sin inputs, sin ediciones.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
