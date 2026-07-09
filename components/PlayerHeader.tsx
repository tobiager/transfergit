import Image from "next/image";
import Link from "next/link";
import type { Player } from "@/lib/types";
import { formatNumber, computeMarketValueTrend } from "@/lib/format";
import { MarketValueBox } from "./MarketValueBox";
import { TiltCard } from "./TiltCard";

export function PlayerHeader({ player }: { player: Player }) {
  const trend = computeMarketValueTrend(player.marketValueHistory);

  return (
    <TiltCard data-reveal="header" className="tm-card rounded-xl p-5 md:p-6">
      <div className="flex flex-col flex-wrap items-center gap-6 md:flex-row md:items-start">
        <div className="relative mx-auto h-28 w-28 shrink-0 overflow-hidden rounded-lg border-2 border-border/80 md:mx-0 md:h-36 md:w-36">
          <Image
            src={player.avatarUrl}
            alt={player.login}
            fill
            sizes="144px"
            className="object-cover"
            priority
          />
        </div>

        <div className="w-full min-w-0 flex-1 text-center md:text-left">
          <h1 className="font-display text-5xl font-extrabold leading-none tracking-tight md:text-6xl">
            <span className="mr-2 text-muted/50">#—</span>
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

          {player.bio && (
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted md:mx-0">{player.bio}</p>
          )}

          <div className="mt-5 flex flex-wrap justify-center gap-5 md:justify-start">
            <Trophy icon="⭐" label="Stars" value={player.trophies.stars} />
            <Trophy icon="🍴" label="Forks" value={player.trophies.forks} />
            <Trophy icon="📦" label="Repos" value={player.trophies.repos} />
            <Trophy icon="👥" label="Followers" value={player.trophies.followers} />
          </div>
        </div>

        <div className="w-full md:w-auto">
          <MarketValueBox
            value={player.marketValue}
            updatedAt={player.marketValueUpdatedAt}
            trend={trend}
          />
        </div>
      </div>
    </TiltCard>
  );
}

function Trophy({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-tm-blue-bright/40 bg-surface-elevated text-2xl shadow-inner shadow-tm-blue-deep/40">
        {icon}
      </div>
      <span className="font-display text-lg font-bold leading-none tabular-nums">
        {formatNumber(value)}
      </span>
      <span className="text-[11px] uppercase tracking-wide text-muted">{label}</span>
    </div>
  );
}
