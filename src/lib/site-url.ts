/**
 * Public origin of the site. Set NEXT_PUBLIC_SITE_URL once a custom domain exists;
 * otherwise the Vercel production domain is used, and localhost in development.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
