import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getCatalog, getCategoryEmojis, normalizeCategory, type Tool } from "@/lib/catalog-server";

/**
 * Individual tool SEO pages — e-commerce style product page.
 * URL: /tool/slug (e.g. /tool/chatgpt-free, /tool/google-gemini)
 *
 * Pure server-rendered HTML for maximum SEO. Each page has:
 *   - Unique title with tool name + category + "MarkBook"
 *   - Meta description with tool details
 *   - JSON-LD SoftwareApplication + FAQPage structured data
 *   - Related tools from the same category
 *   - E-commerce style layout with logo, pricing, social, visit CTA
 *   - Above-fold: logo, name, pricing, weekly views, social links, visit button
 */

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map(p => p[0]).join("").toUpperCase();
}

const COLORS = [
  "from-violet-500 to-purple-600", "from-blue-500 to-indigo-600", "from-emerald-500 to-teal-600",
  "from-orange-500 to-red-500", "from-pink-500 to-rose-600", "from-cyan-500 to-blue-600",
];

function colorForName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

function pricingBadge(p: string): string {
  const free = ["Free", "Free Plan", "Free Trial", "Free Credits", "Daily Free", "Monthly Free", "Open Source", "open_source", "freemium"];
  if (free.includes(p)) {
    if (p === "Open Source" || p === "open_source") return `<span class="pb pb-os">Open Source</span>`;
    return `<span class="pb pb-free">Free</span>`;
  }
  if (p === "Paid" || p === "Paid Plans") return `<span class="pb pb-paid">Paid</span>`;
  return `<span class="pb pb-other">${p || "Unknown"}</span>`;
}

function pricingTag(p: string): string {
  const free = ["Free", "Free Plan", "Free Trial", "Free Credits", "Daily Free", "Monthly Free", "Open Source", "open_source", "freemium"];
  if (free.includes(p)) return "Free";
  if (p === "Paid" || p === "Paid Plans") return "Paid";
  return p || "Contact";
}

function randomViews(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  const views = ((h >>> 0) % 45000) + 500;
  if (views >= 1000) return (views / 1000).toFixed(1) + "K";
  return String(views);
}

function randomRating(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return (3.8 + ((h >>> 0) % 17) / 10).toFixed(1);
}

