import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getCatalog, slugify } from "@/lib/catalog-server";
import { getPublishedSitemapEntries } from "@/lib/blog.server";
import { SITE_URL } from "@/lib/site";
import { XML_HEADERS, renderUrlset, type SitemapEntry } from "@/lib/sitemap.server";

/**
 * Public pages + category pages + ranking pages + published blog posts.
 * Admin, auth, profile, JSON endpoints and filter URLs are intentionally absent.
 */
export const Route = createFileRoute("/sitemap-static.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const catalog = getCatalog();
          const entries: SitemapEntry[] = [
            { path: "/", changefreq: "daily", priority: "1.0" },
            { path: "/verified", changefreq: "weekly", priority: "0.9" },
            { path: "/categories", changefreq: "weekly", priority: "0.9" },
            { path: "/rankings", changefreq: "weekly", priority: "0.9" },
            { path: "/ranking", changefreq: "weekly", priority: "0.8" },
            { path: "/compare", changefreq: "weekly", priority: "0.8" },
            { path: "/blog", changefreq: "daily", priority: "0.9" },
            { path: "/pricing", changefreq: "monthly", priority: "0.6" },
            { path: "/about", changefreq: "monthly", priority: "0.6" },
            { path: "/contact", changefreq: "monthly", priority: "0.5" },
            { path: "/submit", changefreq: "monthly", priority: "0.6" },
            { path: "/advertise", changefreq: "monthly", priority: "0.5" },
            { path: "/privacy", changefreq: "yearly", priority: "0.3" },
            { path: "/terms", changefreq: "yearly", priority: "0.3" },
          ];

          const topCategories = Object.entries(catalog.categories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 300);

          for (const [name] of topCategories) {
            const slug = slugify(name);
            if (!slug) continue;
            entries.push({
              path: `/category/${slug}`,
              changefreq: "weekly",
              priority: "0.7",
            });
            entries.push({
              path: `/rankings/best-${slug}`,
              changefreq: "weekly",
              priority: "0.7",
            });
          }

          try {
            for (const post of await getPublishedSitemapEntries()) {
              entries.push({
                path: `/blog/${post.slug}`,
                // Real per-article timestamp — never build/generation time.
                ...(post.lastmod ? { lastmod: post.lastmod } : {}),
                changefreq: "monthly",
                priority: "0.8",
              });
            }
          } catch (err) {
            console.error("[sitemap-static] blog slugs unavailable:", err);
          }

          return new Response(renderUrlset(SITE_URL, entries), {
            status: 200,
            headers: XML_HEADERS,
          });
        } catch (err) {
          console.error("[sitemap-static.xml] failed:", err);
          return new Response(
            renderUrlset(SITE_URL, [{ path: "/", priority: "1.0" }]),
            { status: 200, headers: XML_HEADERS },
          );
        }
      },
    },
  },
});
