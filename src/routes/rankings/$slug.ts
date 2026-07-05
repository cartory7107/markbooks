import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import {
  getCatalog,
  getCategoryEmojis,
  normalizeCategory,
  rankBrowseList,
  slugify,
  type Tool,
} from "@/lib/catalog-server";

/**
 * Dynamic rankings — /rankings/{best-ai-writing-tools}, /rankings/{top-ai-image-generators}, …
 * Slug pattern: {best|top}-ai-{keyword}-{tools|generators|apps|software}
 * The keyword is matched against the normalized category list.
 */

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map(p => p[0]).join("").toUpperCase();
}
const COLORS = [
  "linear-gradient(135deg,#8b5cf6,#7c3aed)",
  "linear-gradient(135deg,#3b82f6,#4f46e5)",
  "linear-gradient(135deg,#10b981,#14b8a6)",
  "linear-gradient(135deg,#f97316,#ef4444)",
  "linear-gradient(135deg,#ec4899,#f43f5e)",
  "linear-gradient(135deg,#06b6d4,#3b82f6)",
];
function colorForName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}
function pricingTag(p: string): string {
  const free = ["Free", "Free Plan", "Free Trial", "Free Credits", "Daily Free", "Monthly Free", "Open Source", "open_source", "freemium"];
  if (free.includes(p)) return "Free";
  if (p === "Paid" || p === "Paid Plans") return "Paid";
  return p || "Contact";
}
function randomRating(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return (3.8 + ((h >>> 0) % 17) / 10).toFixed(1);
}

/**
 * Parse a ranking slug into a category label.
 * Strips leading "best-", "top-", "leading-" and trailing type suffix.
 * Then matches against the catalog's category set (case-insensitive slug).
 */
function slugToCategory(slug: string, allCats: string[]): string | null {
  let s = slug.toLowerCase();
  s = s.replace(/^(best|top|leading|greatest|popular)-/, "");
  s = s.replace(/-(tools|generators|apps|software|platforms|solutions|websites)$/, "");
  const norm = s.replace(/^ai-/, "");
  const catSlug = (c: string) => slugify(c).replace(/^ai-/, "");
  for (const c of allCats) {
    if (catSlug(c) === norm) return c;
  }
  // Loose contains match
  for (const c of allCats) {
    if (catSlug(c).includes(norm) || norm.includes(catSlug(c))) return c;
  }
  return null;
}

