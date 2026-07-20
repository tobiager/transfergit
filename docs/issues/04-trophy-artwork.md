**Title:** Replace flat trophy icons with generated realistic artwork
**Labels:** `good first issue`, `enhancement`, `area:content`
**Estimate:** S (~half a day) — art/generation work, near-zero code.

## Context

The 14 achievement trophies (`lib/achievements.ts`) currently render as flat SVG icons from
[`public/trophies/`](../../public/trophies/): `acute-burnout`, `bug-catcher`, `crowd-favorite`, `engine-room`,
`golden-boot-repo`, `golden-boot-season`, `loan-spell`, `open-source-hero`, `playmaker`, `polyglot`, `risky-deploy`,
`system-architect`, `veteran`, `world-cup-player`.

**This is already a zero-code-change task.** [`lib/trophyAssets.ts`](../../lib/trophyAssets.ts)'s
`resolveTrophyIconSrc(id)` already prefers a `public/trophies/{id}.png` over the bundled `.svg` when one exists:

```ts
export function resolveTrophyIconSrc(id: string): string {
  if (fs.existsSync(path.join(TROPHIES_DIR, `${id}.png`))) {
    return `/trophies/${id}.png`;
  }
  return `/trophies/${id}.svg`;
}
```

So this issue is: generate/design a realistic (or at least higher-fidelity) PNG for each trophy id, matching its
name/theme, and drop it into `public/trophies/{id}.png`. No `.ts`/`.tsx` file needs to change.

## Acceptance criteria

- [ ] A `.png` exists in `public/trophies/` for as many of the 14 ids as you tackle (partial PRs — a subset of
      trophies — are fine, they don't need to land all at once).
- [ ] Each artwork visually reflects what the trophy represents (check its description/criteria in
      `lib/achievements.ts` for what each one means before designing it).
- [ ] Reasonable file size — this is served to every profile page that has earned the trophy; keep each PNG under
      ~200KB (compress/optimize before committing).
- [ ] Doesn't visually break at the small sizes trophies render at (check `components/TrophyCabinet.tsx` and
      `components/TrophyIcon.tsx` for the actual render sizes) — a busy, detailed image can turn to mush at 32px.

## Notes

Style is your call — "realistic" per the original ask could mean 3D-rendered, painterly, or a more detailed
illustration style than the current flat icon set; the only hard requirement is that it reads clearly at the sizes
above and fits the existing dark/green Transfergit palette (see `app/globals.css` for the design tokens) well
enough not to clash.
