import { Suspense } from "react";
import { Footer } from "@/components/Footer";
import { HomeReveal } from "@/components/home/HomeReveal";
import { OmniSearch } from "@/components/home/OmniSearch";
import { HeroShowcase } from "@/components/home/HeroShowcase";
import { MostValuablePlayers } from "@/components/home/MostValuablePlayers";
import { SquadOfTheDay, SquadOfTheDaySkeleton } from "@/components/home/SquadOfTheDay";
import { HowItWorks } from "@/components/home/HowItWorks";
import { SigningsTicker } from "@/components/home/SigningsTicker";
import { PitchTexture } from "@/components/home/PitchTexture";

export default function LandingPage() {
  return (
    <HomeReveal>
      {/* overflow-x-clip is a safety net, not the fix — every real source of
          horizontal overflow (the 3D ring, chips, ticker) is contained at
          its own origin below. clip (not hidden) so it can't interfere with
          the Navbar's position:sticky in layout.tsx. */}
      <main className="tg-home relative flex flex-1 flex-col overflow-x-clip">
        {/* Navbar (h-[var(--nav-h)], in layout.tsx) + this block together
            fill exactly one screen — the ticker is this block's own last
            row, not fixed, so scrolling past it reveals Most Valuable
            Players below. Same max-w-[1400px] + lg:px-[72px] as the navbar
            so both align on the same outer edges; lg:pt-[72px] is the
            hero's own breathing room below the (now-slim) navbar. */}
        <div className="relative flex min-h-[calc(100dvh-var(--nav-h))] flex-col">
          <PitchTexture />
          <div className="mx-auto grid w-full max-w-[1400px] flex-1 grid-cols-1 items-stretch gap-10 px-6 pb-10 pt-10 lg:grid-cols-[minmax(0,1fr)_clamp(420px,40vw,680px)] lg:gap-12 lg:px-[72px] lg:pt-[72px] xl:gap-16">
            <div className="flex flex-col justify-center lg:-translate-x-3 lg:-translate-y-8">
              <div className="mb-5 flex items-center justify-center gap-2.5 lg:justify-start">
                <span
                  aria-hidden
                  className="h-[7px] w-[7px] rounded-full bg-[var(--tg-accent)] shadow-[0_0_10px_#2fff00]"
                />
                <span className="font-mono text-[11px] tracking-[0.32em] text-[var(--tg-accent-dim)] sm:text-[13px]">
                  THE DEVELOPER TRANSFER MARKET
                </span>
              </div>

              <h1 className="text-center font-oswald text-[44px] font-bold uppercase leading-[0.96] tracking-wide text-[var(--tg-fg)] sm:text-[64px] lg:text-left lg:text-[56px] xl:text-[72px] 2xl:text-[92px]">
                <span data-reveal-line className="block overflow-hidden">
                  Every dev
                </span>
                {/* whitespace-nowrap keeps "has a price■" a single
                    unbreakable line — without it, "has a" and "price■" can
                    split across two lines the moment the line is a hair
                    too narrow for both, turning the headline into three
                    lines instead of the intended two. */}
                <span data-reveal-line className="block overflow-hidden whitespace-nowrap">
                  has a price
                  <span
                    aria-hidden
                    className="ml-2.5 inline-block h-[0.35em] w-[0.35em] bg-[var(--tg-accent)] shadow-[0_0_16px_rgba(47,255,0,0.6)]"
                  />
                </span>
              </h1>

              <p
                data-reveal="subtitle"
                className="mx-auto mt-4 max-w-[480px] text-center text-base leading-relaxed text-[var(--tg-muted)] sm:text-lg lg:mx-0 lg:text-left"
              >
                GitHub profiles valued like elite footballers. Repos lined up as full squads. One search does both.
              </p>

              <div id="scout" className="mt-8 flex scroll-mt-24 justify-center lg:justify-start">
                <OmniSearch autoFocus />
              </div>
            </div>

            <div data-reveal="showcase" className="flex min-h-0 items-center justify-center">
              <HeroShowcase />
            </div>
          </div>

          <SigningsTicker />
        </div>

        <MostValuablePlayers />

        <section data-tg-reveal className="mx-auto w-full max-w-[1400px] px-6 py-6 sm:py-8 lg:px-12">
          <Suspense fallback={<SquadOfTheDaySkeleton />}>
            <SquadOfTheDay />
          </Suspense>
        </section>

        <HowItWorks />

        <Footer minimal />
      </main>
    </HomeReveal>
  );
}
