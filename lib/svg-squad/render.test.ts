import { test } from "node:test";
import assert from "node:assert/strict";
import { renderSquadCardSvg, renderSquadErrorCardSvg } from "./render.ts";
import type { Squad, Starter } from "../squad/types.ts";

function starter(login: string, overrides: Partial<Starter> = {}): Starter {
  return {
    login,
    avatarUrl: `https://avatars/${login}`,
    commits: 10,
    followers: 0,
    starsTotal: 0,
    mainLanguage: null,
    countryName: null,
    countryIso2: null,
    marketValue: 100000,
    marketValueFormatted: "€100k",
    position: { id: "GK", label: "Goalkeeper", role: "GK", x: 50, y: 50 },
    ...overrides,
  };
}

function squad(overrides: Partial<Squad> = {}): Squad {
  const starters = overrides.starters ?? [starter("alice"), starter("bob"), starter("carol")];
  return {
    owner: "acme",
    repo: "widgets",
    formation: "11",
    formationOptions: ["11"],
    starters,
    bench: [],
    reserves: [],
    totalValue: 100000,
    totalValueFormatted: "€100k",
    mvp: starters[0],
    captain: starters[0],
    pendingValuations: [],
    ...overrides,
  };
}

test("renders a well-formed SVG document", () => {
  const svg = renderSquadCardSvg({
    squad: squad(),
    siteHost: "transfergit.dev",
    avatarDataUris: new Map(),
    logoDataUri: "data:image/png;base64,AAA",
    animate: true,
  });
  assert.match(svg, /^<\?xml/);
  assert.match(svg, /<svg[^>]*width="1200"/);
});

test("embeds the logo (header + footer), not just squad content", () => {
  const svg = renderSquadCardSvg({
    squad: squad(),
    siteHost: "transfergit.dev",
    avatarDataUris: new Map(),
    logoDataUri: "data:image/png;base64,AAA",
    animate: true,
  });
  const logoOccurrences = svg.split('href="data:image/png;base64,AAA"').length - 1;
  assert.equal(logoOccurrences, 2, "logo should appear once in the header and once in the footer");
});

test("escapes dynamic strings so a hostile repo/owner name can't inject markup", () => {
  const svg = renderSquadCardSvg({
    squad: squad({ owner: 'a"<script>alert(1)</script>', repo: "b&c" }),
    siteHost: "transfergit.dev",
    avatarDataUris: new Map(),
    logoDataUri: "data:image/png;base64,AAA",
    animate: true,
  });
  assert.doesNotMatch(svg, /<script>/);
  assert.match(svg, /&amp;c/);
});

test("uses the small-sided half-pitch under 8 players, the full pitch at 8+", () => {
  const small = renderSquadCardSvg({
    squad: squad({ starters: [starter("a"), starter("b"), starter("c")] }),
    siteHost: "h",
    avatarDataUris: new Map(),
    logoDataUri: "data:image/png;base64,AAA",
    animate: true,
  });
  assert.match(small, /viewBox="0 0 68 51"/);

  const eleven = Array.from({ length: 11 }, (_, i) => starter(`p${i}`));
  const full = renderSquadCardSvg({
    squad: squad({ starters: eleven, mvp: eleven[0], captain: eleven[0] }),
    siteHost: "h",
    avatarDataUris: new Map(),
    logoDataUri: "data:image/png;base64,AAA",
    animate: true,
  });
  assert.match(full, /viewBox="0 0 68 105"/);
});

test("a pending (null) valuation renders as an em dash, never a fabricated €0", () => {
  const pending = starter("dave", { marketValue: null, marketValueFormatted: "—", valuationPending: true });
  const svg = renderSquadCardSvg({
    squad: squad({ starters: [starter("alice"), pending, starter("carol")] }),
    siteHost: "h",
    avatarDataUris: new Map(),
    logoDataUri: "data:image/png;base64,AAA",
    animate: true,
  });
  assert.match(svg, />—</);
  assert.doesNotMatch(svg, />€0</);
});

test("error card is a valid SVG with the message escaped", () => {
  const svg = renderSquadErrorCardSvg("Repository <b>not</b> found");
  assert.match(svg, /^<\?xml/);
  assert.doesNotMatch(svg, /<b>/);
});
