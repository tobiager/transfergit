// URL pública del sitio, usada para OG tags y para armar los links absolutos
// del panel de export (markdown, share). En Vercel cae a VERCEL_URL si no se
// seteó NEXT_PUBLIC_SITE_URL a mano.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
