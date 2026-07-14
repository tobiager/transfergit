// Single source of truth for the site's public URL. Exports and shares
// must always point at the real domain — even from a Vercel preview
// deploy — so production always resolves to transfergit.com regardless
// of env vars. Only local dev falls back to localhost.
export function getSiteUrl(): string {
  if (process.env.NODE_ENV !== "production") {
    const port = process.env.PORT ?? "3000";
    return `http://localhost:${port}`;
  }
  return "https://transfergit.com";
}

// Same, without the protocol — for the "{host}/{username}" label shown
// under the export buttons and baked into the exported card images.
export function getSiteHost(): string {
  return getSiteUrl().replace(/^https?:\/\//, "");
}
