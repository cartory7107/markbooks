import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getCatalog, slugify } from "@/lib/catalog-server";

const BASE_URL = "https://markbook.top";
const TOOLS_PER_SITEMAP = 50000;

/**
 * Paginated tool sitemap. Handles one chunk of individual tool pages so each
 * file stays under search-engine limits (max 50,000 URLs per sitemap).
 *
 * Route: /sitemap-tools/:index
 *
 * Note: Child sitemaps don't require .xml extension per Google's protocol.
 * The Content-Type header is what matters.
 */
export const Route = createFileRoute("/sitemap-tools/$index")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const index = parseInt(params.index, 10);
          if (Number.isNaN(index) || index < 0) {
            return new Response("Invalid sitemap index", {
              status: 400,
              headers: { "Content-Type": "application/xml; charset=utf-8" },
            });
          }

          const catalog = getCatalog();
          const now = new Date().toISOString().split("T")[0];

          // Build the full deduplicated slug list once.
          const seenSlugs = new Set<string>();
          const slugs: string[] = [];
          for (const tool of catalog.tools) {
            const slug = slugify(tool.n);
            if (!slug) continue; // skip names that produce empty slugs
            if (seenSlugs.has(slug)) continue; // skip duplicate URLs
            seenSlugs.add(slug);
            slugs.push(slug);
          }

          const start = index * TOOLS_PER_SITEMAP;
          if (start >= slugs.length) {
            return new Response("Sitemap not found", {
              status: 404,
              headers: { "Content-Type": "application/xml; charset=utf-8" },
            });
          }

          const pageSlugs = slugs.slice(start, start + TOOLS_PER_SITEMAP);

          const urls = pageSlugs.map(
            (slug) =>
              `  <url>\n    <loc>${BASE_URL}/tool/${slug}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`,
          );

          const xml = [
            `<?xml version="1.0" encoding="UTF-8"?>`,
            `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
            ...urls,
            `</urlset>`,
          ].join("\n");

          return new Response(xml, {
            status: 200,
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              "Cache-Control": "public, max-age=86400",
            },
          });
        } catch (err) {
          console.error("[sitemap-tools] Error generating sitemap:", err);
          return new Response(
            `<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate tools sitemap</error>`,
            {
              status: 500,
              headers: { "Content-Type": "application/xml; charset=utf-8" },
            },
          );
        }
      },
    },
  },
});