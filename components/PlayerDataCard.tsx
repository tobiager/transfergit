import type { Player } from "@/lib/types";

export function PlayerDataCard({ player }: { player: Player }) {
  const rows: Array<[string, string]> = [
    ["Club actual", player.currentClub],
    ["Fichado", player.joinedDate],
    ["Contrato hasta", player.contractUntil],
    ["F. Nacim./Edad", `${player.birthDate} (${player.age})`],
    ["Lugar de nac.", player.birthPlace],
    [
      "Nacionalidad",
      player.nationalityName
        ? `${player.nationalityFlag} ${player.nationalityName}`
        : player.nationalityFlag,
    ],
    ["Agente", player.agent],
    ["Proveedor", player.provider],
    ["Pie hábil", player.position.foot],
  ];

  return (
    <div data-reveal-item className="overflow-hidden rounded-xl tm-card">
      <h2 className="bg-tm-blue-deep px-4 py-2 font-table text-lg font-bold uppercase tracking-wide text-white">
        Datos del jugador
      </h2>
      <dl className="divide-y divide-border">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
            <dt className="text-muted">{label}</dt>
            <dd className="text-right font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
