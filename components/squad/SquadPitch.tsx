import type { Starter } from "@/lib/squad";
import { pitchPosition } from "@/lib/squad/pitchLayout";
import { PitchPlayer } from "./PitchPlayer";

// Real pitch proportions (68m wide x 105m long), drawn vertically:
// attack faces up, the goalkeeper's box sits at the bottom.
function PitchLines() {
  return (
    <svg viewBox="0 0 68 105" className="absolute inset-0 h-full w-full" aria-hidden preserveAspectRatio="none">
      <g fill="none" stroke="var(--grid-line)" strokeWidth="0.4">
        <rect x="1" y="1" width="66" height="103" rx="2" />
        <line x1="1" y1="52.5" x2="67" y2="52.5" />
        <circle cx="34" cy="52.5" r="9.15" />
        <circle cx="34" cy="52.5" r="0.4" fill="var(--grid-line)" />
        {/* Bottom penalty area — goalkeeper's end */}
        <rect x="13.85" y="88.5" width="40.3" height="16.5" />
        <rect x="24.85" y="99" width="18.3" height="6" />
        {/* Top penalty area — attacking end */}
        <rect x="13.85" y="0" width="40.3" height="16.5" />
        <rect x="24.85" y="0" width="18.3" height="6" />
      </g>
    </svg>
  );
}

export function SquadPitch({
  starters,
  captainLogin,
  mvpLogin,
}: {
  starters: Starter[];
  captainLogin: string;
  mvpLogin: string;
}) {
  return (
    <div
      data-reveal
      className="relative mx-auto aspect-[68/118] w-full max-w-[36rem] rounded-xl border border-border bg-pitch-elevated"
    >
      <PitchLines />

      {starters.map((player) => {
        const pos = pitchPosition(player.position.x, player.position.y);
        return (
          <div
            key={player.login}
            data-reveal-row
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out"
            style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
          >
            <PitchPlayer
              player={player}
              isCaptain={player.login === captainLogin}
              isMvp={player.login === mvpLogin}
            />
          </div>
        );
      })}
    </div>
  );
}
