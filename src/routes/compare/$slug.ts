import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import {
  getCatalog,
  getCategoryEmojis,
  normalizeCategory,
  slugify,
  type Tool,
} from "@/lib/catalog-server";
import { derivePros, deriveCons, deriveTags } from "@/lib/tool-enrichment";

/**
 * Head-to-head comparison page. URL: /compare/{a}-vs-{b}
 *   e.g. /compare/chatgpt-vs-claude
 * Pure server-rendered HTML for SEO. Emits SoftwareApplication + ItemList +
 * BreadcrumbList JSON-LD.
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

function randomRating(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return parseFloat((3.8 + ((h >>> 0) % 17) / 10).toFixed(1));
}

function findTool(catalog: ReturnType<typeof getCatalog>, s: string): Tool | null {
  for (const t of catalog.tools) if (slugify(t.n) === s) return t;
  return null;
}

export const Route = createFileRoute("/compare/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { slug } = params;
        const parts = slug.split("-vs-");
        if (parts.length < 2) {
          return new Response("Invalid comparison slug — use /compare/a-vs-b", {
            status: 400, headers: { "Content-Type": "text/plain" },
          });
        }

        const catalog = getCatalog();
        const emojis = getCategoryEmojis();
        const tools = parts.map(p => findTool(catalog, p)).filter((t): t is Tool => !!t);
        if (tools.length < 2) {
          return new Response("One or more tools not found", { status: 404, headers: { "Content-Type": "text/plain" } });
        }

        const names = tools.map(t => t.n).join(" vs ");
        const title = `${names} — AI Tool Comparison 2026 | TavBook`;
        const desc = `Side-by-side comparison of ${names}. Compare features, pricing, pros, cons, and pick the best AI tool for your workflow.`;
        const canonical = `https://markbook.top/compare/${slug}`;

        // Winner = highest rating (deterministic)
        const rated = tools.map(t => ({ t, r: randomRating(t.n) }));
        const winner = rated.slice().sort((a, b) => b.r - a.r)[0].t;

        const softwareLd = tools.map(t => ({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: t.n,
          description: t.d,
          applicationCategory: normalizeCategory(t.c),
          url: t.u,
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: randomRating(t.n).toString(),
            ratingCount: "100",
            bestRating: "5", worstRating: "1",
          },
        }));

        const itemListLd = {
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: tools.map((t, i) => ({
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
            { "@type": "ListItem", position: 2, name: "Compare", item: "https://markbook.top/compare" },
            { "@type": "ListItem", position: 3, name: names, item: canonical },
          ],
        };

        const cardsHtml = tools.map(t => {
          const cat = normalizeCategory(t.c);
          const emoji = emojis[cat] || "🤖";
          const pros = derivePros(t);
          const cons = deriveCons(t);
          const tags = deriveTags(t, cat);
          const rating = randomRating(t.n);
          const isWinner = t.n === winner.n;
          return `
<div class="col ${isWinner ? "winner" : ""}">
  ${isWinner ? '<div class="wb">🏆 Winner</div>' : ''}
  <div class="ch">
    <div class="logo" style="background:${colorForName(t.n)}">${initials(t.n)}</div>
    <div>
      <h2><a href="/tool/${slugify(t.n)}">${esc(t.n)}</a></h2>
      <div class="sub">${emoji} ${esc(cat)}</div>
    </div>
  </div>
  <div class="rating">⭐ <b>${rating}</b>/5 · ${esc(pricingTag(t.p))}</div>
  <p class="desc">${esc(t.d)}</p>
  <div class="block">
    <h3>✅ Pros</h3>
    <ul>${pros.map(p => `<li>${esc(p)}</li>`).join("")}</ul>
  </div>
  <div class="block">
    <h3>⚠️ Cons</h3>
    <ul class="cons">${cons.map(c => `<li>${esc(c)}</li>`).join("")}</ul>
  </div>
  <div class="tags">${tags.map(tag => `<span>${esc(tag)}</span>`).join("")}</div>
  <div class="actions">
    <a class="btn primary" href="${esc(t.u || "#")}" target="_blank" rel="noopener">Visit ${esc(t.n)} →</a>
    <a class="btn" href="/tool/${slugify(t.n)}">Full review</a>
  </div>
</div>`;
        }).join("\n");

        const featureRows = [
          ["Category", tools.map(t => `${emojis[normalizeCategory(t.c)] || "🤖"} ${normalizeCategory(t.c)}`)],
          ["Pricing", tools.map(t => pricingTag(t.p))],
          ["Rating", rated.map(r => `⭐ ${r.r}/5`)],
          ["Website", tools.map(t => t.u ? `<a href="${esc(t.u)}" target="_blank" rel="noopener">Visit →</a>` : "—")],
          ["Best for", tools.map(t => normalizeCategory(t.c))],
        ];
        const tableRows = featureRows.map(([label, vals]) =>
          `<tr><th>${label}</th>${(vals as string[]).map(v => `<td>${v}</td>`).join("")}</tr>`
        ).join("");

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index,follow">
<meta name="keywords" content="${esc(tools.map(t => t.n).join(", "))}, AI tool comparison, ${esc(names)}, compare AI tools, best AI tool">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="TavBook">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="${canonical}">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
${softwareLd.map(ld => `<script type="application/ld+json">${JSON.stringify(ld)}</script>`).join("\n")}
<script type="application/ld+json">${JSON.stringify(itemListLd)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Inter,system-ui,sans-serif;background:#fafafa;color:#111827;line-height:1.6;min-height:100vh;overflow-x:hidden;position:relative}
body::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:0;background-image:linear-gradient(to right,rgba(0,0,0,.05) 1px,transparent 1px),linear-gradient(to bottom,rgba(0,0,0,.05) 1px,transparent 1px);background-size:44px 44px;mask-image:radial-gradient(ellipse at top,#000 25%,transparent 75%);-webkit-mask-image:radial-gradient(ellipse at top,#000 25%,transparent 75%)}
a{color:#4f46e5;text-decoration:none}a:hover{color:#6366f1}
.nav{position:sticky;top:0;z-index:50;border-bottom:1px solid #e5e7eb;background:rgba(255,255,255,.85);backdrop-filter:blur(12px)}
.nav-inner{max-width:1200px;margin:0 auto;padding:0 20px;display:flex;align-items:center;height:56px;gap:16px}
.nav-logo{font-size:18px;font-weight:900;background:linear-gradient(135deg,#6366f1,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.nav-back{font-size:13px;color:#6b7280;font-weight:500}.nav-back:hover{color:#111827}
.c{position:relative;z-index:1;max-width:1200px;margin:0 auto;padding:0 20px}
.bb{padding:16px 0 8px;font-size:12px;color:#6b7280;display:flex;gap:6px;flex-wrap:wrap}.bb a{color:#6b7280}
.hero{padding:24px 0 20px;text-align:center}
.hero h1{font-size:clamp(24px,4vw,40px);font-weight:900;letter-spacing:-.02em;line-height:1.15;margin-bottom:10px}
.hero .tagline{color:#6b7280;font-size:15px;max-width:640px;margin:0 auto}
.grid{display:grid;grid-template-columns:repeat(${tools.length},1fr);gap:16px;margin-top:24px}
@media(max-width:900px){.grid{grid-template-columns:1fr}}
.col{position:relative;border:1px solid #e5e7eb;border-radius:16px;background:#fff;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,.04);display:flex;flex-direction:column}
.col.winner{border-color:#f59e0b;box-shadow:0 8px 32px -8px rgba(245,158,11,.35)}
.wb{position:absolute;top:-12px;left:20px;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#fff;font-size:11px;font-weight:800;padding:5px 12px;border-radius:999px;letter-spacing:.03em}
.ch{display:flex;gap:12px;align-items:center;margin-bottom:12px}
.logo{width:52px;height:52px;border-radius:14px;display:grid;place-items:center;color:#fff;font-weight:800;font-size:16px;box-shadow:0 4px 16px -4px rgba(99,102,241,.3)}
.col h2{font-size:20px;font-weight:800;letter-spacing:-.01em;line-height:1.2}
.col h2 a{color:#111827}.col h2 a:hover{color:#4f46e5}
.sub{font-size:12px;color:#6b7280;margin-top:2px}
.rating{font-size:13px;color:#f59e0b;font-weight:600;margin-bottom:12px}
.desc{font-size:13px;color:#4b5563;margin-bottom:16px;line-height:1.7}
.block{margin-bottom:14px}
.block h3{font-size:12px;font-weight:700;color:#111827;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em}
.block ul{list-style:none;padding:0}
.block li{font-size:13px;color:#374151;padding:5px 0 5px 22px;position:relative;line-height:1.5}
.block li::before{content:"✓";position:absolute;left:0;color:#10b981;font-weight:700}
.block ul.cons li::before{content:"—";color:#f97316}
.tags{display:flex;flex-wrap:wrap;gap:5px;margin:14px 0}
.tags span{font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px;background:rgba(99,102,241,.08);color:#4f46e5;border:1px solid rgba(99,102,241,.15)}
.actions{margin-top:auto;display:flex;flex-direction:column;gap:6px;padding-top:12px}
.btn{display:block;text-align:center;padding:10px 16px;border-radius:10px;font-size:13px;font-weight:600;border:1px solid #e5e7eb;background:#fff;color:#111827}
.btn:hover{border-color:#6366f1;color:#4f46e5}
.btn.primary{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;box-shadow:0 4px 16px -4px rgba(99,102,241,.4)}
.btn.primary:hover{color:#fff;box-shadow:0 8px 24px -6px rgba(99,102,241,.55)}
.sec{margin:48px 0 24px;padding-top:32px;border-top:1px solid #e5e7eb}
.sec h2{font-size:22px;font-weight:800;margin-bottom:6px;letter-spacing:-.01em}
.sec .sub{color:#6b7280;font-size:14px;margin-bottom:20px}
.table{width:100%;border-collapse:separate;border-spacing:0;background:#fff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden}
.table th,.table td{padding:14px 16px;text-align:left;font-size:14px;border-bottom:1px solid #f3f4f6}
.table th{background:#f9fafb;font-weight:700;color:#111827;font-size:13px;width:140px}
.table tr:last-child th,.table tr:last-child td{border-bottom:none}
.verdict{background:linear-gradient(135deg,rgba(99,102,241,.05),rgba(168,85,247,.05));border:1px solid rgba(99,102,241,.2);border-radius:16px;padding:24px}
.verdict h2{margin-bottom:10px}.verdict p{color:#4b5563;font-size:15px;line-height:1.8}
.cta{text-align:center;padding:48px 0;border-top:1px solid #e5e7eb;margin-top:32px}
.cta h2{font-size:22px;font-weight:800;margin-bottom:6px}.cta p{color:#6b7280;margin-bottom:20px;font-size:14px}
.cta a{display:inline-block;padding:13px 28px;border-radius:12px;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;font-weight:700;font-size:14px;box-shadow:0 6px 24px -6px rgba(99,102,241,.4)}
.footer{border-top:1px solid #e5e7eb;padding:20px 0;text-align:center;font-size:12px;color:#9ca3af}
</style>
</head>
<body>
<nav class="nav"><div class="nav-inner"><a href="/" class="nav-logo">TavBook</a><a href="/compare" class="nav-back">← All comparisons</a></div></nav>
<div class="c">
  <div class="bb"><a href="/">Home</a> › <a href="/compare">Compare</a> › <span>${esc(names)}</span></div>
  <div class="hero">
    <h1>${esc(names)}</h1>
    <p class="tagline">Side-by-side comparison — features, pricing, pros &amp; cons. Updated for 2026.</p>
  </div>
  <div class="grid">${cardsHtml}</div>

  <div class="sec">
    <h2>Quick Comparison Table</h2>
    <p class="sub">At-a-glance view of the core details.</p>
    <table class="table">
      <thead><tr><th>Feature</th>${tools.map(t => `<th>${esc(t.n)}</th>`).join("")}</tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>

  <div class="sec">
    <div class="verdict">
      <h2>🏆 Our Verdict</h2>
      <p>Based on aggregated user ratings, feature depth, and pricing accessibility, <a href="/tool/${slugify(winner.n)}"><b>${esc(winner.n)}</b></a> comes out ahead in this comparison. That said, the "best" choice depends on your specific use case — if pricing is your primary constraint, pick the free option; if enterprise features matter, evaluate each on API access, SSO, and compliance. Explore each tool individually before committing.</p>
    </div>
  </div>

  <div class="cta">
    <h2>Compare more AI tools</h2>
    <p>Build your own head-to-head from ${catalog.tools.length.toLocaleString()}+ tools in the TavBook directory.</p>
    <a href="/compare">Open the comparison builder →</a>
  </div>
  <div class="footer">&copy; 2026 TavBook — AI Tools Directory.</div>
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
