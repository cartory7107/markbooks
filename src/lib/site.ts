/**
 * Single source of truth for TavBook's canonical domain and brand identity.
 * Every canonical URL, Open Graph URL, structured-data URL and sitemap entry
 * must be built from these values.
 */
export const SITE_URL = "https://tavbook.top";
export const SITE_NAME = "TavBook";
export const SITE_TAGLINE = "AI Tools Directory & AI Discovery Platform";
export const SITE_TWITTER = "@tavbook";
export const OG_IMAGE = `${SITE_URL}/og-image.png`;
export const LOGO_URL = `${SITE_URL}/favicon.png`;

/** Build an absolute, canonical URL for a site path (no query strings). */
export function absUrl(path = "/"): string {
  const clean = path.split("?")[0]!.split("#")[0]!;
  if (!clean || clean === "/") return SITE_URL;
  return `${SITE_URL}${clean.startsWith("/") ? clean : `/${clean}`}`;
}
