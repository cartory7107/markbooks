import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getCatalog, getCategoryEmojis, slugify } from "@/lib/catalog-server";

/**
 * Rankings index — SEO landing page listing every category-based ranking.
 * URL: /rankings
 */

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export const Route = createFileRoute("/rankings/")({
  server: {
    handlers: {
      GET: async () => {
        const catalog = getCatalog();
        const emojis = getCategoryEmojis();
        const cats = Object.entries(catalog.categories).sort((a, b) => b[1] - a[1]);

        const canonical = "https://markbook.top/rankings";
        const title = "AI Tool Rankings — Best & Top AI Tools of 2026 | MarkBook";
        const desc = `Ranked leaderboards of the best AI tools across ${cats.length} categories. Compare and pick the top AI tool for writing, image generation, coding, video, and more.`;

        const itemListLd = {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "AI Tool Rankings",
          itemListElement: cats.slice(0, 50).map(([cat], i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `https://markbook.top/rankings/best-${slugify(cat)}`,
            name: `Best ${cat}`,
          })),
        };
        const breadcrumbLd = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://markbook.top/" },
            { "@type": "ListItem", position: 2, name: "Rankings", item: canonical },
          ],
        };

        const cardsHtml = cats.map(([cat, count]) => {
          const emoji = emojis[cat] || "🤖";
          const s = slugify(cat);
          return `<a class="card" href="/rankings/best-${s}">
            <div class="emoji">${emoji}</div>
            <div><b>Best ${esc(cat)}</b><span>${count.toLocaleString()} tools</span></div>
          </a>`;
        }).join("\n");

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index,follow">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="MarkBook">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="${canonical}">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<script type="application/ld+json">${JSON.stringify(itemListLd)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Inter,system-ui,sans-serif;background:#fafafa;color:#111827;min-height:100vh;position:relative;overflow-x:hidden;line-height:1.6}
body::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:0;background-image:linear-gradient(to right,rgba(0,0,0,.05) 1px,transparent 1px),linear-gradient(to bottom,rgba(0,0,0,.05) 1px,transparent 1px);background-size:44px 44px;mask-image:radial-gradient(ellipse at top,#000 25%,transparent 75%);-webkit-mask-image:radial-gradient(ellipse at top,#000 25%,transparent 75%)}
a{color:#4f46e5;text-decoration:none}
.nav{position:sticky;top:0;z-index:50;border-bottom:1px solid #e5e7eb;background:rgba(255,255,255,.85);backdrop-filter:blur(12px)}
.nav-inner{max-width:1080px;margin:0 auto;padding:0 20px;display:flex;align-items:center;height:56px;gap:16px}
.nav-logo{font-size:18px;font-weight:900;background:linear-gradient(135deg,#6366f1,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.c{position:relative;z-index:1;max-width:1080px;margin:0 auto;padding:0 20px}
.hero{padding:32px 0 20px}
.hero h1{font-size:clamp(28px,4vw,44px);font-weight:900;letter-spacing:-.02em;line-height:1.1}
.hero p{color:#6b7280;font-size:16px;margin-top:10px;max-width:680px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;margin-top:24px}
.card{display:flex;align-items:center;gap:12px;padding:16px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;color:#111827;transition:all .15s}
.card:hover{border-color:#6366f1;box-shadow:0 6px 20px -8px rgba(99,102,241,.2);transform:translateY(-1px)}
.emoji{font-size:26px;width:44px;height:44px;display:grid;place-items:center;background:rgba(99,102,241,.08);border-radius:11px}
.card b{display:block;font-size:14px;font-weight:700}
.card span{display:block;font-size:11px;color:#6b7280;margin-top:1px}
.footer{border-top:1px solid #e5e7eb;padding:20px 0;text-align:center;font-size:12px;color:#9ca3af;margin-top:40px}
</style>
</head>
<body>
<nav class="nav"><div class="nav-inner"><a href="/" class="nav-logo">MarkBook</a></div></nav>
<div class="c">
  <div class="hero">
    <h1>AI Tool Rankings</h1>
    <p>Curated leaderboards across ${cats.length} AI categories. Each ranking is refreshed with the catalog and ordered by verified quality, feature depth, and pricing accessibility.</p>
  </div>
  <div class="grid">${cardsHtml}</div>
  <div class="footer">&copy; 2026 MarkBook — AI Tools Directory.</div>
</div>
</body></html>`;

        return new Response(html, {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=86400, s-maxage=3600" },
        });
      },
    },
  },
});
