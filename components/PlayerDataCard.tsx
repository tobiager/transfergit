import Image from "next/image";
import type { Player } from "@/lib/types";
import { Flag } from "./Flag";
import { SectionHeader } from "./SectionHeader";

export function PlayerDataCard({ player }: { player: Player }) {
  const rows: Array<[string, React.ReactNode]> = [
    [
      "Current club",
      <span key="club" className="flex items-center justify-end gap-2">
        {player.currentClubAvatar && (
          <Image
            src={player.currentClubAvatar}
            alt=""
            width={18}
            height={18}
            className="rounded-sm"
          />
        )}
        {player.currentClub}
      </span>,
    ],
    ["Joined", player.joinedDate],
    ["Date of birth / Age", `${player.birthDate} (${player.age})`],
    ["Place of birth", player.birthPlace],
    [
      "Nationality",
      <span key="nationality" className="flex items-center justify-end gap-2">
        <Flag code={player.nationalityIso2} size={18} />
        {player.nationalityName}
      </span>,
    ],
    ["Agent", player.agent],
    ["Preferred stack", player.provider],
    ["Preferred foot", player.position.foot],
  ];

  return (
    <div data-reveal-item className="overflow-hidden rounded-xl tm-card">
      <SectionHeader title="Player Data" />
      <dl className="divide-y divide-border">
        {rows.map(([label, value]) => (
          <div key={label as string} className="flex h-11 items-center justify-between gap-4 px-4 text-sm">
            <dt className="text-muted">{label}</dt>
            <dd className="text-right font-medium tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
