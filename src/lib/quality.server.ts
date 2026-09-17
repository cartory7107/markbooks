/**
 * Chapter 06 — Data quality & indexability engine.
 *
 * Every listing is scored on the signals search engines actually care about:
 * a real reachable domain, a usable name, a description with substance, and a
 * meaningful category. The score decides one of three tiers:
 *
 *   - "index"   → full page, allowed in the sitemap and indexable
 *   - "thin"    → page still works for visitors, but noindex,follow so it
 *                 never dilutes the site with near-empty content
 *   - "exclude" → junk / spam / unusable link: noindex,nofollow and never
 *                 listed in a sitemap
 */

import type { Tool } from "@/lib/catalog-server";
import { normalizeCategory, slugify } from "@/lib/catalog-server";

export type QualityTier = "index" | "thin" | "exclude";

export interface QualityReport {
  score: number;
  tier: QualityTier;
  /** Short machine-readable reasons, useful for admin reporting. */
  reasons: string[];
}

/**
 * Hosts that are never a standalone AI product page: model repos, code hosts,
 * link shorteners, and domain-parking / for-sale registrars.
 */
export const NON_PRODUCT_HOSTS = [
  "huggingface.co",
  "github.com",
  "github.io",
  "gitlab.com",
  "bitbucket.org",
  "colab.research.google.com",
  "replit.com",
  "notion.site",
  "bit.ly",
  "t.co",
  "tinyurl.com",
  "linktr.ee",
  "godaddy.com",
  "afternic.com",
  "dan.com",
  "sedo.com",
  "namecheap.com",
  "hugedomains.com",
  "bodis.com",
  "parkingcrew.net",
  "squadhelp.com",
  "brandbucket.com",
  "undeveloped.com",
  "porkbun.com",
];

/** Words that mark a name/description as spam or placeholder junk. */
const SPAM_PATTERNS = [
  /\bfor sale\b/i,
  /\bdomain (is )?(for sale|parked)\b/i,
  /\bbuy this domain\b/i,
  /\bcoming soon\b/i,
  /\bunder construction\b/i,
  /\blorem ipsum\b/i,
  /\b(free )?(porn|casino|xxx|escort|viagra)\b/i,
  /\btest\s*tool\b/i,
  /^(untitled|unknown|n\/a|none|null|undefined)$/i,
];

const GENERIC_CATEGORIES = new Set(["AI Other", "Other", "Uncategorized", ""]);

export function hostOf(url: string): string {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    return u.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function isNonProductHost(h: string): boolean {
  return NON_PRODUCT_HOSTS.some((d) => h === d || h.endsWith(`.${d}`));
}

/** Score a single listing. Deterministic — same input always same tier. */
export function scoreTool(tool: Tool): QualityReport {
  const reasons: string[] = [];
  let score = 0;

  const name = (tool.n || "").trim();
  const desc = (tool.d || "").trim();
  const host = hostOf(tool.u || "");
  const slug = slugify(name);

  // ── Hard disqualifiers ──
  if (!name || !slug) return { score: 0, tier: "exclude", reasons: ["missing-name"] };
  if (!host || !host.includes(".")) {
    return { score: 0, tier: "exclude", reasons: ["invalid-url"] };
  }
  if (isNonProductHost(host)) {
    return { score: 0, tier: "exclude", reasons: ["non-product-host"] };
  }
  if (SPAM_PATTERNS.some((re) => re.test(name) || re.test(desc))) {
    return { score: 0, tier: "exclude", reasons: ["spam-content"] };
  }
  if (name.length < 2 || name.length > 90) {
    return { score: 0, tier: "exclude", reasons: ["bad-name-length"] };
  }

  // ── Positive signals ──
  score += 30; // valid, product-looking link
  if (/^https:/i.test(tool.u)) {
    score += 10;
  } else {
    reasons.push("no-https");
  }

  const words = desc.split(/\s+/).filter(Boolean).length;
  if (words >= 18) score += 30;
  else if (words >= 10) score += 20;
  else if (words >= 5) score += 10;
  else reasons.push("thin-description");

  const cat = normalizeCategory(tool.c || "");
  if (!GENERIC_CATEGORIES.has(cat)) score += 15;
  else reasons.push("generic-category");

  if (tool.p && tool.p.trim()) score += 5;
  else reasons.push("no-pricing");

  if (tool.g && tool.g.trim() && tool.g !== tool.c) score += 5;

  const badges = tool.badges || [];
  if (badges.length > 0) score += 5;

  // Description that just repeats the name adds nothing for search.
  if (desc && desc.toLowerCase().replace(/[^a-z0-9]/g, "") === name.toLowerCase().replace(/[^a-z0-9]/g, "")) {
    score -= 20;
    reasons.push("description-equals-name");
  }

  score = Math.max(0, Math.min(100, score));
  const tier: QualityTier = score >= 60 ? "index" : "thin";
  if (tier === "thin") reasons.push("below-index-threshold");

  return { score, tier, reasons };
}

/** Convenience: the robots directive a tool page should send. */
export function robotsFor(tool: Tool, quarantined: boolean): string {
  if (quarantined) return "noindex,nofollow";
  const { tier } = scoreTool(tool);
  if (tier === "exclude") return "noindex,nofollow";
  if (tier === "thin") return "noindex,follow";
  return "index,follow";
}

export interface QualitySummary {
  total: number;
  index: number;
  thin: number;
  exclude: number;
  duplicates: number;
  averageScore: number;
  topReasons: Array<{ reason: string; count: number }>;
}

/** Whole-catalogue health summary for the admin dashboard. */
export function summarizeQuality(tools: Tool[]): QualitySummary {
  const counts = { index: 0, thin: 0, exclude: 0 };
  const reasonCounts = new Map<string, number>();
  const seen = new Set<string>();
  let duplicates = 0;
  let scoreSum = 0;

  for (const t of tools) {
    const slug = slugify(t.n || "");
    if (slug) {
      if (seen.has(slug)) duplicates++;
      else seen.add(slug);
    }
    const r = scoreTool(t);
    counts[r.tier]++;
    scoreSum += r.score;
    for (const reason of r.reasons) {
      reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
    }
  }

  const topReasons = [...reasonCounts.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  return {
    total: tools.length,
    index: counts.index,
    thin: counts.thin,
    exclude: counts.exclude,
    duplicates,
    averageScore: tools.length ? Math.round((scoreSum / tools.length) * 10) / 10 : 0,
    topReasons,
  };
}