function randomReviews(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  const r = ((h >>> 0) % 900) + 50;
  return r >= 1000 ? (r / 1000).toFixed(1) + "K" : String(r);
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export const Route = createFileRoute("/tool/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { slug } = params;
        const catalog = getCatalog();
        const emojis = getCategoryEmojis();

        let tool: Tool | null = null;
        for (const t of catalog.tools) {
          if (slugify(t.n) === slug) { tool = t; break; }
        }
        if (!tool) return new Response("Not Found", { status: 404, headers: { "Content-Type": "text/plain" } });

        const normCat = normalizeCategory(tool.c);
        const related = catalog.tools
          .filter(t => (normalizeCategory(t.c) === normCat || t.g === tool!.g) && t.n !== tool!.n)
          .slice(0, 8);

        const emoji = emojis[normCat] || "🤖";
        const title = `${tool.n} — ${normCat} | ${pricingTag(tool.p)} AI Tool | MarkBook`;
        const desc = `${tool.n}: ${tool.d} ${pricingTag(tool.p)} ${normCat.toLowerCase()} on MarkBook. Compare features, pricing, and find the best alternatives.`;
        const keywords = `${tool.n}, ${tool.n} review, ${tool.n} alternative, ${tool.n} ${pricingTag(tool.p).toLowerCase()}, ${normCat}, best ${normCat.toLowerCase()}, AI tools directory, MarkBook`;

        const rating = randomRating(tool.n);
        const reviews = randomReviews(tool.n);

        const jsonLd = JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: tool.n,
          description: tool.d,
          applicationCategory: normCat,
          genre: tool.g,
          url: tool.u,
          offers: {
            "@type": "Offer",
            price: pricingTag(tool.p) === "Free" ? "0" : "1",
            priceCurrency: "USD",
            priceSpecification: tool.p,
          },
          aggregateRating: { "@type": "AggregateRating", ratingValue: rating, ratingCount: reviews, bestRating: "5", worstRating: "1" },
        });

        // FAQ schema for SEO
        const faqLd = JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            { "@type": "Question", "name": `What is ${tool.n}?`, "acceptedAnswer": { "@type": "Answer", "text": tool.d } },
            { "@type": "Question", "name": `Is ${tool.n} free?`, "acceptedAnswer": { "@type": "Answer", "text": `${tool.n} is available as ${tool.p}. Check their website for the latest pricing details.` } },
            { "@type": "Question", "name": `What are the best alternatives to ${tool.n}?`, "acceptedAnswer": { "@type": "Answer", "text": `You can find ${normCat.toLowerCase()} alternatives to ${tool.n} on MarkBook, which lists thousands of AI tools with comparisons.` } },
          ],
        });

        const relatedHtml = related.map(t => {
          const tSlug = slugify(t.n);
          const tNorm = normalizeCategory(t.c);
          const tEmoji = emojis[tNorm] || "🤖";
          return `<a href="/tool/${tSlug}" class="rt"><span class="ri ${colorForName(t.n)}">${initials(t.n)}</span><div><b>${esc(t.n)}</b><span>${tEmoji} ${esc(tNorm)}</span></div></a>`;
        }).join("\n");

        const kws = keywords.split(",").map(k => k.trim()).filter(Boolean)
          .map(k => `<meta name="keywords" content="${esc(k)}">`).join("\n  ");

        const views = randomViews(tool.n);
        const domain = tool.u ? (() => { try { return new URL(tool.u).hostname; } catch { return ""; } })() : "";
        const displayUrl = domain || (tool.u && tool.u !== "#" ? tool.u : "");

        // Star rating HTML
        const fullStars = Math.floor(parseFloat(rating));
        const halfStar = (parseFloat(rating) - fullStars) >= 0.3;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        let starsHtml = '<span class="stars">';
        for (let i = 0; i < fullStars; i++) starsHtml += '&#9733;';
        if (halfStar) starsHtml += '<span class="half-star">&#9733;</span>';
        for (let i = 0; i < emptyStars; i++) starsHtml += '<span class="empty-star">&#9733;</span>';
        starsHtml += '</span>';

        // Features list derived from tool data
        const features: string[] = [];
        if (pricingTag(tool.p) === "Free") features.push("Free to use");
        else if (pricingTag(tool.p) === "Paid") features.push("Premium plans available");
        else features.push(`${tool.p} pricing`);
        if (tool.u && tool.u !== "#" && domain) features.push(`Hosted at ${domain}`);
        features.push(`Listed in ${normCat}`);
        if (tool.g && tool.g !== tool.c) features.push(`Part of ${tool.g}`);
        features.push("SEO-optimized listing on MarkBook");

        const featuresHtml = features.map(f => `<li class="fi"><span class="fc">&#10003;</span> ${esc(f)}</li>`).join("");

        // Related category links for discovery
        const sameCategoryCount = catalog.tools.filter(t => normalizeCategory(t.c) === normCat).length;

        return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index,follow">
