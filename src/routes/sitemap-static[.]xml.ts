import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getCatalog, slugify } from "@/lib/catalog-server";
import { getAllPublishedSlugs } from "@/lib/blog.server";

const BASE_URL = "https://markbook.top";

/**
 * Static pages + category landing pages + blog posts sitemap.
 *
 * Only includes real, crawlable HTML pages.
 * JSON API endpoints and non-existent routes are excluded.
 */
export const Route = createFileRoute("/sitemap-static.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const catalog = getCatalog();
          const now = new Date().toISOString().split("T")[0];

          const urls: string[] = [];

          // ── Core pages ──
          const staticPages: Array<{
            path: string;
            priority: string;
            freq: string;
          }> = [
            { path: "/", priority: "1.0", freq: "daily" },
            { path: "/ranking", priority: "0.9", freq: "weekly" },
            { path: "/rankings", priority: "0.9", freq: "weekly" },
            { path: "/compare", priority: "0.8", freq: "weekly" },
            { path: "/blog", priority: "0.9", freq: "weekly" },
            { path: "/pricing", priority: "0.7", freq: "monthly" },
            { path: "/contact", priority: "0.6", freq: "monthly" },
            { path: "/about", priority: "0.6", freq: "monthly" },
            { path: "/submit", priority: "0.7", freq: "monthly" },
            { path: "/advertise", priority: "0.5", freq: "monthly" },
            { path: "/privacy", priority: "0.3", freq: "yearly" },
            { path: "/terms", priority: "0.3", freq: "yearly" },
          ];

          // ── Ranking pages per category ──
          const rankingCategories = Object.entries(catalog.categories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 200); // cap to avoid oversized sitemap

          for (const [cat] of rankingCategories) {
            const s = slugify(cat);
            if (!s) continue;
            urls.push(
              `  <url>\n    <loc>${BASE_URL}/rankings/best-${s}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`,
            );
          }

          // ── Static pages ──
          for (const p of staticPages) {
            urls.push(
              `  <url>\n    <loc>${BASE_URL}${p.path}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${p.freq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`,
            );
          }

          // ── Blog posts from DB (published only) ──
          try {
            const blogSlugs = await getAllPublishedSlugs();
            for (const slug of blogSlugs) {
              urls.push(
                `  <url>\n    <loc>${BASE_URL}/blog/${slug}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`,
              );
            }
          } catch (err) {
            console.error("[sitemap-static] Warning: could not fetch blog slugs:", err);
          }

          // ── Tool category pages ──
          const toolCategories = Object.entries(catalog.categories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 200);

          for (const [name] of toolCategories) {
            const slug = slugify(name);
            if (!slug) continue;
            urls.push(
              `  <url>\n    <loc>${BASE_URL}/category/${slug}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`,
            );
          }

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
              "Cache-Control": "public, max-age=3600",
            },
          });
        } catch (err) {
          console.error("[sitemap-static.xml] Error generating sitemap:", err);
          return new Response(
            `<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate static sitemap</error>`,
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