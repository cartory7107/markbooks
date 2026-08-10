import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { SITE_URL } from "@/lib/site";
import {
  getIndexableToolSlugs,
  URLS_PER_SITEMAP,
  XML_HEADERS,
} from "@/lib/sitemap.server";

/**
 * Sitemap index — lists the static/blog/category sitemap plus one paginated
 * tool sitemap per {URLS_PER_SITEMAP} canonical tool pages.
 *
 * Only legitimate public canonical pages are referenced. Admin, auth, profile,
 * JSON endpoints, filter/query URLs and non-indexable tools are excluded.
 */
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const now = new Date().toISOString().split("T")[0];
          const toolCount = getIndexableToolSlugs().length;
          const chunks = Math.max(1, Math.ceil(toolCount / URLS_PER_SITEMAP));

          const sitemaps = [`${SITE_URL}/sitemap-static.xml`];
          for (let i = 0; i < chunks; i++) {
            sitemaps.push(`${SITE_URL}/sitemap-tools/${i}.xml`);
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

          return new Response(xml, { status: 200, headers: XML_HEADERS });
        } catch (err) {
          console.error("[sitemap.xml] failed:", err);
          return new Response(
            `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${SITE_URL}/sitemap-static.xml</loc></sitemap></sitemapindex>`,
            { status: 200, headers: XML_HEADERS },
          );
        }
      },
    },
  },
});
