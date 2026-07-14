// Transfermarkt's "position in detail" mini-pitch: a half-pitch diagram
// with the main position as a filled marker and the secondary as a hollow
// one, placed by role using a fixed lookup (not exact tactical coordinates,
// just enough to read as "roughly where on the pitch").
const ROLE_COORDS: Record<string, { x: number; y: number }> = {
  Goalkeeper: { x: 100, y: 235 },
  "Full-Back": { x: 160, y: 185 },
  "Defensive Midfielder": { x: 100, y: 178 },
  "Central Midfielder": { x: 100, y: 138 },
  "Attacking Midfielder": { x: 100, y: 98 },
  "Right Winger": { x: 165, y: 75 },
};

const DEFAULT_COORD = { x: 100, y: 138 };

function coordFor(role: string) {
  return ROLE_COORDS[role] ?? DEFAULT_COORD;
}

export function PositionPitch({ main, secondary }: { main: string; secondary: string }) {
  const mainCoord = coordFor(main);
  const secondaryCoord = secondary !== main ? coordFor(secondary) : null;

  return (
    <svg
      viewBox="0 0 200 260"
      style={{ width: "100%", height: "auto" }}
      role="img"
      aria-label={`Position: ${main}`}
    >
      <rect x="2" y="2" width="196" height="256" rx="4" fill="var(--pitch-elevated)" stroke="var(--border)" />
      <g fill="none" stroke="var(--border)" strokeWidth="1.5">
        <rect x="2" y="2" width="196" height="256" rx="4" />
        <rect x="35" y="196" width="130" height="60" />
        <rect x="70" y="234" width="60" height="22" />
        <path d="M70 196 A30 30 0 0 1 130 196" />
        <circle cx="100" cy="256" r="1.5" fill="var(--border)" />
        <path d="M20 2 A80 80 0 0 0 180 2" />
      </g>

      {secondaryCoord && (
        <g>
          <circle
            cx={secondaryCoord.x}
            cy={secondaryCoord.y}
            r="9"
            fill="var(--surface)"
            stroke="var(--tm-blue-bright)"
            strokeWidth="2"
          />
        </g>
      )}

      <g>
        <circle cx={mainCoord.x} cy={mainCoord.y} r="10" fill="var(--value-green)" />
        <circle cx={mainCoord.x} cy={mainCoord.y} r="10" fill="none" stroke="var(--pitch-elevated)" strokeWidth="2" />
      </g>
    </svg>
  );
}
