import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getPublishedPosts } from "@/lib/blog.server";

const BASE_URL = "https://markbook.top";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const Route = createFileRoute("/rss.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { posts } = await getPublishedPosts({ limit: 50 });
          const now = new Date().toUTCString();

          const items = posts
            .map((p) => {
              const url = `${BASE_URL}/blog/${p.slug}`;
              const pub = (p as { published_at?: string | null }).published_at
                ? new Date((p as { published_at: string }).published_at).toUTCString()
                : now;
              const desc = p.excerpt ?? "";
              return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pub}</pubDate>
      <description>${escapeXml(desc)}</description>
    </item>`;
            })
            .join("\n");

          const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>MarkBook Blog</title>
    <link>${BASE_URL}/blog</link>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Latest AI tools, guides, comparisons, and news from MarkBook.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
${items}
  </channel>
</rss>`;

          return new Response(xml, {
            status: 200,
            headers: {
              "Content-Type": "application/rss+xml; charset=utf-8",
              "Cache-Control": "public, max-age=3600",
            },
          });
        } catch (err) {
          console.error("[rss.xml] error:", err);
          return new Response(
            `<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate RSS</error>`,
            { status: 500, headers: { "Content-Type": "application/xml; charset=utf-8" } },
          );
        }
      },
    },
  },
});
