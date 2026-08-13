/** Netlify sets URL at build time; browser uses window.location on client. */
export function getSiteUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL || "";
}
