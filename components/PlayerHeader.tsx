import Image from "next/image";
import Link from "next/link";
import type { Player } from "@/lib/types";
import { computeMarketValueTrend, seededFileNumber } from "@/lib/format";
import { abbreviatePosition } from "@/lib/positions";
import { MarketValueBox } from "./MarketValueBox";
import { TiltCard } from "./TiltCard";
import { Flag } from "./Flag";

function Fact({ children }: { children: React.ReactNode }) {
  return <span className="whitespace-nowrap">{children}</span>;
}

export function PlayerHeader({ player, rank }: { player: Player; rank: number }) {
  const trend = computeMarketValueTrend(player.marketValueHistory);

  return (
    <TiltCard data-reveal="header" className="px-1">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start lg:flex-1">
          <div className="relative shrink-0 pb-4">
            <div className="relative h-32 w-32 overflow-hidden rounded-lg border-2 border-border/80 md:h-40 md:w-40">
              <Image
                src={player.avatarUrl}
                alt={player.login}
                fill
                sizes="160px"
                className="object-cover"
                priority
              />
            </div>
            <span
              title="Rank vs legends"
              className="glow-green absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-value-green bg-pitch px-2.5 py-0.5 font-display text-sm text-value-green"
            >
              #{rank}
            </span>
          </div>

          <div className="w-full min-w-0 text-center sm:text-left">
            <p className="flex flex-wrap items-center justify-center gap-2 font-mono text-sm text-muted sm:justify-start">
              <Link
                href={`https://github.com/${player.login}`}
                target="_blank"
                rel="noreferrer"
                className="text-value-green hover:underline"
              >
                @{player.login}
              </Link>
              <span className="rounded border border-border px-2 py-0.5 text-xs">
                FILE N° {seededFileNumber(player.login)}
              </span>
            </p>

            <h1 className="mt-1 font-display text-4xl uppercase leading-[0.95] tracking-tight md:text-5xl lg:text-6xl">
              {player.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-sm text-muted sm:justify-start">
              <Fact>
                <span className="mr-1.5 inline-flex align-middle">
                  <Flag code={player.nationalityIso2} size={16} />
                </span>
                {player.nationalityName}
              </Fact>
              <span className="text-border">|</span>
              <Fact>
                Position: <span className="font-semibold text-foreground">{player.position.main}</span>{" "}
                ({abbreviatePosition(player.position.main)})
              </Fact>
              <span className="text-border">|</span>
              <Fact>
                Club: <span className="font-semibold text-foreground">{player.currentClub}</span>
              </Fact>
              <span className="text-border">|</span>
              <Fact>Pro since {player.joinedYear}</Fact>
            </div>

            <p className="mt-3 max-w-xl text-sm italic text-gold/90">&ldquo;{player.scoutReport}&rdquo;</p>
          </div>
        </div>

        <div className="w-full lg:w-80 lg:shrink-0">
          <MarketValueBox value={player.marketValue} trend={trend} history={player.marketValueHistory} />
        </div>
      </div>

      <div className="mx-auto mt-5 flex w-fit flex-wrap items-center justify-center gap-x-3 gap-y-1.5 border-t border-border pt-4 text-sm text-muted sm:mx-0 sm:justify-start">
        <Fact>
          Agent: <span className="font-medium text-foreground">{player.agent}</span>
        </Fact>
        <span className="text-border">|</span>
        <Fact>
          Preferred stack: <span className="font-medium text-foreground">{player.provider}</span>
        </Fact>
        <span className="text-border">|</span>
        <Fact>
          Preferred foot: <span className="font-medium text-foreground">{player.position.foot}</span>
        </Fact>
      </div>
    </TiltCard>
  );
}
