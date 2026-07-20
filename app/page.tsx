import Link from "next/link";
import { SearchInput } from "@/components/SearchInput";
import { SquadSearchInput } from "@/components/SquadSearchInput";
import { DevFan } from "@/components/DevFan";
import { LandingReveal } from "@/components/LandingReveal";
import { Ticker } from "@/components/Ticker";

const TRY_USERNAMES = ["torvalds", "yyx990803", "addyosmani"];

const HOW_IT_WORKS = [
  {
    title: "Signal Reading",
    body: "We analyze commits, PRs, stars, and streaks across public repos without touching your private code.",
  },
  {
    title: "Algorithmic Appraisal",
    body: "Our financial model values your effort and assigns your tactical position based on your core tech stack.",
  },
  {
    title: "The Readme Flex",
    body: "Export dynamic, auto-updating Ultimate Team cards to showcase on your GitHub profile or socials.",
  },
] as const;

export default function LandingPage() {
  return (
    <LandingReveal>
      <main className="relative flex min-h-[calc(100dvh-4rem)] flex-col">
        <div className="relative mx-auto grid w-full max-w-[1400px] flex-1 grid-cols-1 items-center gap-8 self-center px-6 py-6 lg:grid-cols-[1.2fr_1fr] lg:gap-16 lg:px-12">
          <div className="order-1 text-center lg:text-left">
            <p className="font-mono text-sm uppercase tracking-[0.3em] text-tm-blue-bright">
              The developer transfer market
            </p>

            <h1 className="mt-2 font-display text-5xl uppercase leading-[0.95] tracking-tight md:text-6xl lg:text-7xl">
              <span data-reveal-line className="block overflow-hidden">
                THE DEV
              </span>
              <span data-reveal-line className="block overflow-hidden">
                TRANSFER
              </span>
              <span data-reveal-line className="block overflow-hidden">
                MARKET
                <span aria-hidden className="glow-green ml-[0.15em] inline-block h-[0.35em] w-[0.35em] bg-value-green" />
              </span>
            </h1>

            <p data-reveal="subtitle" className="mx-auto mt-4 max-w-md text-lg text-muted lg:mx-0">
              Your GitHub, valued like an elite football player. Calculate your market value,
              check your release clause, and flex your card.
            </p>

            <div className="mt-6 flex justify-center lg:justify-start">
              <SearchInput autoFocus ctaLabel="CALCULATE VALUE →" />
            </div>

            <div data-reveal="helper" className="mt-4 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              <span className="text-sm text-muted">Try</span>
              {TRY_USERNAMES.map((username) => (
                <Link
                  key={username}
                  href={`/${username}`}
                  className="rounded-full border border-border bg-surface-elevated px-3 py-1 font-mono text-sm text-muted transition hover:border-value-green hover:text-foreground"
                >
                  {username}
                </Link>
              ))}
            </div>

            <div className="mt-6 flex flex-col items-center gap-2 lg:items-start">
              <span className="text-xs text-muted">Or scout an entire repo</span>
              <SquadSearchInput />
            </div>
          </div>

          <div className="order-2 -mb-8 origin-top scale-90 lg:order-2 lg:mb-0 lg:scale-100">
            <DevFan />
          </div>
        </div>

        <section className="mx-auto w-full max-w-[1400px] px-6 py-10 sm:py-14 lg:px-12 lg:py-16">
          <p className="text-center font-mono text-xs uppercase tracking-[0.3em] text-muted lg:text-left">
            How the market works
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {HOW_IT_WORKS.map((item, i) => (
              <div
                key={item.title}
                className="group rounded-xl tm-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-value-green/50 hover:bg-value-green/5 hover:shadow-[0_0_32px_rgba(0,230,118,0.15)]"
              >
                <span className="font-display text-2xl text-value-green/70 transition group-hover:text-value-green group-hover:glow-green-text">
                  0{i + 1}
                </span>
                <h3 className="mt-2 font-table text-base font-bold uppercase tracking-wide">{item.title}</h3>
                <p className="mt-2 text-sm text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <Ticker />
      </main>
    </LandingReveal>
  );
}
