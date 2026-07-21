// Faint pitch-line motif behind the hero (design/home/TransferGit
// Home.dc.html §1a/§1b) — real layered divs matching the mockup's own
// markup 1:1, not a CSS background-image approximation. Desktop (1a) adds
// the center line, both touchlines and the kickoff dot on top of the
// mobile (1b) circle + top glow. Must sit on a `position:relative`
// ancestor sized to the hero only, not the whole scrollable page.
export function PitchTexture() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-1/2 top-[80px] h-[300px] w-[300px] -translate-x-1/2 rounded-full border-[1.5px] border-[rgba(0,230,118,0.05)] lg:top-[120px] lg:h-[560px] lg:w-[560px]" />
      <div className="absolute inset-x-0 top-0 h-[300px] bg-[radial-gradient(ellipse_90%_100%_at_50%_0%,rgba(0,230,118,0.06),transparent_70%)] lg:h-[420px] lg:bg-[radial-gradient(ellipse_60%_100%_at_70%_0%,rgba(0,230,118,0.06),transparent_70%)]" />
      <div className="absolute left-1/2 top-0 bottom-0 hidden w-[1.5px] -translate-x-1/2 bg-[rgba(0,230,118,0.045)] lg:block" />
      <div className="absolute left-[72px] top-0 bottom-0 hidden w-px bg-[rgba(0,230,118,0.05)] lg:block" />
      <div className="absolute right-[72px] top-0 bottom-0 hidden w-px bg-[rgba(0,230,118,0.05)] lg:block" />
      <div className="absolute left-1/2 top-[396px] hidden h-2 w-2 -translate-x-1/2 rounded-full bg-[rgba(0,230,118,0.10)] lg:block" />
    </div>
  );
}
