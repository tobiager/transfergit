import Link from "next/link";
import { SearchInput } from "@/components/SearchInput";
import { DevFan } from "@/components/DevFan";
import { GeneratedCounter } from "@/components/GeneratedCounter";
import { RepoStars } from "@/components/RepoStars";
import { LandingReveal } from "@/components/LandingReveal";

export default function LandingPage() {
  return (
    <LandingReveal>
      <main className="relative flex flex-1 flex-col overflow-hidden px-4 py-16 md:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,black,transparent)]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(29,117,163,0.35) 0 8px, transparent 8px 12px), repeating-linear-gradient(0deg, rgba(29,117,163,0.35) 0 8px, transparent 8px 12px)",
          }}
        />

        <div className="relative mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-12 self-center lg:grid-cols-[3fr_2fr] lg:gap-8">
          <div className="order-2 text-center lg:order-1 lg:text-left">
            <p className="font-display text-sm uppercase tracking-[0.3em] text-tm-blue-bright">
              Transfergit
            </p>

            <h1 className="mt-2 font-display text-6xl uppercase leading-[0.95] tracking-tight md:text-7xl lg:text-8xl">
              <span data-reveal-line className="block overflow-hidden">
                GET
              </span>
              <span data-reveal-line className="block overflow-hidden">
                SCOUTED<span className="text-value-green">.</span>
              </span>
            </h1>

            <p data-reveal="subtitle" className="mx-auto mt-5 max-w-md text-lg text-muted lg:mx-0">
              Your GitHub, valued like a football player. Market value, transfer history,
              injuries — the whole file.
            </p>

            <div className="mt-8 flex justify-center lg:justify-start">
              <SearchInput />
            </div>

            <p data-reveal="helper" className="mt-4 text-sm text-muted">
              Try{" "}
              <Link href="/torvalds" className="font-medium text-tm-blue-bright hover:underline">
                torvalds
              </Link>{" "}
              · or your own
              <span className="mx-2 text-border">|</span>
              <GeneratedCounter /> profiles scouted so far
            </p>
          </div>

          <div className="order-1 lg:order-2">
            <DevFan />
          </div>
        </div>

        <footer className="relative mt-auto flex flex-col items-center gap-1 pt-16 text-sm text-muted">
          <div className="flex items-center gap-3">
            <Link
              href="https://github.com/tobiager"
              target="_blank"
              rel="noreferrer"
              className="font-medium hover:text-foreground"
            >
              Built by @tobiager
            </Link>
            <span className="text-border">·</span>
            <Link
              href="https://github.com/tobiager/transfergit"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-foreground"
            >
              <RepoStars />
            </Link>
          </div>
        </footer>
      </main>
    </LandingReveal>
  );
}
