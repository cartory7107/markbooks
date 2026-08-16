import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { SITE_URL } from "@/lib/site";
import {
  getIndexableToolSlugs,
  URLS_PER_SITEMAP,
  XML_HEADERS,
  renderUrlset,
} from "@/lib/sitemap.server";

/**
 * Paginated tool sitemap: /sitemap-tools/N.xml
 * Contains only canonical, deduplicated, live tool pages.
 */
export const Route = createFileRoute("/sitemap-tools/$index")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const index = parseInt(String(params.index).replace(/\.xml$/, ""), 10);
          if (Number.isNaN(index) || index < 0) {
            return new Response("Invalid sitemap index", { status: 400 });
          }

          const { getQuarantinedSlugs } = await import("@/lib/verification.server");
          const quarantined = await getQuarantinedSlugs();
          const slugs = getIndexableToolSlugs().filter((s) => !quarantined.has(s));
          const start = index * URLS_PER_SITEMAP;
          if (start >= slugs.length) {
            return new Response("Sitemap not found", { status: 404 });
          }

          const xml = renderUrlset(
            SITE_URL,
            slugs.slice(start, start + URLS_PER_SITEMAP).map((slug) => ({
              path: `/tool/${slug}`,
              changefreq: "monthly",
              priority: "0.6",
            })),
          );

          return new Response(xml, { status: 200, headers: XML_HEADERS });
        } catch (err) {
          console.error("[sitemap-tools] failed:", err);
          return new Response("Sitemap error", { status: 500 });
        }
      },
    },
  },
});
