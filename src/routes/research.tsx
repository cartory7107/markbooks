import { createFileRoute, Link } from "@tanstack/react-router";
import { getCatalog, slugify } from "@/lib/catalog-server";
import { createServerFn } from "@tanstack/react-start";

const BASE_URL = "https://markbook.top";

const getResearchSnapshot = createServerFn({ method: "GET" }).handler(() => {
  const catalog = getCatalog();
  const categories = Object.entries(catalog.categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 24)
    .map(([name, count]) => ({ name, count, slug: slugify(name) }));
  return {
    totalTools: catalog.tools.length,
    totalCategories: Object.keys(catalog.categories).length,
    topCategories: categories,
  };
});

export const Route = createFileRoute("/research")({
  loader: () => getResearchSnapshot(),
  head: ({ loaderData }) => ({
    meta: [
      { title: "AI Research Hub — Trends, Data & Reports | Markbook AI" },
      {
        name: "description",
        content: `Markbook's AI research hub tracks ${loaderData?.totalTools?.toLocaleString?.() ?? "116,000+"} AI tools across ${loaderData?.totalCategories ?? 500}+ categories. Explore trends, category leaders, and independent research on the AI industry.`,
      },
      { property: "og:title", content: "AI Research Hub — Markbook AI" },
      { property: "og:description", content: "Independent research and data on the AI tools industry from Markbook's 116,000+ verified directory." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${BASE_URL}/research` },
    ],
    links: [{ rel: "canonical", href: `${BASE_URL}/research` }],
  }),
  component: ResearchPage,
});

function ResearchPage() {
  const { totalTools, totalCategories, topCategories } = Route.useLoaderData() as {
    totalTools: number;
    totalCategories: number;
    topCategories: { name: string; count: number; slug: string }[];
  };
  return (
    <div
      className="min-h-screen text-foreground"
      style={{
        backgroundColor: "#ffffff",
        backgroundImage:
          "linear-gradient(to right, rgba(15,23,42,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.06) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    >
      <div className="mx-auto max-w-5xl px-4 py-16">
        <nav className="mb-8 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">/</span>
          <span>Research</span>
        </nav>
        <header className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Markbook AI Research Hub</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Independent research and data on the AI tools industry — powered by the world's largest
            verified AI directory.
          </p>
        </header>

        <div className="mb-12 grid gap-4 sm:grid-cols-3">
          <Stat label="Verified AI tools" value={totalTools.toLocaleString()} />
          <Stat label="Categories tracked" value={`${totalCategories}+`} />
          <Stat label="Updated" value="Daily" />
        </div>

        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-semibold">Top AI categories by tool count</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {topCategories.map((c) => (
              <Link
                key={c.slug}
                to="/rankings/$slug"
                params={{ slug: `best-${c.slug}` }}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 hover:border-primary/50"
              >
                <span className="font-medium">{c.name}</span>
                <span className="text-sm text-muted-foreground">{c.count.toLocaleString()} tools</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold">Reading list</h2>
          <ul className="mt-4 space-y-2">
            <li><Link to="/blog/$slug" params={{ slug: "best-ai-tools-2026" }} className="text-primary hover:underline">Best AI Tools in 2026: The Complete Directory</Link></li>
            <li><Link to="/compare" className="text-primary hover:underline">Head-to-head AI tool comparisons</Link></li>
            <li><Link to="/rankings" className="text-primary hover:underline">Category rankings and leaderboards</Link></li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="text-3xl font-bold">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