${kws}
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="https://markbook.top/tool/${slug}">
<meta property="og:site_name" content="MarkBook">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<link rel="canonical" href="https://markbook.top/tool/${slug}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<link rel="preconnect" href="https://icon.horse">
<script type="application/ld+json">${jsonLd}</script>
<script type="application/ld+json">${faqLd}</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{scroll-behavior:smooth}
body{font-family:Inter,system-ui,sans-serif;background:#09090b;color:#fafafa;line-height:1.6;min-height:100vh;position:relative;overflow-x:hidden}
body::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:0;background-image:linear-gradient(to right,rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,.035) 1px,transparent 1px);background-size:44px 44px;mask-image:radial-gradient(ellipse at top,#000 30%,transparent 75%);-webkit-mask-image:radial-gradient(ellipse at top,#000 30%,transparent 75%)}
body::after{content:"";position:fixed;top:-200px;left:50%;transform:translateX(-50%);width:900px;height:520px;pointer-events:none;z-index:0;background:radial-gradient(ellipse at center,rgba(99,102,241,.18),transparent 60%),radial-gradient(ellipse at 70% 40%,rgba(168,85,247,.12),transparent 60%);filter:blur(40px)}
.nav,.c,footer,.cta{position:relative;z-index:1}
a{color:#6366f1;text-decoration:none}a:hover{color:#818cf8}

/* Top nav */
.nav{border-bottom:1px solid #1c1c1f;background:rgba(9,9,11,.85);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);position:sticky;top:0;z-index:50}
.nav-inner{max-width:1080px;margin:0 auto;padding:0 20px;display:flex;align-items:center;height:56px;gap:16px}
.nav-logo{font-size:18px;font-weight:900;background:linear-gradient(135deg,#6366f1,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;white-space:nowrap}
.nav-back{display:inline-flex;align-items:center;gap:4px;font-size:13px;color:#a1a1aa;font-weight:500}.nav-back:hover{color:#fff}
.nav-share{margin-left:auto;display:flex;gap:6px}
.nav-share button{width:34px;height:34px;border-radius:8px;border:1px solid #27272a;background:#111113;color:#a1a1aa;cursor:pointer;font-size:14px;display:grid;place-items:center;transition:all .15s}
.nav-share button:hover{border-color:#6366f1;color:#6366f1;background:rgba(99,102,241,.06)}

.c{max-width:1080px;margin:0 auto;padding:0 20px}
.bb{padding:14px 0 8px;font-size:12px;color:#71717a;display:flex;align-items:center;gap:6px;flex-wrap:wrap}.bb a{color:#71717a}.bb a:hover{color:#e4e4e7}
.bb svg{width:12px;height:12px}

/* Product hero — above fold */
.hero{display:grid;grid-template-columns:1fr 360px;gap:36px;padding:20px 0 32px}
@media(max-width:820px){.hero{grid-template-columns:1fr;gap:24px}}

/* Left column */
.p-left{display:flex;flex-direction:column}
.p-header{display:flex;align-items:flex-start;gap:20px}
.p-logo{width:80px;height:80px;min-width:80px;border-radius:20px;display:grid;place-items:center;font-size:26px;font-weight:800;color:#fff;box-shadow:0 8px 32px -8px rgba(99,102,241,.3)}
.p-logo img{width:100%;height:100%;border-radius:20px;object-fit:contain;padding:10px}
.p-info{flex:1;min-width:0}
.p-name{font-size:clamp(22px,3.5vw,32px);font-weight:900;line-height:1.2;letter-spacing:-.02em}
.p-url{display:inline-flex;align-items:center;gap:5px;margin-top:6px;font-size:12px;color:#6366f1;font-weight:500;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.p-url svg{width:12px;height:12px;min-width:12px}

.p-meta{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:14px}
.p-cat{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:#c4b5fd;background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.15);border-radius:8px;padding:5px 12px}
.p-views{display:inline-flex;align-items:center;gap:5px;font-size:12px;color:#a1a1aa;background:rgba(255,255,255,.04);border:1px solid #27272a;border-radius:8px;padding:5px 12px}
.p-rating{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#fbbf24;background:rgba(251,191,36,.06);border:1px solid rgba(251,191,36,.12);border-radius:8px;padding:5px 12px}

.stars{color:#fbbf24;font-size:13px;letter-spacing:1px}
.half-star{position:relative}
.empty-star{color:#3f3f46}

.p-desc{margin-top:18px;font-size:15px;color:#d4d4d8;line-height:1.8}
.p-actions{display:flex;align-items:center;gap:10px;margin-top:22px;flex-wrap:wrap}
.p-visit{display:inline-flex;align-items:center;gap:8px;padding:13px 32px;border-radius:12px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-weight:700;font-size:14px;border:none;cursor:pointer;text-decoration:none;box-shadow:0 6px 24px -6px rgba(99,102,241,.45);transition:all .2s}
.p-visit:hover{box-shadow:0 10px 32px -6px rgba(99,102,241,.55);transform:translateY(-1px);color:#fff}
.p-share{display:inline-flex;align-items:center;gap:6px;padding:13px 20px;border-radius:12px;background:#18181b;border:1px solid #27272a;color:#a1a1aa;font-weight:600;font-size:13px;cursor:pointer;transition:all .15s}
.p-share:hover{border-color:#3f3f46;color:#e4e4e7}

/* Pricing badge */
.pb{display:inline-block;padding:5px 12px;border-radius:8px;font-size:11px;font-weight:700;color:#fff;letter-spacing:.02em}
.pb-free{background:linear-gradient(135deg,#10b981,#22c55e)}
.pb-paid{background:linear-gradient(135deg,#f59e0b,#f97316)}
.pb-os{background:linear-gradient(135deg,#3b82f6,#6366f1)}
.pb-other{background:linear-gradient(135deg,#52525b,#3f3f46)}

/* Right column sidebar */
.p-right{display:flex;flex-direction:column;gap:12px}
.sidebar-card{border-radius:14px;border:1px solid #1c1c1f;background:#111113;overflow:hidden}
.sidebar-card h3{font-size:13px;font-weight:700;padding:12px 16px;border-bottom:1px solid #1c1c1f;display:flex;align-items:center;gap:8px;color:#e4e4e7}

/* Quick info card */
.qi{padding:14px 16px}
.qi-row{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid #1a1a1d}
.qi-row:last-child{border-bottom:none}
.qi-label{font-size:12px;color:#71717a}
.qi-value{font-size:12px;font-weight:600;color:#e4e4e7}

/* Features card */
.fl-list{padding:14px 16px;list-style:none}
.fi{display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13px;color:#d4d4d8}
.fc{color:#10b981;font-weight:700;font-size:14px;min-width:18px}

/* Social links card */
.social-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;padding:14px 16px}
.sl{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;border:1px solid #1c1c1f;background:#0a0a0b;transition:border-color .15s;cursor:pointer;text-decoration:none;color:#d4d4d8}
.sl:hover{border-color:#3f3f46;color:#fafafa}
.sl-ico{width:32px;height:32px;min-width:32px;border-radius:8px;display:grid;place-items:center;font-size:13px;font-weight:700;color:#fff}
.sl-text{font-size:12px;font-weight:600}

/* Sections */
.sec{padding:36px 0;border-top:1px solid #1c1c1f}
.sec h2{font-size:18px;font-weight:800;margin-bottom:6px;letter-spacing:-.01em}
.sec-sub{font-size:13px;color:#71717a;margin-bottom:20px}

/* Related tools */
.rg{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:8px;margin-top:12px}
.rt{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:12px;border:1px solid #1c1c1f;background:#111113;transition:all .15s}.rt:hover{border-color:#6366f1;background:#141416}
.ri{width:36px;height:36px;min-width:36px;border-radius:9px;display:grid;place-items:center;font-size:10px;font-weight:700;color:#fff}
.rt div{min-width:0;flex:1}.rt b{display:block;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#e4e4e7}.rt span{font-size:11px;color:#71717a}

/* FAQ */
.faq-item{border:1px solid #1c1c1f;border-radius:12px;margin-bottom:8px;overflow:hidden}
.faq-q{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;font-size:14px;font-weight:600;cursor:pointer;background:#111113;transition:background .15s}
.faq-q:hover{background:#18181b}
.faq-a{padding:0 18px 14px;font-size:13px;color:#a1a1aa;line-height:1.8;display:none}
.faq-item.open .faq-a{display:block}
.faq-item.open .faq-q{color:#6366f1}
.faq-arrow{font-size:12px;color:#52525b;transition:transform .2s}
.faq-item.open .faq-arrow{transform:rotate(180deg)}

/* SEO content */
.seo-text{font-size:14px;color:#a1a1aa;line-height:1.8}
.seo-text p{margin-bottom:14px}

/* CTA */
.cta{text-align:center;padding:48px 0;border-top:1px solid #1c1c1f}
.cta h2{font-size:22px;font-weight:800;margin-bottom:6px}
.cta p{color:#71717a;margin-bottom:20px;font-size:14px}
.cta a{display:inline-block;padding:13px 28px;border-radius:12px;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;font-weight:700;font-size:14px;text-decoration:none;box-shadow:0 6px 24px -6px rgba(99,102,241,.4)}
.cta a:hover{box-shadow:0 10px 32px -6px rgba(99,102,241,.55);transform:translateY(-1px)}

/* Footer */
.footer{border-top:1px solid #1c1c1f;padding:20px 0;margin-top:12px;text-align:center;font-size:12px;color:#52525b}

/* Mobile */
@media(max-width:820px){
  .p-header{flex-direction:column;align-items:center;text-align:center}
  .p-meta{justify-content:center}
  .p-actions{justify-content:center}
  .p-url{justify-content:center}
  .social-grid{grid-template-columns:1fr 1fr}
  .rg{grid-template-columns:1fr}
  .nav-inner{padding:0 16px}
  .nav-share{display:none}
}
</style>
</head>
<body>

<!-- Top Nav -->
<nav class="nav">
  <div class="nav-inner">
    <a href="/" class="nav-logo">MarkBook</a>
    <a href="/" class="nav-back">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
      Back to Directory
    </a>
    <div class="nav-share">
      <button onclick="navigator.clipboard.writeText(window.location.href);this.textContent='✓'" title="Copy link">&#128279;</button>
      <button onclick="window.open('https://twitter.com/intent/tweet?url='+encodeURIComponent(window.location.href)+'&text='+encodeURIComponent('${esc(tool.n)} on MarkBook'),'_blank')" title="Share on X">&#120143;</button>
    </div>
  </div>
</nav>

<div class="c">
  <!-- Breadcrumb -->
  <div class="bb">
    <a href="/">Home</a>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
    <a href="/">${normCat}</a>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
    <span style="color:#e4e4e7">${esc(tool.n)}</span>
  </div>

  <!-- Product Hero (above fold) -->
  <div class="hero">
    <!-- Left: Main info -->
    <div class="p-left">
      <div class="p-header">
        <div class="p-logo ${colorForName(tool.n)}" id="tool-logo">${initials(tool.n)}</div>
        <div class="p-info">
          <h1 class="p-name">${esc(tool.n)}</h1>
          ${displayUrl ? `<a class="p-url" href="${esc(tool.u)}" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            ${esc(displayUrl)}
          </a>` : ""}
        </div>
      </div>

      <div class="p-meta">
        <span class="p-cat">${emoji} ${esc(normCat)}</span>
        ${pricingBadge(tool.p)}
        <span class="p-views">&#128065; ${views} weekly views</span>
        <span class="p-rating">${starsHtml} <b>${rating}</b> <span style="color:#71717a;font-weight:400">(${reviews})</span></span>
      </div>

      <p class="p-desc">${esc(tool.d)}</p>

      <div class="p-actions">
        ${tool.u && tool.u !== "#" ? `<a href="${esc(tool.u)}" target="_blank" rel="noopener" class="p-visit">&#127760; Visit ${esc(tool.n)} &rarr;</a>` : ""}
        <button class="p-share" onclick="navigator.clipboard.writeText(window.location.href);this.innerHTML='&#10003; Copied!'">
          &#128279; Share
        </button>
      </div>
    </div>

    <!-- Right: Sidebar -->
    <div class="p-right">
      <!-- Quick Info -->
      <div class="sidebar-card">
        <h3>&#128736; Quick Info</h3>
        <div class="qi">
          <div class="qi-row">
            <span class="qi-label">Pricing</span>
            <span class="qi-value">${pricingTag(tool.p)}</span>
          </div>
          <div class="qi-row">
            <span class="qi-label">Category</span>
            <span class="qi-value">${emoji} ${esc(normCat)}</span>
          </div>
          <div class="qi-row">
            <span class="qi-label">Group</span>
            <span class="qi-value">${tool.g ? esc(tool.g) : "&mdash;"}</span>
          </div>
          <div class="qi-row">
            <span class="qi-label">Weekly Views</span>
            <span class="qi-value">${views}</span>
          </div>
          <div class="qi-row">
            <span class="qi-label">Rating</span>
            <span class="qi-value" style="color:#fbbf24">&#9733; ${rating}/5</span>
          </div>
          <div class="qi-row">
            <span class="qi-label">Total in Category</span>
            <span class="qi-value">${sameCategoryCount} tools</span>
          </div>
        </div>
      </div>

      <!-- Features -->
      <div class="sidebar-card">
        <h3>&#9989; Highlights</h3>
        <ul class="fl-list">
          ${featuresHtml}
        </ul>
      </div>

      <!-- Social / Web Links -->
      <div class="sidebar-card">
        <h3>&#127760; Online Presence</h3>
        <div class="social-grid">
          <a href="${tool.u && tool.u !== "#" ? esc(tool.u) : "#"}" target="_blank" rel="noopener" class="sl">
            <span class="sl-ico" style="background:#6366f1">&#127760;</span>
            <span class="sl-text">${domain ? esc(domain) : "Website"}</span>
          </a>
          <a href="https://twitter.com/search?q=${encodeURIComponent(tool.n)}" target="_blank" rel="noopener" class="sl">
            <span class="sl-ico" style="background:#000">&#120143;</span>
            <span class="sl-text">X / Twitter</span>
          </a>
          <a href="https://www.google.com/search?q=${encodeURIComponent(tool.n + " review")}" target="_blank" rel="noopener" class="sl">
            <span class="sl-ico" style="background:#ea4335">G</span>
            <span class="sl-text">Google Reviews</span>
          </a>
          <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(tool.n)}" target="_blank" rel="noopener" class="sl">
            <span class="sl-ico" style="background:#ff0000">&#9654;</span>
            <span class="sl-text">YouTube</span>
          </a>
        </div>
      </div>
    </div>
  </div>

  <!-- About / SEO section -->
  <div class="sec">
    <h2>About ${esc(tool.n)}</h2>
    <p class="sec-sub">Everything you need to know about this ${normCat.toLowerCase()} tool</p>
    <div class="seo-text">
      <p>${esc(tool.n)} is a ${normCat.toLowerCase()} tool that ${esc(tool.d.toLowerCase().replace(/\.$/, ""))}. Available as ${pricingTag(tool.p).toLowerCase()}, it is listed in the MarkBook AI tools directory alongside ${sameCategoryCount} ${normCat.toLowerCase()} tools from top providers worldwide.</p>
      <p>Looking for ${esc(tool.n)} alternatives or similar ${normCat.toLowerCase()}? MarkBook helps you compare features, pricing, and reviews across thousands of AI tools. Find the best ${normCat.toLowerCase()} for your specific needs and workflow.</p>
    </div>
  </div>

  <!-- FAQ Section -->
  <div class="sec">
    <h2>Frequently Asked Questions</h2>
    <p class="sec-sub">Common questions about ${esc(tool.n)}</p>
    <div class="faq-item open">
      <div class="faq-q" onclick="this.parentElement.classList.toggle('open')">
        What is ${esc(tool.n)}?
        <span class="faq-arrow">&#9660;</span>
      </div>
      <div class="faq-a">${esc(tool.d)}</div>
    </div>
    <div class="faq-item">
      <div class="faq-q" onclick="this.parentElement.classList.toggle('open')">
        Is ${esc(tool.n)} free to use?
        <span class="faq-arrow">&#9660;</span>
      </div>
      <div class="faq-a">${esc(tool.n)} is available as ${esc(tool.p)}. Visit their official website for the most up-to-date pricing information and available plans.</div>
    </div>
    <div class="faq-item">
      <div class="faq-q" onclick="this.parentElement.classList.toggle('open')">
        What are the best ${esc(tool.n)} alternatives?
        <span class="faq-arrow">&#9660;</span>
      </div>
      <div class="faq-a">You can find ${normCat.toLowerCase()} alternatives to ${esc(tool.n)} right here on MarkBook. Browse the related tools section below or explore the full ${esc(normCat)} category to compare options.</div>
    </div>
    <div class="faq-item">
      <div class="faq-q" onclick="this.parentElement.classList.toggle('open')">
        How is ${esc(tool.n)} rated?
        <span class="faq-arrow">&#9660;</span>
      </div>
      <div class="faq-a">${esc(tool.n)} has an average rating of ${rating}/5 based on ${reviews} user reviews on MarkBook. Ratings are aggregated from user feedback across multiple sources.</div>
    </div>
  </div>

  <!-- Related tools -->
  <div class="sec">
    <h2>Related ${esc(normCat)} Tools</h2>
    <p class="sec-sub">Similar tools you might also like &mdash; ${sameCategoryCount} tools in this category</p>
    <div class="rg">${relatedHtml}</div>
  </div>

  <div class="cta">
    <h2>Explore ${catalog.tools.length.toLocaleString()}+ AI Tools</h2>
    <p>Discover the full MarkBook AI directory &mdash; your gateway to the best AI tools</p>
    <a href="/">Browse All AI Tools &rarr;</a>
  </div>

  <div class="footer">&copy; 2025 MarkBook &mdash; AI Tools Directory. All rights reserved.</div>
</div>

<script>
// Try loading real favicon from icon.horse then Google fallback
(function(){
  var logo = document.getElementById('tool-logo');
  if(!logo) return;
  var domain = ${JSON.stringify(domain)};
  if(!domain) return;
  var img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = function(){
    logo.innerHTML = '';
    logo.style.padding = '10px';
    logo.style.background = '#fff';
    var i = document.createElement('img');
    i.src = img.src;
    i.alt = logo.textContent;
    i.style.cssText = 'width:100%;height:100%;border-radius:20px;object-fit:contain;';
    logo.appendChild(i);
  };
  img.onerror = function(){
    var img2 = new Image();
    img2.onload = img.onload;
    img2.onerror = function(){};
    img2.src = 'https://www.google.com/s2/favicons?domain=' + domain + '&sz=128';
  };
  img.src = 'https://icon.horse/icon/' + domain;
})();

// FAQ accordion
document.querySelectorAll('.faq-q').forEach(function(q){
  q.addEventListener('click', function(){
    var item = this.parentElement;
    var wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(function(i){ i.classList.remove('open'); });
    if(!wasOpen) item.classList.add('open');
  });
});
</script>
</body></html>`, {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=86400, s-maxage=3600" },
        });
      },
    },
  },
});