import Image from "next/image";
import type { Player } from "@/lib/types";
import { Flag } from "./Flag";

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
      <h2 className="bg-tm-blue-deep px-4 py-2 font-table text-lg font-bold uppercase tracking-wide text-white">
        Player Data
      </h2>
      <dl className="divide-y divide-border">
        {rows.map(([label, value]) => (
          <div key={label as string} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
            <dt className="text-muted">{label}</dt>
            <dd className="text-right font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