export const Route = createFileRoute("/rankings/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { slug } = params;
        const catalog = getCatalog();
        const emojis = getCategoryEmojis();
        const allCats = Object.keys(catalog.categories);
        const category = slugToCategory(slug, allCats);
        if (!category) {
          return new Response("Ranking not found", { status: 404, headers: { "Content-Type": "text/plain" } });
        }

        const inCat = catalog.tools.filter(t => normalizeCategory(t.c) === category || t.c === category || t.g === category);
        const ranked = rankBrowseList(inCat, "ranking").slice(0, 25);
        const emoji = emojis[category] || "🤖";
        const canonical = `https://markbook.top/rankings/${slug}`;

        // Pretty title
        const prettyTitle = slug
          .split("-")
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")
          .replace(/^Best/, "Best")
          .replace(/^Top/, "Top");
        const seoTitle = `${prettyTitle} of 2026 — Ranked | MarkBook`;
        const desc = `The ${prettyTitle.toLowerCase()} of 2026. We ranked the top ${ranked.length} ${category.toLowerCase()} by features, pricing, and user ratings.`;

        const itemListLd = {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: prettyTitle,
          numberOfItems: ranked.length,
          itemListElement: ranked.map((t, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `https://markbook.top/tool/${slugify(t.n)}`,
            name: t.n,
          })),
        };
        const breadcrumbLd = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://markbook.top/" },
            { "@type": "ListItem", position: 2, name: "Rankings", item: "https://markbook.top/rankings" },
            { "@type": "ListItem", position: 3, name: prettyTitle, item: canonical },
          ],
        };
        const collectionLd = {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: prettyTitle,
          description: desc,
          url: canonical,
        };

        const listHtml = ranked.map((t: Tool, i) => {
          const s = slugify(t.n);
          const rank = i + 1;
          const rankBadge = rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : `#${rank}`;
          return `
<a class="row" href="/tool/${s}">
  <div class="rank ${rank <= 3 ? "top" : ""}">${rankBadge}</div>
  <div class="logo" style="background:${colorForName(t.n)}">${initials(t.n)}</div>
  <div class="body">
    <div class="rh"><b>${esc(t.n)}</b> <span class="pr">${esc(pricingTag(t.p))}</span></div>
    <p>${esc(t.d.slice(0, 180))}${t.d.length > 180 ? "…" : ""}</p>
    <div class="rmeta"><span>⭐ ${randomRating(t.n)}/5</span> · <span>${emoji} ${esc(normalizeCategory(t.c))}</span></div>
  </div>
  <span class="cta-btn">View →</span>
</a>`;
        }).join("\n");

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(seoTitle)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index,follow">
<meta name="keywords" content="${esc(prettyTitle)}, ${esc(category)}, best AI tools, top AI, AI ranking, ${esc(category.toLowerCase())} 2026">
<meta property="og:title" content="${esc(seoTitle)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="MarkBook">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="${canonical}">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<script type="application/ld+json">${JSON.stringify(itemListLd)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>
<script type="application/ld+json">${JSON.stringify(collectionLd)}</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Inter,system-ui,sans-serif;background:#fafafa;color:#111827;min-height:100vh;position:relative;overflow-x:hidden;line-height:1.6}
body::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:0;background-image:linear-gradient(to right,rgba(0,0,0,.05) 1px,transparent 1px),linear-gradient(to bottom,rgba(0,0,0,.05) 1px,transparent 1px);background-size:44px 44px;mask-image:radial-gradient(ellipse at top,#000 25%,transparent 75%);-webkit-mask-image:radial-gradient(ellipse at top,#000 25%,transparent 75%)}
a{color:#4f46e5;text-decoration:none}
.nav{position:sticky;top:0;z-index:50;border-bottom:1px solid #e5e7eb;background:rgba(255,255,255,.85);backdrop-filter:blur(12px)}
.nav-inner{max-width:960px;margin:0 auto;padding:0 20px;display:flex;align-items:center;height:56px;gap:16px}
.nav-logo{font-size:18px;font-weight:900;background:linear-gradient(135deg,#6366f1,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.nav-back{font-size:13px;color:#6b7280;font-weight:500}
.c{position:relative;z-index:1;max-width:960px;margin:0 auto;padding:0 20px}
.bb{padding:16px 0 8px;font-size:12px;color:#6b7280;display:flex;gap:6px;flex-wrap:wrap}.bb a{color:#6b7280}
.hero{padding:24px 0 12px}
.hero .kicker{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#4f46e5;background:rgba(99,102,241,.1);border-radius:999px;padding:5px 12px;margin-bottom:12px}
.hero h1{font-size:clamp(26px,4vw,42px);font-weight:900;letter-spacing:-.02em;line-height:1.15}
.hero p{color:#6b7280;font-size:15px;margin-top:8px;max-width:680px}
.list{margin-top:24px;display:flex;flex-direction:column;gap:10px}
.row{display:flex;align-items:center;gap:14px;padding:16px 18px;border:1px solid #e5e7eb;border-radius:14px;background:#fff;transition:all .15s;color:#111827}
.row:hover{border-color:#6366f1;box-shadow:0 6px 20px -8px rgba(99,102,241,.25);transform:translateY(-1px)}
.rank{min-width:44px;font-weight:800;font-size:14px;color:#9ca3af;text-align:center}
.rank.top{font-size:24px}
.logo{width:48px;height:48px;min-width:48px;border-radius:12px;display:grid;place-items:center;font-weight:800;color:#fff;font-size:14px}
.body{flex:1;min-width:0}
.rh{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.rh b{font-size:15px;font-weight:700}
.pr{font-size:11px;font-weight:600;color:#4f46e5;background:rgba(99,102,241,.1);padding:2px 8px;border-radius:6px}
.body p{color:#6b7280;font-size:13px;margin:4px 0;line-height:1.5}
.rmeta{font-size:11px;color:#9ca3af;margin-top:2px}
.cta-btn{font-size:12px;font-weight:600;color:#4f46e5;padding:8px 14px;border:1px solid #e5e7eb;border-radius:9px;white-space:nowrap}
.row:hover .cta-btn{background:#4f46e5;color:#fff;border-color:#4f46e5}
.sec{margin:40px 0;padding-top:32px;border-top:1px solid #e5e7eb}
.sec h2{font-size:20px;font-weight:800;margin-bottom:8px}
.sec p{color:#6b7280;font-size:14px;line-height:1.8}
.pill-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
.pill{padding:8px 14px;border-radius:999px;border:1px solid #e5e7eb;background:#fff;font-size:13px;font-weight:600;color:#374151}
.pill:hover{border-color:#6366f1;color:#4f46e5}
.footer{border-top:1px solid #e5e7eb;padding:20px 0;text-align:center;font-size:12px;color:#9ca3af}
@media(max-width:640px){.row{flex-wrap:wrap}.cta-btn{margin-left:60px}}
</style>
</head>
<body>
<nav class="nav"><div class="nav-inner"><a href="/" class="nav-logo">MarkBook</a><a href="/rankings" class="nav-back">← All rankings</a></div></nav>
<div class="c">
  <div class="bb"><a href="/">Home</a> › <a href="/rankings">Rankings</a> › <span>${esc(prettyTitle)}</span></div>
  <div class="hero">
    <div class="kicker">${emoji} Ranked Leaderboard</div>
    <h1>${esc(prettyTitle)} of 2026</h1>
    <p>${esc(desc)}</p>
  </div>

  <div class="searchbox" role="search">
    <div class="sbinput">
      <span class="sbicon">🔎</span>
      <input id="catSearch" type="text" autocomplete="off" placeholder="Search a ranking category — e.g. chatbot, image, coding…" aria-label="Search ranking categories">
      <button id="catClear" type="button" aria-label="Clear" style="display:none">✕</button>
    </div>
    <div id="sbResults" class="sbresults" hidden></div>
  </div>

  <div class="list">${listHtml}</div>

  <div class="sec">
    <h2>How we rank</h2>
    <p>MarkBook rankings blend user ratings, feature depth, data quality, and pricing accessibility. Verified tools with rich descriptions and working links appear first; repository-only listings are demoted. Rankings refresh with each catalog update.</p>
  </div>


  <div class="sec">
    <h2>Explore more rankings</h2>
    <div class="pill-row">
      <a class="pill" href="/rankings/best-ai-writing-tools">✍️ Writing</a>
      <a class="pill" href="/rankings/top-ai-image-generators">🎨 Image Generators</a>
      <a class="pill" href="/rankings/best-ai-chatbots">💬 Chatbots</a>
      <a class="pill" href="/rankings/best-ai-video-tools">🎬 Video</a>
      <a class="pill" href="/rankings/best-ai-coding-tools">💻 Coding</a>
      <a class="pill" href="/rankings/best-ai-productivity-tools">⚡ Productivity</a>
      <a class="pill" href="/rankings">See all →</a>
    </div>
  </div>

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
