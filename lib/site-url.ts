// Single source of truth for the site's public URL. No domain is
// hardcoded anywhere else in the app — the production domain doesn't
// exist yet, so everything resolves through this helper instead:
//   1. NEXT_PUBLIC_SITE_URL (set manually once a domain is bought)
//   2. VERCEL_PROJECT_PRODUCTION_URL (Vercel sets this automatically)
//   3. http://localhost:{PORT} in dev
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  const port = process.env.PORT ?? "3000";
  return `http://localhost:${port}`;
}

// Same, without the protocol — for the "{host}/{username}" label shown
// under the export buttons and baked into the exported card images.
export function getSiteHost(): string {
  return getSiteUrl().replace(/^https?:\/\//, "");
}
