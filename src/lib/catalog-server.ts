/**
 * Server-side catalog loader.
 * JSON data is bundled at build time via Vite imports so it works on
 * Cloudflare Workers (no filesystem access at runtime).
 */
import catalogPart0 from "../../public/ai-catalog-0.json";
import catalogPart1 from "../../public/ai-catalog-1.json";
import catalogPart2 from "../../public/ai-catalog-2.json";
import catalogMeta from "../../public/ai-catalog-meta.json";
const catalogJson = {
  tools: [
    ...(catalogPart0 as unknown as Tool[]),
    ...(catalogPart1 as unknown as Tool[]),
    ...(catalogPart2 as unknown as Tool[]),
  ],
  categories: (catalogMeta as unknown as { categories: Record<string, number> }).categories,
  categoryEmojis: (catalogMeta as unknown as { categoryEmojis: Record<string, string> }).categoryEmojis,
};
import verifiedPoolJson from "../../public/verified-top-pool.json";
import categoryEmojisJson from "../../public/category-emojis.json";
import categoryMapJson from "../../public/category-map.json";

const CATEGORY_MAP = categoryMapJson as unknown as Record<string, string>;

import type { AdminOverlay } from "./admin-overlay.server";
import { applyOverlay } from "./admin-overlay.server";

/** Normalize a raw category to one of ~100 major categories. */
export function normalizeCategory(cat: string): string {
  return CATEGORY_MAP[cat] || "AI Other";
}

export type Tool = {
  n: string;
  d: string;
  c: string;
  g: string;
  p: string;
  u: string;
  fl?: string;
  /** Exclusive flag — set by searchTools for injected exclusive tiles. */
  ex?: boolean;
  /** Trending flag — verified-pool tool that is also viral/popular. */
  tr?: boolean;
  /** Admin-assigned badges: Verified, Exclusive, Trending, Underrated, Super Valuable (+ custom). */
  badges?: string[];
  /** Admin-set positioning (lower = higher rank). Applied globally across listings. */
  pos?: number;
};

/** Canonical premium badges available in the admin panel. Order = display priority. */
export const PREMIUM_BADGES = [
  "Verified",
  "Exclusive",
  "Trending",
  "Underrated",
  "Super Valuable",
] as const;
export type PremiumBadge = (typeof PREMIUM_BADGES)[number];



export type VerifiedTool = { n: string; d: string; c: string; g: string; p: string; u: string; fl?: string };

type CatalogData = {
  tools: Tool[];
  categories: Record<string, number>;
};

export function getCatalog(): CatalogData {
  const raw = catalogJson as unknown as CatalogData;
  // Build normalized category counts
  const cats: Record<string, number> = {};
  for (const t of raw.tools) {
    const nc = normalizeCategory(t.c);
    cats[nc] = (cats[nc] || 0) + 1;
  }
  return { ...raw, categories: cats };
}

export function getVerifiedPool(): VerifiedTool[] {
  return verifiedPoolJson as unknown as VerifiedTool[];
}

export function getCategoryEmojis(): Record<string, string> {
  return categoryEmojisJson as unknown as Record<string, string>;
}

/** Convert a display name into a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Fisher-Yates shuffle — returns a NEW array. */
function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Returns the "homepage bundle": top 20 shuffled verified tools + all categories + emojis + total count.
 * This response is ~10-15 KB instead of 11 MB.
 */
export function getTopToolsBundle(overlay?: AdminOverlay) {
  const catalog = getCatalog();
  const emojis = getCategoryEmojis();
  const verifiedPool = getVerifiedPool();

  const tools = overlay ? applyOverlay(catalog.tools, overlay) : catalog.tools;

  let top20: Tool[] = [];
  let gems: Tool[] = [];

  if (verifiedPool.length > 0 && tools.length > 0) {
    const verifiedNames = new Set(verifiedPool.map((v) => v.n));
    const pool = overlay
      ? (applyOverlay(verifiedPool as Tool[], overlay) as Tool[])
      : (verifiedPool as Tool[]);
    const shuffledPool = shuffle(pool).slice(0, 20);
    const restTools = tools.filter((t) => !verifiedNames.has(t.n));
    top20 = shuffledPool;
    gems = restTools.filter((_, i) => i % 97 === 0).slice(0, 3);
  } else if (tools.length > 0) {
    top20 = shuffle(tools).slice(0, 20);
    gems = tools.filter((_, i) => i % 97 === 0).slice(0, 3);
  }

  return {
    topTools: top20,
    categories: catalog.categories,
    categoryEmojis: emojis,
    totalTools: tools.length,
    gems,
  };
}

