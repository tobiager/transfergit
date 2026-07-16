export function PlayerBadges({ isCaptain, isMvp }: { isCaptain: boolean; isMvp: boolean }) {
  if (!isCaptain && !isMvp) return null;

  return (
    <>
      {isCaptain && (
        <span
          title="Captain"
          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-tm-blue-bright font-mono text-[9px] font-bold text-pitch ring-2 ring-pitch-elevated"
        >
          C
        </span>
      )}
      {isMvp && (
        <span
          title="MVP"
          className="trophy-glow-gold absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold font-mono text-[9px] font-bold text-pitch ring-2 ring-pitch-elevated"
        >
          ★
        </span>
      )}
    </>
  );
}
