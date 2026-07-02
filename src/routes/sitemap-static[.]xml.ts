import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getCatalog, slugify } from "@/lib/catalog-server";

const BASE_URL = "https://markbook.top";

/**
 * Static pages + category landing pages sitemap.
 *
 * Includes every public route and JSON endpoint so search-engine auditors
 * see the sitemap in sync with the actual route tree. Private/disallowed
 * routes are still listed with low priority so crawlers can detect them, but
 * robots.txt controls whether they are actually crawled.
 */
export const Route = createFileRoute("/sitemap-static.xml")({
  server: {
    handlers: {
      GET: async () => {
        const catalog = getCatalog();
        const now = new Date().toISOString().split("T")[0];

        const urls: string[] = [];

        const staticPages = [
          { path: "/", priority: "1.0", freq: "daily" },
          { path: "/ranking", priority: "0.9", freq: "weekly" },
          { path: "/rankings", priority: "0.9", freq: "weekly" },
          { path: "/compare", priority: "0.8", freq: "weekly" },
          { path: "/university", priority: "0.8", freq: "weekly" },
          { path: "/submit", priority: "0.7", freq: "monthly" },
          { path: "/advertise", priority: "0.5", freq: "monthly" },
          { path: "/tools-dictionary.json", priority: "0.8", freq: "weekly" },
          { path: "/tools-api.json", priority: "0.3", freq: "weekly" },
          { path: "/search-api.json", priority: "0.3", freq: "weekly" },
          { path: "/exclusive-api.json", priority: "0.3", freq: "weekly" },
        ];

        for (const [cat] of Object.entries(catalog.categories).sort((a, b) => b[1] - a[1])) {
          const s = slugify(cat);
          if (!s) continue;
          urls.push(
            `  <url>\n    <loc>${BASE_URL}/rankings/best-${s}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.75</priority>\n  </url>`,
          );
        }

        for (const p of staticPages) {
          urls.push(
            `  <url>\n    <loc>${BASE_URL}${p.path}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${p.freq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`,
          );
        }

        const categories = Object.entries(catalog.categories).sort((a, b) => b[1] - a[1]);
        for (const [name] of categories) {
          const slug = slugify(name);
          if (!slug) continue;
          urls.push(
            `  <url>\n    <loc>${BASE_URL}/category/${slug}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`,
          );
        }

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
