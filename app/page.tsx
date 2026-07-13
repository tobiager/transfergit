import Link from "next/link";
import { SearchInput } from "@/components/SearchInput";
import { DevFan } from "@/components/DevFan";
import { LandingReveal } from "@/components/LandingReveal";
import { Ticker } from "@/components/Ticker";

const TRY_USERNAMES = ["torvalds", "yyx990803", "addyosmani"];

export default function LandingPage() {
  return (
    <LandingReveal>
      <main className="relative flex min-h-[calc(100dvh-4rem)] flex-col lg:h-[calc(100dvh-4rem)] lg:overflow-hidden">
        <div className="relative mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-8 self-center px-4 py-6 lg:grid-cols-[3fr_2fr] lg:gap-8">
          <div className="order-2 text-center lg:order-1 lg:text-left">
            <p className="font-mono text-sm uppercase tracking-[0.3em] text-tm-blue-bright">
              The developer transfer market
            </p>

            <h1 className="mt-2 font-display text-5xl uppercase leading-[0.95] tracking-tight md:text-6xl lg:text-7xl">
              <span data-reveal-line className="block overflow-hidden">
                GET
              </span>
              <span data-reveal-line className="block overflow-hidden">
                SCOUTED
                <span aria-hidden className="glow-green ml-[0.15em] inline-block h-[0.35em] w-[0.35em] bg-value-green" />
              </span>
            </h1>

            <p data-reveal="subtitle" className="mx-auto mt-4 max-w-md text-lg text-muted lg:mx-0">
              Your GitHub, valued like a football player. Market value, transfer history,
              injuries — the whole file, ready to share.
            </p>

            <div className="mt-6 flex justify-center lg:justify-start">
              <SearchInput autoFocus />
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
          </div>

          <div className="order-1 lg:order-2">
            <DevFan />
          </div>
        </div>

        <Ticker />
      </main>
    </LandingReveal>
  );
}
