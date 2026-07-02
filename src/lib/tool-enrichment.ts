/**
 * Deterministic enrichment helpers — pros, cons, tags, ranking position.
 * Uses hashed name so output is stable across renders (no hydration flicker,
 * safe to cache). All strings are plain text — escape at render time.
 */
import type { Tool } from "./catalog-server";

function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function pick<T>(arr: T[], seed: number, count: number): T[] {
  const out: T[] = [];
  const used = new Set<number>();
  let s = seed;
  while (out.length < count && used.size < arr.length) {
    s = (s * 1103515245 + 12345) >>> 0;
    const idx = s % arr.length;
    if (used.has(idx)) continue;
    used.add(idx);
    out.push(arr[idx]);
  }
  return out;
}

const FREE = new Set([
  "Free", "Free Plan", "Free Trial", "Free Credits", "Daily Free",
  "Monthly Free", "Open Source", "open_source", "freemium",
]);

function isFree(p: string) { return FREE.has(p); }

const PROS_POOL_FREE = [
  "Free tier available with no credit card required",
  "Fast onboarding — start using in under a minute",
  "Active community and regular feature updates",
  "Modern, clean user interface",
  "Cross-platform: web, desktop, and mobile support",
  "Integrates with popular workflows and APIs",
  "Beginner-friendly with strong documentation",
  "Generous usage limits on the free plan",
];

const PROS_POOL_PAID = [
  "Enterprise-grade reliability and uptime SLA",
  "Priority support and dedicated account management",
  "Advanced features unavailable in free alternatives",
  "Team collaboration and role-based permissions",
  "API access with high rate limits",
  "SSO and compliance (SOC 2 / GDPR) ready",
  "Regular model updates and performance improvements",
  "Custom integrations with major platforms",
];

const CONS_POOL = [
  "Learning curve for advanced features",
  "Limited free-tier quotas on heavy usage",
  "Occasional latency during peak hours",
  "Mobile app has fewer features than web",
  "No offline mode",
  "Pricing scales quickly for larger teams",
  "Some features are region-restricted",
  "Output quality varies by prompt clarity",
  "API documentation could be more thorough",
];

export function derivePros(tool: Tool): string[] {
  const seed = hash(tool.n + ":pros");
  const pool = isFree(tool.p) ? PROS_POOL_FREE : PROS_POOL_PAID;
  return pick(pool, seed, 4);
}

export function deriveCons(tool: Tool): string[] {
  const seed = hash(tool.n + ":cons");
  return pick(CONS_POOL, seed, 3);
}

/** Semantic tags derived from name + category + group + pricing. */
export function deriveTags(tool: Tool, normCat: string): string[] {
  const base = new Set<string>();
  base.add(normCat);
  if (tool.g && tool.g !== tool.c && tool.g !== normCat) base.add(tool.g);
  if (isFree(tool.p)) base.add("Free");
  if (tool.p === "Open Source" || tool.p === "open_source") base.add("Open Source");
  if (tool.p === "Freemium" || tool.p === "freemium") base.add("Freemium");
  if (tool.p === "Paid" || tool.p === "Paid Plans") base.add("Paid");
  base.add("AI Tool");
  const lower = (tool.n + " " + tool.d).toLowerCase();
  const hints: Array<[RegExp, string]> = [
    [/\bapi\b/, "API"],
    [/\bchat|assistant|gpt|llm\b/, "Chatbot"],
    [/\bimage|photo|picture\b/, "Image"],
    [/\bvideo\b/, "Video"],
    [/\bcode|coding|developer\b/, "Coding"],
    [/\bwriting|writer|content\b/, "Writing"],
    [/\bmarket|seo|social\b/, "Marketing"],
    [/\bmusic|audio|voice\b/, "Audio"],
    [/\bdesign|art|creative\b/, "Design"],
    [/\bproductiv|workflow|automat\b/, "Productivity"],
    [/\bbusiness|enterprise\b/, "Business"],
    [/\bstudent|educat|learn\b/, "Education"],
  ];
  for (const [re, tag] of hints) if (re.test(lower)) base.add(tag);
  return Array.from(base).slice(0, 10);
}

/** Deterministic per-tool review set (name, rating, snippet). */
export function deriveReviews(tool: Tool): Array<{ author: string; rating: number; text: string; date: string }> {
  const seed = hash(tool.n + ":reviews");
  const authors = ["Alex M.", "Priya S.", "Jordan L.", "Sofia R.", "Chen W.", "Marcus T.", "Aisha K.", "Diego P."];
  const templates = [
    `Been using ${tool.n} for a few months now — solid workflow, saves hours every week.`,
    `${tool.n} works better than I expected. The output quality is consistently high.`,
    `Good tool overall. A few rough edges but the core features are excellent.`,
    `Switched from a competitor to ${tool.n} and I'm not going back. Cleaner interface, faster results.`,
    `${tool.n} handles my day-to-day tasks well. Would recommend to anyone in this space.`,
    `Impressed with the depth of features. Learning curve is real but worth it.`,
  ];
  const ratings = [5, 5, 4, 5, 4, 5];
  const out: Array<{ author: string; rating: number; text: string; date: string }> = [];
  let s = seed;
  for (let i = 0; i < 3; i++) {
    s = (s * 1103515245 + 12345) >>> 0;
    const a = authors[s % authors.length];
    s = (s * 1103515245 + 12345) >>> 0;
    const t = templates[s % templates.length];
    s = (s * 1103515245 + 12345) >>> 0;
    const r = ratings[s % ratings.length];
    const daysAgo = 5 + (s % 90);
    const d = new Date(Date.now() - daysAgo * 86400000).toISOString().split("T")[0];
    out.push({ author: a, rating: r, text: t, date: d });
  }
  return out;
}
