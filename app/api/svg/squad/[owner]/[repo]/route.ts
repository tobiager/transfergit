import { getSquadFromParams, RepoNotFoundError, NotEnoughPlayersError } from "@/lib/squad";
import { fetchAvatarsBatch } from "@/app/api/og/_shared/avatarBatch";
import { loadOgLogoDataUri } from "@/app/api/og/_shared/logo";
import { renderSquadCardSvg, renderSquadErrorCardSvg } from "@/lib/svg-squad/render";
import { getSiteHost } from "@/lib/site-url";

const AVATAR_SIZE = 64;

// The squad card only needs to notice a new contributor or a market-value
// swing roughly as often as the rest of the squad page re-renders (its
// revalidate is 86400s) — a 12h shared-cache window keeps a README embed
// fresh without re-fetching all 11 GitHub profiles on every camo hit.
// s-maxage=43200: shared caches (camo, CDN) may serve a cached copy for 12h.
// stale-while-revalidate=86400: for up to 24h after that, stale copies keep
// serving instantly while a fresh render happens in the background.
const CACHE_CONTROL = "public, max-age=0, s-maxage=43200, stale-while-revalidate=86400";
const NOT_FOUND_CACHE_CONTROL = "public, max-age=0, s-maxage=60";

export async function GET(request: Request, { params }: { params: Promise<{ owner: string; repo: string }> }) {
  const { owner, repo } = await params;
  const { searchParams } = new URL(request.url);
  const animate = searchParams.get("animate") !== "false";
  // WYSIWYG: same ?formation=&base=&layout= the live page and the PNG
  // exports read — no params falls back to the default formation.
  const formationParams = {
    formation: searchParams.get("formation"),
    base: searchParams.get("base"),
    layout: searchParams.get("layout"),
  };

  try {
    const [{ squad }, logoDataUri] = await Promise.all([
      getSquadFromParams(owner, repo, formationParams),
      loadOgLogoDataUri(),
    ]);
    const avatarDataUris = await fetchAvatarsBatch(
      squad.starters.map((p) => p.avatarUrl),
      AVATAR_SIZE
    );
    const svg = renderSquadCardSvg({ squad, siteHost: getSiteHost(), avatarDataUris, animate, logoDataUri });

    return new Response(svg, {
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": CACHE_CONTROL },
    });
  } catch (err) {
    // Status 200 (not 404/500): a README <img> shows a broken-image icon on
    // a non-200 response, so the "not found" card renders as a real image.
    const message =
      err instanceof RepoNotFoundError
        ? "Repository not found"
        : err instanceof NotEnoughPlayersError
          ? "Not enough contributors to field a squad"
          : "Couldn't build this squad right now";

    return new Response(renderSquadErrorCardSvg(message), {
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": NOT_FOUND_CACHE_CONTROL },
    });
  }
}
