# Formations

Source of truth: [`lib/squad/formations.ts`](../lib/squad/formations.ts). Coordinates are Cartesian, 0–100 on both
axes: `x`: 0 = left touchline, 100 = right touchline. `y`: 0 = own goal line, 100 = opponent's goal line. Slot order
matters — it's the commit-ranking priority `lib/squad/roles.ts` uses (index 0 = most commits).

## Full strength (≥11 human contributors) — 4 selectable formations

All four keep the classic goalkeeper-last slot order. `FULL_FORMATION_ORDER` (`433, 442, 352, 4231`) is the
display order — `433` is the default.

| Formation | Shape |
|---|---|
| `433` (default) | GK · LB CB CB RB · CDM CM CM · LW ST RW |
| `442` | GK · LB CB CB RB · LM CM CM RM · ST ST |
| `352` | GK · CB CB CB · LWB CDM CM CM RWB · ST ST |
| `4231` | GK · LB CB CB RB · CDM CDM · CAM · LW ST RW |

`4231`'s forward line/CAM use hand-tuned explicit `y` values (not the shared bands) — the shared bands left the
wingers crammed against the striker with a gap down to the CDMs; see the comment above the `"4231"` entry.

## Below 11 players — degrade table

Fewer than 11 human contributors clamps to the nearest available count (3–10) and picks from a table of
"degraded" shapes (`def-mid-fwd`, always +1 GK). Multiple shapes are offered only where there's a real tactical
choice — a single-shape count gets no formation pills.

| Count | Shape(s) | def-mid-fwd |
|---|---|---|
| 10 | `432`, `342` | 4-3-2 / 3-4-2 |
| 9 | `332`, `233` | 3-3-2 / 2-3-3 |
| 8 | `331` | 3-3-1 |
| 7 | `231`, `321` | 2-3-1 / 3-2-1 *(small-sided from here down)* |
| 6 | `221` | 2-2-1 |
| 5 | `121` | 1-2-1 |
| 4 | `111` | 1-1-1 |
| 3 | `11` | 1-0-1 (bare minimum: GK + 1 defender + 1 forward) |

Degraded slot generation (`buildDegradedSlots`): forwards first, then midfielders, then defenders, GK always last
— same commit-priority ordering as the full formations. `buildLine()` spreads each line evenly across
`x = 4..96`, nudging alternating slots forward/back slightly so the line doesn't look like a perfectly straight
grid.

## Small-sided mode

`isSmallSided(count)` = `count <= 7` (`SMALL_SIDED_MAX`). Below that threshold:

- The pitch is a compressed **half-pitch** (futsal-style: one penalty box, halfway line near the top) instead of a
  full 11-a-side pitch — see `SquadPitch.tsx`'s `SmallPitchLines` / the OG route's `SmallPitchLines`.
- Different y-bands (`SMALL_BANDS`: gk 0 / def 33 / mid 66 / fwd 100) than the full pitch (`FULL_BANDS`: gk 0 /
  def 22 / mid 56 / fwd 94, with an extra `CDM_BAND` at 40) — the small court is wide-but-short, so the spread
  leans on nearly the full y-range instead of mirroring the full pitch's proportions.
- `buildLine()`'s `xBias` (17 when small) shifts alternating lines sideways so two different lines of the same
  parity (e.g. a 2-man DEF and a 2-man MID) don't spread across identical x positions and collide vertically —
  the full pitch's y-bands are already far enough apart not to need this.
- Chips render larger (`chipScale()`: 1.4× below 8 players, 1.15× at 8–10, 1× at 11) so a 3-a-side repo doesn't
  look like three dots lost on a full-size pitch.

Every formation at every count must satisfy a **minimum pixel distance** between any two slots (1.5× a chip's
rendered width) — enforced by `formations.test.ts`'s collision test, not just eyeballed.

## `?layout=` encoding (Custom formation)

Not a table lookup — a client-side drag, encoded by
[`lib/squad/customLayout.ts`](../lib/squad/customLayout.ts):

```
GK:50.0,0.0;RB:98.0,22.0;CB_R:66.0,22.0;...
```

`slotId:x,y` triples, semicolon-separated, one decimal place per axis, no JSON/base64 — deliberately
human-diffable in a pasted URL. Keyed by **slot id**, not player login: a slot's role tag (GK/CB/ST/...) stays
tied to whoever `assignRoles` already put there; dragging only moves `x`/`y`. Full URL shape:
`?formation=custom&base=433&layout=...` — `base` records the standard formation the drag started from, since
`custom` on its own carries no role/slot assignment to override. See [`squad.md`](squad.md#4-custom-drag-and-drop-formations)
and [`exports.md`](exports.md#wysiwyg-via-formationbaselayout).

## Pitch coordinate math

`lib/squad/pitchLayout.ts` is pure, framework-free coordinate math shared by the live pitch, the drag handler, and
every export renderer, so a given `(x, y)` always lands in the same visual spot everywhere:

- `pitchPosition(x, y, small)` — formation coords → visual `{left, top}` %, insetting so a chip's own footprint
  never clips the pitch edge (`PITCH_INSET_X/Y`, separate small-sided variants) and applying a small optical nudge
  (`PITCH_NUDGE_X/Y`).
- `pitchPositionInverse` — the reverse, used to turn a drag pointer's position back into formation coordinates.
- `clampToSafeArea` — keeps a dragged chip's anchor inside the same inset box.
- `pitchPositionHorizontal` — a **faithful 90° rotation** for the landscape (Social) export: `left` is a straight
  linear map of `y` (not a piecewise remap tuned only to the 4 standard formations), so a custom-dragged layout
  reflects at its true relative position instead of distorting.
