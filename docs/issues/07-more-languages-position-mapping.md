**Title:** Support more languages in the position/stack mapping
**Labels:** `good first issue`, `enhancement`, `area:core`
**Estimate:** S (~1-2 hours)

## Context

[`lib/positions.ts`](../../lib/positions.ts) maps a profile's dominant GitHub language(s) to a football position
(e.g. frontend → Right Winger, backend → Central Midfielder, devops → Goalkeeper, data/ML → Defensive Midfielder,
mobile → Full-Back) via five hardcoded `Set`s:

```ts
FRONTEND_LANGS = JavaScript, TypeScript, HTML, CSS, Vue, Svelte
BACKEND_LANGS  = Java, Go, Python, C#, PHP, Rust, Ruby, C, C++, Elixir
DEVOPS_LANGS   = Shell, Dockerfile, HCL, YAML, Makefile
MOBILE_LANGS   = Swift, Kotlin, Dart, Objective-C
DATAML_LANGS   = Jupyter Notebook, R
```

A language GitHub reports that isn't in any of these five sets is simply invisible to `categorize()` — it still
counts toward `topLanguage` (used for "preferred foot" and the "Preferred stack" display) unless it's also in
`EXCLUDED_FROM_TOP_LANGUAGE`, but it contributes to **no** tactical category, which can silently skew a profile's
computed position for anyone whose repos lean on an unmapped language. Confirmed gaps: Lua, Zig, Haskell, Scala,
Clojure, Erlang/Elixir siblings, OCaml, Perl, PowerShell, Julia, MATLAB, Groovy, Assembly, Nim, Crystal, F#, and
more aren't in any set today.

## Files involved

- [`lib/positions.ts`](../../lib/positions.ts) — the five `*_LANGS` sets, and `TYPED_LANGS` (which drives the
  "preferred foot" joke — typed language → right foot) which has its own, smaller gap (e.g. Haskell, Scala, OCaml,
  F#, Swift-adjacent statically-typed languages aren't all present).
- [`lib/positions.test.ts`](../../lib/positions.ts) — check whether a test file exists; if not, this is a good
  place to add one (`computePosition` is a pure function, easy to unit test with a synthetic `GithubRepo[]`).

## Acceptance criteria

- [ ] Add at least the languages listed above (or others you find missing) to the correct category — use GitHub's
      own [linguist language list](https://github.com/github-linguist/linguist/blob/main/lib/linguist/languages.yml)
      as a reference for what GitHub actually reports as `primaryLanguage.name`, don't guess spellings.
- [ ] `TYPED_LANGS` gets the same treatment for statically-typed languages you add.
- [ ] A test (new or existing) exercises `computePosition` and `TYPED_LANGS` classification for at least a few of
      the newly-added languages.
- [ ] Don't remove or reclassify any existing language without a clear reason — this changes real people's
      computed position, so treat existing mappings as intentional unless you find one that's clearly wrong.

## Notes

If a language doesn't cleanly fit any of the five categories, it's fine to leave it unmapped (it'll still count
toward `topLanguage`) — use judgment rather than forcing every possible language into a bucket.