/**
 * Domains that are code repos / hosting platforms rather than first-class AI
 * products — pushed to the very bottom of every listing per product rules.
 */
const DEMOTE_DOMAINS = [
  "github.com",
  "github.io",
  "gitlab.com",
  "vercel.app",
  "vercel.com",
  "netlify.app",
  "netlify.com",
  "replit.com",
  "repl.co",
  "glitch.me",
  "codepen.io",
  "codesandbox.io",
  "streamlit.app",
  "modelscope.cn",
  "kaggle.com",
  "colab.research.google.com",
];

function isDemoted(url: string): boolean {
  if (!url) return true;
  const u = url.toLowerCase();
  return DEMOTE_DOMAINS.some((d) => u.includes("//" + d) || u.includes("." + d));
}

/** A tool has "rich" data when it carries a non-trivial description + favicon. */
function isRich(t: Tool): boolean {
  return !!t.fl && (t.d?.length ?? 0) >= 40;
}

/** Tools without a logo/favicon usually mean stale or dead sites. */
function hasLogo(t: Tool): boolean {
  return !!t.fl && t.fl.length > 0;
}

/** Hash a string → stable non-negative int (FNV-1a). */
function hashStr(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Pick a random position 0..4 inside the current 5-tile group such that, when
 * combined with the previous group's pick, no two exclusive tiles end up
 * visually adjacent.
 */
const GROUP_SIZE = 5;
function pickGroupPosition(groupIndex: number, prevPos: number | null, seed: number): number {
  const base = hashStr(`${seed}:${groupIndex}`);
  for (let attempt = 0; attempt < 12; attempt++) {
    const pos = (base + attempt * 7) % GROUP_SIZE;
    if (prevPos === null) return pos;
    // Disallow same column twice in a row (no vertical stacking).
    if (pos === prevPos) continue;
    return pos;
  }
  // Fallback: a safe slot different from prev.
  return prevPos === 0 ? 2 : 0;
}

/**
 * Admin override rank — LOWER is better. Applied as the final stable sort so
 * admin-assigned positioning & badges always take precedence over relevance
 * & tier ordering. Ties preserve prior order (side-by-side placement).
 */
export function adminRankKey(t: Tool): number {
  if (typeof t.pos === "number" && Number.isFinite(t.pos)) {
    // 1..999999 range for positioned tools. Comes first.
    return Math.max(1, Math.min(999999, Math.floor(t.pos)));
  }
  const badges = t.badges || [];
  if (badges.length === 0) return 10_000_000;
  const has = (b: string) => badges.some((x) => x.toLowerCase() === b.toLowerCase());
  let rank = 5_000_000;
  if (has("Verified")) rank = 1_000_000;
  else if (has("Exclusive")) rank = 2_000_000;
  else if (has("Trending")) rank = 3_000_000;
  else if (has("Super Valuable")) rank = 3_500_000;
  else if (has("Underrated")) rank = 4_000_000;
  // More badges → tighter rank (subtract up to 100k)
  rank -= Math.min(5, badges.length) * 20_000;
  return rank;
}

export function adminRankSort(tools: Tool[]): Tool[] {
  return tools.slice().sort((a, b) => adminRankKey(a) - adminRankKey(b));
}



/**
 * Server-side search & filter with relevance scoring, pagination, ranking
 * (verified-first, repos-last) and organic exclusive injection.
 */
export function searchTools(opts: {
  q?: string;
  category?: string;
  pricing?: string;
  sort?: string;
  offset?: number;
  limit?: number;
  overlay?: AdminOverlay;
}) {
  const { q = "", category = "All", pricing = "All", sort = "", offset = 0, limit = 50, overlay } = opts;
  const catalog = getCatalog();
  const exclusivePool = getVerifiedPool();
  const allTools: Tool[] = overlay ? applyOverlay(catalog.tools, overlay) : catalog.tools;

  const term = q.trim().toLowerCase();

  const FREE_PRICINGS = new Set(["Free", "Free Plan", "Free Trial", "Free Credits", "Daily Free", "Monthly Free", "Open Source", "open_source", "freemium"]);
  const PAID_PRICINGS = new Set(["Paid", "Paid Plans", "paid"]);

  function isFree(p: string) { return FREE_PRICINGS.has(p); }
  function isPaid(p: string) { return PAID_PRICINGS.has(p); }
  function matchPricing(p: string) {
    if (pricing === "All") return true;
    if (pricing === "Free") return isFree(p);
    if (pricing === "Paid") return isPaid(p);
    return p === pricing;
  }

  // Verified pool → tiers
  //   exclusiveSet  = top ~8k trending picks (get holographic bg + Exclusive tag)
  //   trendingSet   = remainder of verified pool (get Trending tag only)
  const EXCLUSIVE_CUTOFF = Math.min(8000, exclusivePool.length);
  const exclusiveSet = new Set(
    exclusivePool.slice(0, EXCLUSIVE_CUTOFF).map((e) => e.n.toLowerCase()),
  );
  const trendingSet = new Set(exclusivePool.map((e) => e.n.toLowerCase()));

  // Category-matched exclusive pool for contextual injection
  const categoryExclusives = (category !== "All"
    ? exclusivePool.filter((e) => e.c === category || e.g === category)
    : exclusivePool
  ).slice(0, EXCLUSIVE_CUTOFF);

  const seededShuffle = (arr: typeof exclusivePool, seed: number) => {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.abs((seed * 31 + i * 17) % (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
  const shuffledExclusives = seededShuffle(categoryExclusives, offset);
  let exclusiveIndex = 0;

  let filtered = allTools.filter(
    (tool) =>
      (!term || `${tool.n} ${tool.d} ${tool.c} ${tool.g}`.toLowerCase().includes(term)) &&
      matchPricing(tool.p) &&
      (category === "All" || normalizeCategory(tool.c) === category || normalizeCategory(tool.g) === category || tool.c === category || tool.g === category),
  );

  // Relevance scoring for search queries
  if (term && filtered.length > 1) {
    const score = (name: string) => {
      const n = name.toLowerCase();
      if (n === term) return 0;
      if (n.startsWith(term)) return 1;
      const words = n.split(/[\s\-_.]+/);
      if (words[words.length - 1] === term) return 2;
      if (words.some((w) => w === term)) return 3;
      if (n.includes(term)) return 4;
      return 9;
    };
    filtered = filtered.slice().sort((a, b) => {
      const aScore = score(a.n.toLowerCase());
      const bScore = score(b.n.toLowerCase());
      if (aScore !== bScore) return aScore - bScore;
      return a.n.length - b.n.length;
    });
  } else if (!term && filtered.length > 1) {
    // Browse/filter mode — apply quality ranking:
    //   tier 0: verified + rich data + working (non-repo) link
    //   tier 1: verified
    //   tier 2: rich data
    //   tier 3: everything else
    //   tier 9: repo / hosting domains (GitHub, Vercel…) → bottom
    const tier = (t: Tool) => {
      if (isDemoted(t.u)) return 9;
      if (!hasLogo(t)) return 8; // no logo → likely stale/broken, push down
      const verified = trendingSet.has(t.n.toLowerCase());
      const rich = isRich(t);
      if (verified && rich) return 0;
      if (verified) return 1;
      if (rich) return 2;
      return 3;
    };

    if (sort === "popular") {
      filtered = filtered.slice().sort((a, b) => {
        const ta = tier(a), tb = tier(b);
        if (ta !== tb) return ta - tb;
        return hashStr(a.n) - hashStr(b.n);
      });
    } else if (sort === "new") {
      // newest first, but still keep repos at bottom & verified above unverified
      filtered = filtered.slice().reverse().sort((a, b) => tier(a) - tier(b));
    } else {
      // default ("today" / "latest"): tier-rank, then free-first, then stable
      filtered = filtered.slice().sort((a, b) => {
        const ta = tier(a), tb = tier(b);
        if (ta !== tb) return ta - tb;
        const fa = isFree(a.p) ? 0 : 1;
        const fb = isFree(b.p) ? 0 : 1;
        return fa - fb;
      });
    }
  }

  // Never return blank results — if search yields nothing, show popular tools
  if (filtered.length === 0 && term) {
    const words = term.split(/\s+/).filter(w => w.length > 2);
    if (words.length > 0) {
      // Try each word individually for partial matches
      for (const w of words) {
        const partials = allTools.filter(
          (tool) => `${tool.n} ${tool.d} ${tool.c} ${tool.g}`.toLowerCase().includes(w.toLowerCase().slice(0, -1)) || `${tool.n} ${tool.d} ${tool.c} ${tool.g}`.toLowerCase().includes(w.toLowerCase())
        );
        if (partials.length > 0) {
          filtered = partials.slice(0, limit);
          break;
        }
      }
    }
    // If still nothing, return top popular tools
    if (filtered.length === 0) {
      filtered = allTools
        .filter((t) => !isDemoted(t.u))
        .slice(0, limit)
        .map((t) => ({ ...t, tr: trendingSet.has(t.n.toLowerCase()) }));
    }
  }

  // ADMIN OVERRIDE — always wins. Applied as a final stable sort so it beats
  // relevance/tier ordering. Uses:
  //   1. explicit `pos` (lower = higher; ties preserve original order = side-by-side)
  //   2. Verified badge → top
  //   3. Exclusive badge → second
  //   4. more badges = higher
  filtered = adminRankSort(filtered);

  const total = filtered.length;


  // Get the page of results, then mark trending tags on every tile.
  let results: Tool[] = filtered.slice(offset, offset + limit).map((t) => {
    const key = t.n.toLowerCase();
    if (trendingSet.has(key)) return { ...t, tr: true };
    return t;
  });

  // Inject exclusive tiles — 1 per 5-tile group, random position per group.
  // Browsing mode only. Starts from the VERY FIRST position (no skipping).
  if (!term && results.length > 0) {
    const resultNames = new Set(results.map((r) => r.n.toLowerCase()));
    const injected: Tool[] = [];
    let prevPos: number | null = null;
    let groupIdx = 0;

    for (let i = 0; i < results.length; i += GROUP_SIZE) {
      const group = results.slice(i, i + GROUP_SIZE);
      const pos = pickGroupPosition(groupIdx, prevPos, offset || 1);

      // Find next exclusive that's not already in this page
      let exclusiveTile: Tool | null = null;
      let attempts = 0;
      while (exclusiveIndex < shuffledExclusives.length && attempts < 30) {
        const ex = shuffledExclusives[exclusiveIndex];
        exclusiveIndex++;
        attempts++;
        const key = ex.n.toLowerCase();
        if (!resultNames.has(key) && matchPricing(ex.p) && !isDemoted(ex.u)) {
          exclusiveTile = { ...(ex as Tool), ex: true, tr: exclusiveSet.has(key) };
          resultNames.add(key);
          break;
        }
      }

      if (exclusiveTile && pos < group.length) {
        // Replace the slot at `pos` with the exclusive in-place.
        group[pos] = exclusiveTile;
        prevPos = pos;
      } else {
        prevPos = null;
      }

      injected.push(...group);
      groupIdx++;
    }
    results = injected;
  }

  return { results, total };
}

/**
 * Standalone ranking helper used by the SSR category page so it follows the
 * same verified-first, repos-last rules as the homepage.
 */
export function rankBrowseList(tools: Tool[]): Tool[] {
  const verified = new Set(getVerifiedPool().map((v) => v.n.toLowerCase()));
  const FREE = new Set(["Free", "Free Plan", "Free Trial", "Free Credits", "Daily Free", "Monthly Free", "Open Source", "open_source", "freemium"]);
  const tier = (t: Tool) => {
    if (isDemoted(t.u)) return 9;
    if (!hasLogo(t)) return 8;
    const v = verified.has(t.n.toLowerCase());
    const rich = isRich(t);
    if (v && rich) return 0;
    if (v) return 1;
    if (rich) return 2;
    return 3;
  };
  return tools.slice().sort((a, b) => {
    const ta = tier(a), tb = tier(b);
    if (ta !== tb) return ta - tb;
    const fa = FREE.has(a.p) ? 0 : 1;
    const fb = FREE.has(b.p) ? 0 : 1;
    return fa - fb;
  });
}

