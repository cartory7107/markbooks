import { createServerFn } from "@tanstack/react-start";

/**
 * Public discovery aggregations (collections, companies, model-centric tools).
 * Everything here is derived from the real catalog — no invented entities.
 */

export type DiscoveryTool = {
  name: string;
  slug: string;
  url: string;
  desc: string;
  category: string;
  pricing: string;
};

export type DiscoveryGroup = {
  title: string;
  slug: string;
  subtitle: string;
  total: number;
  tools: DiscoveryTool[];
};

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function rootDomain(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const parts = host.split(".");
    if (parts.length <= 2) return host;
    // Keep three labels for public suffixes like co.uk / com.br / co.in.
    const suffix2 = parts.slice(-2).join(".");
    const MULTI = new Set([
      "co.uk", "org.uk", "ac.uk", "com.au", "com.br", "co.in", "co.jp",
      "co.nz", "com.mx", "com.tr", "co.za", "com.cn", "com.sg",
    ]);
    return MULTI.has(suffix2) ? parts.slice(-3).join(".") : suffix2;
  } catch {
    return "";
  }
}

/** Collections = the largest real categories, each with a ranked sample. */
export const getCollections = createServerFn({ method: "GET" }).handler(async () => {
  const { getCatalog, rankBrowseList, getCategoryEmojis, normalizeCategory } = await import(
    "@/lib/catalog-server"
  );
  const catalog = getCatalog();
  const emojis = getCategoryEmojis();

  const top = Object.entries(catalog.categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 18);

  const groups: DiscoveryGroup[] = top.map(([category, total]) => {
    const pool = rankBrowseList(
      catalog.tools.filter(
        (t) => normalizeCategory(t.c) === category || normalizeCategory(t.g) === category,
      ),
    ).slice(0, 6);
    return {
      title: category,
      slug: slugify(category),
      subtitle: `${emojis[category] ?? ""} ${total.toLocaleString("en-US")} tools indexed`.trim(),
      total,
      tools: pool.map((t) => ({
        name: t.n,
        slug: slugify(t.n),
        url: t.u,
        desc: t.d,
        category: t.c,
        pricing: t.p,
      })),
    };
  });

  return { groups };
});

// Shared hosting/repo platforms are not companies behind a product.
const PLATFORM_DOMAINS = new Set([
  "github.io", "github.com", "gitlab.io", "vercel.app", "netlify.app",
  "streamlit.app", "herokuapp.com", "replit.app", "repl.co", "web.app",
  "firebaseapp.com", "notion.site", "wixsite.com", "wordpress.com",
  "blogspot.com", "pages.dev", "workers.dev", "glitch.me", "gumroad.com",
  "producthunt.com", "apps.apple.com", "play.google.com", "huggingface.co",
]);

/** Companies = real domains that own more than one indexed product. */
export const getCompanies = createServerFn({ method: "GET" }).handler(async () => {
  const { getCatalog, rankBrowseList } = await import("@/lib/catalog-server");
  const catalog = getCatalog();

  const byDomain = new Map<string, typeof catalog.tools>();
  for (const tool of catalog.tools) {
    const domain = rootDomain(tool.u);
    if (!domain || PLATFORM_DOMAINS.has(domain)) continue;
    const bucket = byDomain.get(domain);
    if (bucket) bucket.push(tool);
    else byDomain.set(domain, [tool]);
  }

  const companies = [...byDomain.entries()]
    .filter(([, tools]) => tools.length > 1)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 96)
    .map(([domain, tools]) => {
      const ranked = rankBrowseList(tools);
      return {
        domain,
        name: domain.replace(/\.[a-z.]+$/, "").replace(/(^|[-.])([a-z])/g, (_m, p, c) => p.replace(/[-.]/g, " ") + c.toUpperCase()).trim(),
        total: tools.length,
        categories: [...new Set(tools.map((t) => t.c))].slice(0, 3),
        tools: ranked.slice(0, 4).map((t) => ({
          name: t.n,
          slug: slugify(t.n),
          url: t.u,
          desc: t.d,
          category: t.c,
          pricing: t.p,
        })),
      };
    });

  return { companies };
});

const MODEL_PATTERN =
  /(llm|large language|foundation model|model|gpt|llama|mistral|diffusion|stable diffusion|embedding|transformer)/i;

/** Model-centric tools: real catalog entries whose name/category is model-focused. */
export const getModelTools = createServerFn({ method: "GET" }).handler(async () => {
  const { getCatalog, rankBrowseList } = await import("@/lib/catalog-server");
  const catalog = getCatalog();

  const matched = rankBrowseList(
    catalog.tools.filter(
      (t) => MODEL_PATTERN.test(t.n) || MODEL_PATTERN.test(t.c) || MODEL_PATTERN.test(t.d),
    ),
  );

  return {
    total: matched.length,
    tools: matched.slice(0, 120).map((t) => ({
      name: t.n,
      slug: slugify(t.n),
      url: t.u,
      desc: t.d,
      category: t.c,
      pricing: t.p,
    })) as DiscoveryTool[],
  };
});
