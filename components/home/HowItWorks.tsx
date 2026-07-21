const STEPS = [
  {
    n: "01",
    title: "Signal reading",
    body: "We analyze commits, PRs, stars and streaks across public repos. Private code stays untouched.",
  },
  {
    n: "02",
    title: "Algorithmic appraisal",
    body: "Our financial model values your effort and assigns your tactical position based on your core stack.",
  },
  {
    n: "03",
    title: "The README flex",
    body: "Export dynamic, auto-updating Ultimate Team cards to showcase on your GitHub profile or socials.",
  },
  {
    n: "04",
    title: "The repo squad",
    body: "Drop any owner/repo and we line up its contributors as a full 4-3-3 — captain, bench and total value.",
  },
] as const;

export function HowItWorks() {
  return (
    <section data-tg-reveal className="mx-auto w-full max-w-[1400px] px-6 py-10 sm:py-14 lg:px-12">
      <div className="mb-6 flex items-center gap-3">
        <span className="font-mono text-xs tracking-[0.3em] text-[var(--tg-accent-dim)]">HOW THE MARKET WORKS</span>
        <div className="h-px flex-1 bg-[var(--tg-border-soft)]" aria-hidden />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step) => (
          <div
            key={step.n}
            className="rounded-xl border border-[var(--tg-border)] bg-[var(--tg-surface)] p-6 transition-colors hover:border-[rgba(47,255,0,0.35)]"
          >
            <div className="font-oswald text-2xl font-bold text-[var(--tg-accent)]">{step.n}</div>
            <h3 className="mt-3 font-oswald text-base font-semibold uppercase tracking-wide text-[var(--tg-fg)]">
              {step.title}
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--tg-muted-dim)]">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
