/**
 * Computes the single source of truth for TavBook's tool count.
 * Mirrors the dedup logic in src/lib/catalog-server.ts (getDedupedTools).
 * Output: public/catalog-stats.json
 */
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");

const parts = [0, 1, 2].map((i) =>
  JSON.parse(fs.readFileSync(path.join(root, `public/ai-catalog-${i}.json`), "utf8")),
);
const raw = [].concat(...parts);

const normName = (n) =>
  (n || "").toLowerCase().trim().replace(/\s+/g, " ").replace(/[^\w\s]/g, "");
const rootDomain = (u) => {
  if (!u) return "";
  try {
    let d = new URL(u).hostname.toLowerCase();
    return d.startsWith("www.") ? d.slice(4) : d;
  } catch {
    return String(u).toLowerCase();
  }
};

const seen = new Map();
for (const t of raw) {
  const keys = [normName(t.n) && `n:${normName(t.n)}`, rootDomain(t.u) && `d:${rootDomain(t.u)}`].filter(Boolean);
  if (keys.some((k) => seen.has(k))) continue;
  for (const k of keys) seen.set(k, t);
}
const unique = new Set(seen.values());
const categories = new Set([...unique].map((t) => t.c)).size;

const stats = {
  rawTotal: raw.length,
  uniqueTotal: unique.size,
  duplicateCandidates: raw.length - unique.size,
  rawCategories: categories,
  generatedAt: new Date().toISOString(),
};
fs.writeFileSync(path.join(root, "public/catalog-stats.json"), JSON.stringify(stats, null, 2));
console.log(stats);
