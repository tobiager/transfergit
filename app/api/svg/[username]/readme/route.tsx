import { loadOgPlayer } from "@/app/api/og/_shared/data";
import { getSiteHost } from "@/lib/site-url";
import { fetchAvatarDataUri } from "@/lib/svg-card/avatar";
import { getFlagDataUri } from "@/lib/svg-card/flag";
import { renderErrorCardSvg, renderReadmeCardSvg } from "@/lib/svg-card/render";

// GitHub's camo proxy (which re-serves this SVG when embedded in a README)
// honors these headers, so the card re-generates itself on every request an
// hour or more stale — no GitHub Actions/cron needed to keep it fresh.
// s-maxage=3600: shared caches (camo, CDN) may serve a cached copy for 1h.
// stale-while-revalidate=86400: for up to 24h after that, stale copies keep
// serving instantly while a fresh render happens in the background.
const CACHE_CONTROL = "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400";
const NOT_FOUND_CACHE_CONTROL = "public, max-age=0, s-maxage=60";
// Never let a "busy" render stick around as long as a genuine card cache —
// short s-maxage means the next camo refresh (README embeds) tries again soon.
const RATE_LIMITED_CACHE_CONTROL = "public, max-age=0, s-maxage=30";

export async function GET(request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const animate = new URL(request.url).searchParams.get("animate") !== "false";
  const result = await loadOgPlayer(username);

  if (result.status === "rate_limited") {
    // Status 200 (not 5xx): a README <img> shows a broken-image icon on a
    // non-200 response — this is a real, branded SVG, just a "busy" one.
    return new Response(renderErrorCardSvg("Transfer market busy — try again shortly"), {
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": RATE_LIMITED_CACHE_CONTROL },
    });
  }
  if (result.status === "not_found") {
    // Status 200 (not 404): a README <img> shows a broken-image icon on a
    // non-200 response, so the "not found" card renders as a real image.
    return new Response(renderErrorCardSvg("Player not found"), {
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": NOT_FOUND_CACHE_CONTROL },
    });
  }
  const player = result.player;

  const [avatarDataUri, flagDataUri] = await Promise.all([
    fetchAvatarDataUri(player.avatarUrl),
    getFlagDataUri(player.nationalityIso2),
  ]);
  const svg = renderReadmeCardSvg({ player, siteHost: getSiteHost(), avatarDataUri, flagDataUri, animate });

  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": CACHE_CONTROL },
  });
}
