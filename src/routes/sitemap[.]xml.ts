import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getCatalog, slugify } from "@/lib/catalog-server";

const BASE_URL = "https://tavbook.top";
const TOOLS_PER_SITEMAP = 50000;

/**
 * Sitemap index — splits the full catalog into smaller sitemaps so each file
 * stays within search-engine limits (max 50,000 URLs / ~50 MB per file).
 *
 * References:
 *   - /sitemap-static.xml  : public pages + category landing pages + blog posts
 *   - /sitemap-tools/N     : individual tool pages (up to 50k per file)
 */
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const catalog = getCatalog();
          const now = new Date().toISOString().split("T")[0];

          // Build the full deduplicated slug list once (count only) so we can
          // emit the correct number of child sitemaps.
          const seenSlugs = new Set<string>();
          let toolCount = 0;
          for (const tool of catalog.tools) {
            const slug = slugify(tool.n);
            if (!slug) continue;
            if (seenSlugs.has(slug)) continue;
            seenSlugs.add(slug);
            toolCount++;
          }

          const sitemapCount = Math.ceil(toolCount / TOOLS_PER_SITEMAP) || 1;

          const sitemaps: string[] = [`${BASE_URL}/sitemap-static.xml`];
          for (let i = 0; i < sitemapCount; i++) {
            sitemaps.push(`${BASE_URL}/sitemap-tools/${i}.xml`);
          }

          const xml = [
            `<?xml version="1.0" encoding="UTF-8"?>`,
            `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
            ...sitemaps.map(
              (loc) =>
                `  <sitemap>\n    <loc>${loc}</loc>\n    <lastmod>${now}</lastmod>\n  </sitemap>`,
            ),
            `</sitemapindex>`,
          ].join("\n");

          return new Response(xml, {
            status: 200,
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              "Cache-Control": "public, max-age=3600",
            },
          });
        } catch (err) {
          console.error("[sitemap.xml] Error generating sitemap index:", err);
          return new Response(
            `<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate sitemap index</error>`,
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