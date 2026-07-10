import Image from "next/image";
import Link from "next/link";
import type { Player } from "@/lib/types";
import { computeMarketValueTrend } from "@/lib/format";
import { MarketValueBox } from "./MarketValueBox";
import { TiltCard } from "./TiltCard";
import { Flag } from "./Flag";

function QuickFact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value}</dd>
    </div>
  );
}

export function PlayerHeader({ player }: { player: Player }) {
  const trend = computeMarketValueTrend(player.marketValueHistory);

  return (
    <TiltCard data-reveal="header" className="tm-card rounded-xl p-5 md:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start lg:flex-1">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg border-2 border-border/80 md:h-32 md:w-32">
            <Image
              src={player.avatarUrl}
              alt={player.login}
              fill
              sizes="128px"
              className="object-cover"
              priority
            />
          </div>

          <div className="w-full min-w-0 text-center sm:text-left">
            <h1 className="font-display text-4xl font-extrabold leading-none tracking-tight md:text-5xl">
              {player.name}
            </h1>
            <Link
              href={`https://github.com/${player.login}`}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-tm-blue-bright hover:underline"
            >
              @{player.login}
            </Link>

            <p className="mt-1.5 whitespace-nowrap text-sm uppercase tracking-wide text-foreground">
              <span className="font-bold">{player.position.main}</span>
              <span className="ml-2 text-xs font-medium text-muted">{player.position.secondary}</span>
            </p>

            <p className="mt-1 max-w-xl text-sm italic text-gold/90">&ldquo;{player.scoutReport}&rdquo;</p>

            <dl className="mx-auto mt-4 grid max-w-md grid-cols-2 gap-x-6 gap-y-3 sm:mx-0">
              <QuickFact label="Age" value={player.age} />
              <QuickFact
                label="Nationality"
                value={
                  <span className="flex items-center gap-1.5">
                    <Flag code={player.nationalityIso2} size={16} />
                    {player.nationalityName}
                  </span>
                }
              />
              <QuickFact label="Place of birth" value={player.birthPlace} />
              <QuickFact label="Preferred foot" value={player.position.foot} />
              <QuickFact label="Club" value={player.currentClub} />
              <QuickFact label="Agent" value={player.agent} />
            </dl>
          </div>
        </div>

        <div className="w-full lg:w-72 lg:shrink-0">
          <MarketValueBox
            value={player.marketValue}
            updatedAt={player.marketValueUpdatedAt}
            trend={trend}
            history={player.marketValueHistory}
            recordValue={player.recordValue}
          />
        </div>
      </div>
    </TiltCard>
  );
}
