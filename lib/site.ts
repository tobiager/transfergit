// Public site URL, used for OG tags and to build the absolute links in the
// export panel (markdown, share). Falls back to VERCEL_URL on Vercel if
// NEXT_PUBLIC_SITE_URL wasn't set manually.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
