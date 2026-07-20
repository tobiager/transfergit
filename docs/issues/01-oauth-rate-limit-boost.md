**Title:** Optional GitHub OAuth login to use the visitor's own rate-limit budget
**Labels:** `good first issue`, `enhancement`, `area:core`
**Estimate:** M-L (~2-3 days) — larger than the rest of this batch, listed as "good first issue" because the scope
is well-defined, not because it's small.

## Context

Every visitor's GitHub API calls currently ride on the single server-side `GITHUB_TOKEN`
([`lib/github.ts`](../../lib/github.ts), [`lib/squad/contributors.ts`](../../lib/squad/contributors.ts),
[`lib/squad/valuation.ts`](../../lib/squad/valuation.ts)) — one shared 5,000-points/hour budget for the whole
site (see [`docs/caching-and-rate-limits.md`](../caching-and-rate-limits.md) for the real cost accounting). Caching
absorbs most of this today, but a viral spike of cold (never-cached) lookups could exhaust the shared budget for
everyone.

The ask: let a visitor **optionally** sign in with their own GitHub account (OAuth) so *their* lookups draw on
*their own* rate limit instead of the shared one. This should be additive — the site must keep working exactly as
it does today for anyone who doesn't sign in.

## Files involved

- New: an OAuth flow — a GitHub OAuth App (not a PAT), a callback route under `app/api/`, and short-lived session
  storage (a signed cookie is enough; no database exists in this project and this shouldn't be the reason to add
  one).
- `lib/github.ts` — `githubGraphQL()` currently reads `process.env.GITHUB_TOKEN` unconditionally; needs a path to
  accept a per-request token instead.
- `lib/squad/contributors.ts`, `lib/squad/valuation.ts` — same, for the REST calls.
- `components/Navbar.tsx` / `components/NavbarClient.tsx` — where a "Sign in with GitHub" affordance would live.

## Acceptance criteria

- [ ] A visitor can sign in with GitHub OAuth (read-only, no scopes beyond what's needed to identify them + get a
      usable API token) and out again.
- [ ] While signed in, that visitor's page loads and exports use their own token instead of the shared server one
      — verify by checking `x-ratelimit-remaining` behavior or via logging.
- [ ] Signed-out behavior is **byte-identical** to today — no regression for the default (unauthenticated) path.
- [ ] No new database — session state must fit in a signed cookie or equivalent.
- [ ] `docs/caching-and-rate-limits.md` updated to describe the new per-user path alongside the existing shared one.

## Notes

This is explicitly optional/best-effort — don't block on handling every OAuth edge case (revoked tokens mid-session
etc.) perfectly for a first version; document known limitations instead.
