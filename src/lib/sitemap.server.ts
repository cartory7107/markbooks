import { getCatalog, slugify, type Tool } from "@/lib/catalog-server";
import { scoreTool } from "@/lib/quality.server";

/** Max URLs per sitemap file (search-engine limit is 50,000). */
export const URLS_PER_SITEMAP = 45000;

/**
 * A tool qualifies for the sitemap only when the data-quality engine rates it
 * "index": a real product domain, a usable name, a description with substance
 * and a meaningful category. Thin and excluded listings stay crawlable for
 * visitors but never enter a sitemap (see quality.server.ts).
 */
function isIndexable(t: Tool): boolean {
  if (!t.n || !slugify(t.n)) return false;
  return scoreTool(t).tier === "index";
}

let _cache: string[] | null = null;

/**
 * Canonical, deduplicated, indexable tool slugs — the single source of truth
 * for /sitemap.xml and /sitemap-tools/N.xml.
 */
export function getIndexableToolSlugs(): string[] {
  if (_cache) return _cache;
  const seen = new Set<string>();
  const slugs: string[] = [];
  for (const t of getCatalog().tools) {
    if (!isIndexable(t)) continue;
    const slug = slugify(t.n);
    if (seen.has(slug)) continue;
    seen.add(slug);
    slugs.push(slug);
  }
  _cache = slugs;
  return slugs;
}

export type SitemapEntry = {
  path: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
};

export function renderUrlset(baseUrl: string, entries: SitemapEntry[]): string {
  const urls = entries.map((e) =>
    [
      "  <url>",
      `    <loc>${baseUrl}${e.path === "/" ? "" : e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      "  </url>",
    ]
      .filter(Boolean)
      .join("\n"),
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

export const XML_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600",
  "X-Robots-Tag": "noindex",
};
