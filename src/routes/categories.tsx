import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getCatalog, getCategoryEmojis, slugify } from "@/lib/catalog-server";
import { MAJOR_CATEGORIES, groupCategories } from "@/lib/category-map";

/**
 * Dedicated categories page — shows ALL categories in a beautiful grid.
 * Server-rendered HTML with client-side search/filter.
 */

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map(p => p[0]).join("").toUpperCase();
}

export const Route = createFileRoute("/categories")({
  server: {
    handlers: {
      GET: async () => {
        const catalog = getCatalog();
        const emojis = getCategoryEmojis();
        const totalCount = Object.values(catalog.categories).reduce((a, b) => a + b, 0);
        const catCount = Object.keys(catalog.categories).length;

        // Group categories into major categories
        const grouped = groupCategories(catalog.categories);

        // Sort individual categories by count for the "All Categories" view
        const sortedCategories = Object.entries(catalog.categories)
          .sort((a, b) => b[1] - a[1]);

        // Build major category cards HTML
        const majorCardsHtml = grouped.map((g, i) => {
          return `<a href="/category/${slugify(g.name)}" class="mc" data-name="${escapeHtml(g.name.toLowerCase())}">
            <div class="mc-emoji">${g.emoji}</div>
            <div class="mc-body">
              <h3>${escapeHtml(g.name)}</h3>
              <p>${escapeHtml(g.subCategories.slice(0, 4).join(", "))}${g.subCategories.length > 4 ? ` +${g.subCategories.length - 4} more` : ""}</p>
              <span class="mc-count">${g.count.toLocaleString()} tools</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mc-arrow"><path d="M9 18l6-6-6-6"/></svg>
          </a>`;
        }).join("\n");

        // Build individual category cards HTML
        const catCardsHtml = sortedCategories.map(([name, count]) => {
          const emoji = emojis[name] || "🤖";
          return `<a href="/category/${slugify(name)}" class="cc" data-name="${escapeHtml(name.toLowerCase())}">
            <span class="cc-emoji">${emoji}</span>
            <span class="cc-name">${escapeHtml(name)}</span>
            <span class="cc-count">${count.toLocaleString()}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </a>`;
        }).join("\n");

        const title = `All AI Tool Categories — ${catCount}+ Categories | MarkBook AI Directory`;
        const desc = `Explore ${catCount}+ AI tool categories on MarkBook. Browse ${totalCount.toLocaleString()}+ AI tools across chatbots, image generators, video editors, code assistants, and more. Find the best AI tools for any task.`;
        const keywords = `AI categories, AI tools directory, AI chatbot, AI image generator, AI video generator, AI code assistant, AI writing, ${sortedCategories.slice(0, 20).map(([n]) => n).join(", ")}`;

        const jsonLd = JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: title,
          description: desc,
          url: "https://markbook.top/categories",
          isPartOf: { "@type": "WebSite", name: "MarkBook AI", url: "https://markbook.top" },
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: catCount,
            itemListElement: grouped.slice(0, 20).map((g, i) => ({
              "@type": "ListItem", position: i + 1,
              item: { "@type": "CollectionPage", name: `${g.emoji} ${g.name}`, url: `https://markbook.top/category/${slugify(g.name)}` },
            })),
          },
        });

        return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="keywords" content="${keywords}">
<meta name="robots" content="index,follow">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:url" content="https://markbook.top/categories">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="https://markbook.top/categories">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<script type="application/ld+json">${jsonLd}</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Inter,system-ui,-apple-system,sans-serif;background:#09090b;color:#fafafa;line-height:1.6}
a{color:#6366f1;text-decoration:none}a:hover{color:#818cf8}
.c{max-width:1280px;margin:0 auto;padding:0 20px}

/* Breadcrumb */
.bb{padding:16px 0;font-size:13px;color:#a1a1aa}.bb a{color:#a1a1aa}.bb a:hover{color:#fff}

/* Hero */
.hero{text-align:center;padding:56px 0 40px;border-bottom:1px solid #18181b}
.hero h1{font-size:clamp(28px,5vw,48px);font-weight:900;background:linear-gradient(135deg,#6366f1,#a855f7,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:16px;letter-spacing:-.02em}
.hero p{font-size:16px;color:#a1a1aa;max-width:640px;margin:0 auto 28px;line-height:1.7}
.stats{display:flex;justify-content:center;gap:40px;flex-wrap:wrap;margin-top:28px}
.stat .val{font-size:32px;font-weight:800;background:linear-gradient(135deg,#6366f1,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.stat .lbl{font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:.08em;margin-top:4px}

/* Search */
.search-wrap{max-width:560px;margin:32px auto 0;position:relative}
.search-wrap svg{position:absolute;left:16px;top:50%;transform:translateY(-50%);color:#71717a;pointer-events:none}
.search-wrap input{width:100%;padding:14px 20px 14px 46px;border-radius:14px;border:1px solid #27272a;background:#111113;color:#fff;font-size:15px;outline:none;transition:border-color .2s,box-shadow .2s}
.search-wrap input:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.15)}
.search-wrap input::placeholder{color:#52525b}

/* Tabs */
.tabs{display:flex;justify-content:center;gap:8px;padding:32px 0 8px;flex-wrap:wrap}
.tab{padding:8px 20px;border-radius:20px;border:1px solid #27272a;background:#111113;color:#a1a1aa;font-size:14px;font-weight:500;cursor:pointer;transition:all .2s}
.tab:hover{border-color:#6366f1;color:#fff}
.tab.active{background:linear-gradient(135deg,#6366f1,#a855f7);border-color:transparent;color:#fff}

/* Section */
.sec{padding:32px 0 48px}
.sec-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px}
.sec-head h2{font-size:22px;font-weight:700}
.sec-head .sub{font-size:14px;color:#71717a}

/* Major Category Grid */
.mg{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:12px}
.mc{display:flex;align-items:center;gap:14px;padding:18px 20px;border-radius:16px;border:1px solid #1c1c22;background:#111113;transition:all .25s;position:relative;overflow:hidden}
.mc::before{content:"";position:absolute;inset:0;background:linear-gradient(135deg,rgba(99,102,241,.04),rgba(168,85,247,.04));opacity:0;transition:opacity .25s}
.mc:hover{border-color:#6366f1;transform:translateY(-2px);box-shadow:0 8px 30px rgba(99,102,241,.1)}
.mc:hover::before{opacity:1}
.mc:hover .mc-arrow{color:#6366f1;transform:translateX(4px)}
.mc-emoji{font-size:36px;width:56px;height:56px;display:grid;place-items:center;border-radius:14px;background:#18181b;flex-shrink:0}
.mc-body{flex:1;min-width:0}
.mc-body h3{font-size:15px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mc-body p{font-size:12px;color:#71717a;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mc-count{display:inline-block;margin-top:8px;font-size:11px;font-weight:600;color:#a855f7;background:rgba(168,85,247,.12);padding:3px 10px;border-radius:20px}
.mc-arrow{color:#52525b;transition:all .25s;flex-shrink:0}

/* Individual Category Grid (compact chips) */
.cg{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px}
.cc{display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:12px;border:1px solid #1c1c22;background:#111113;font-size:13px;color:#a1a1aa;transition:all .2s}
.cc:hover{border-color:#6366f1;color:#fff;background:rgba(99,102,241,.06)}
.cc:hover svg{color:#6366f1;transform:translateX(3px)}
.cc-emoji{font-size:20px;flex-shrink:0}
.cc-name{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:500}
.cc-count{font-size:11px;color:#52525b;background:#18181b;padding:2px 8px;border-radius:8px;font-weight:600;flex-shrink:0}
.cc svg{color:#3f3f46;transition:all .2s;flex-shrink:0}

/* No results */
.no-results{text-align:center;padding:60px 20px;color:#71717a}
.no-results .nr-emoji{font-size:48px;margin-bottom:16px}
.no-results h3{font-size:18px;font-weight:600;color:#a1a1aa;margin-bottom:8px}

/* CTA */
.cta{text-align:center;padding:56px 0;border-top:1px solid #18181b;margin-top:24px}
.cta h2{font-size:24px;font-weight:700;margin-bottom:8px}
.cta p{color:#a1a1aa;margin-bottom:24px}
.cta a{display:inline-block;padding:14px 32px;border-radius:12px;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;font-weight:600;font-size:14px;transition:opacity .2s}
.cta a:hover{opacity:.9}

/* Scroll to top */
.back-top{position:fixed;bottom:24px;right:24px;width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;border:none;cursor:pointer;display:none;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(99,102,241,.3);transition:transform .2s;z-index:99}
.back-top:hover{transform:scale(1.1)}
.back-top.show{display:flex}

@media(max-width:640px){
  .mg{grid-template-columns:1fr}
  .cg{grid-template-columns:1fr}
  .stats{gap:24px}
  .stat .val{font-size:26px}
  .mc-emoji{width:46px;height:46px;font-size:28px}
}
</style>
</head>
<body>

<!-- Breadcrumb -->
<div class="c">
  <div class="bb"><a href="/">Home</a> &rsaquo; All Categories</div>
</div>

<!-- Hero -->
<div class="hero">
  <div class="c">
    <h1>Explore All AI Categories</h1>
    <p>Discover the perfect AI tool from ${totalCount.toLocaleString()}+ tools across ${catCount}+ categories. Whether you need image generation, code assistance, or content creation — we have you covered.</p>
    <div class="stats">
      <div class="stat"><div class="val">${totalCount.toLocaleString()}+</div><div class="lbl">AI Tools</div></div>
      <div class="stat"><div class="val">${catCount}+</div><div class="lbl">Categories</div></div>
      <div class="stat"><div class="val">Daily</div><div class="lbl">Updates</div></div>
      <div class="stat"><div class="val">Free</div><div class="lbl">Available</div></div>
    </div>
    <div class="search-wrap">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <input type="text" id="searchInput" placeholder="Search categories..." autocomplete="off">
    </div>
  </div>
</div>

<!-- Content -->
<div class="c">

  <!-- Major Categories Section -->
  <div class="sec" id="majorSection">
    <div class="sec-head">
      <h2>Major Categories</h2>
      <span class="sub">${grouped.length} groups</span>
    </div>
    <div class="mg" id="majorGrid">
      ${majorCardsHtml}
    </div>
  </div>

  <!-- Individual Categories Section -->
  <div class="sec" id="allSection">
    <div class="sec-head">
      <h2>All Categories</h2>
      <span class="sub">${catCount} categories</span>
    </div>
    <div class="cg" id="catGrid">
      ${catCardsHtml}
    </div>
    <div class="no-results" id="noResults" style="display:none">
      <div class="nr-emoji">🔍</div>
      <h3>No categories found</h3>
      <p>Try a different search term</p>
    </div>
  </div>

  <!-- CTA -->
  <div class="cta">
    <h2>Explore 116,000+ AI Tools</h2>
    <p>Find the perfect AI tool for your needs</p>
    <a href="/">Browse All AI Tools &rarr;</a>
  </div>

</div>

<!-- Back to Top -->
<button class="back-top" id="backTop" onclick="window.scrollTo({top:0,behavior:'smooth'})">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
</button>

<script>
(function(){
  var searchInput = document.getElementById('searchInput');
  var majorGrid = document.getElementById('majorGrid');
  var catGrid = document.getElementById('catGrid');
  var noResults = document.getElementById('noResults');
  var backTop = document.getElementById('backTop');

  // Search filter
  searchInput.addEventListener('input', function(){
    var q = this.value.trim().toLowerCase();
    var majorCards = majorGrid.querySelectorAll('.mc');
    var catCards = catGrid.querySelectorAll('.cc');
    var anyMajor = false;
    var anyCat = false;

    for(var i=0;i<majorCards.length;i++){
      var name = majorCards[i].getAttribute('data-name') || '';
      var text = majorCards[i].textContent.toLowerCase();
      var show = !q || name.indexOf(q) >= 0 || text.indexOf(q) >= 0;
      majorCards[i].style.display = show ? '' : 'none';
      if(show) anyMajor = true;
    }

    for(var i=0;i<catCards.length;i++){
      var name = catCards[i].getAttribute('data-name') || '';
      var text = catCards[i].textContent.toLowerCase();
      var show = !q || name.indexOf(q) >= 0 || text.indexOf(q) >= 0;
      catCards[i].style.display = show ? '' : 'none';
      if(show) anyCat = true;
    }

    noResults.style.display = (!q || anyMajor || anyCat) ? 'none' : '';
  });

  // Back to top visibility
  window.addEventListener('scroll', function(){
    if(window.scrollY > 400) backTop.classList.add('show');
    else backTop.classList.remove('show');
  });
})();
</script>
</body></html>`, {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=3600" },
        });
      },
    },
  },
});
