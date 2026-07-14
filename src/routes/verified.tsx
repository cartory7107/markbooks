import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  BadgeCheck,
  ExternalLink,
  Loader2,
  Search,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getVerifiedTools } from "@/lib/verified.functions";

type Tool = {
  n: string;
  d: string;
  c: string;
  g: string;
  p: string;
  u: string;
  fl?: string;
  badges?: string[];
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function getToolColor(name: string) {
  const colors = [
    "from-sky-500 to-blue-600",
    "from-indigo-500 to-purple-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-violet-500 to-fuchsia-600",
    "from-rose-500 to-pink-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/verified")({
  head: () => ({
    meta: [
      { title: "Verified AI Tools — MarkBook" },
      {
        name: "description",
        content:
          "Browse AI tools that have been hand-verified by the MarkBook editorial team. Every link is tested, every description is reviewed.",
      },
      { property: "og:title", content: "Verified AI Tools — MarkBook" },
      {
        property: "og:description",
        content:
          "Hand-verified AI tools. Every link tested, every description reviewed by the MarkBook team.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VerifiedPage,
});

function VerifiedPage() {
  const [allTools, setAllTools] = useState<Tool[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const fetchVerified = useServerFn(getVerifiedTools);

  const load = useMemo(
    () => () => {
      setLoading(true);
      fetchVerified({})
        .then((data) => {
          setAllTools(data.tools);
          setTotal(data.total);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    },
    [fetchVerified],
  );

  useEffect(() => {
    load();
  }, [load]);

  // Realtime: whenever any admin edit lands, refresh the verified list
  // so newly-verified tools appear instantly (and unverified drop out).
  useEffect(() => {
    let cancelled = false;
    let debounce: ReturnType<typeof setTimeout> | null = null;
    const trigger = () => {
      if (cancelled) return;
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => load(), 400);
    };
    const channel = supabase
      .channel("verified-admin-edits")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_tool_edits" },
        trigger,
      )
      .subscribe();
    return () => {
      cancelled = true;
      if (debounce) clearTimeout(debounce);
      supabase.removeChannel(channel);
    };
  }, [load]);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of allTools) {
      const cat = t.c || "Other";
      map.set(cat, (map.get(cat) || 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [allTools]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allTools.filter((t) => {
      const matchesQuery =
        !q ||
        t.n.toLowerCase().includes(q) ||
        t.d.toLowerCase().includes(q) ||
        t.c.toLowerCase().includes(q);
      const matchesCategory = category === "All" || t.c === category;
      return matchesQuery && matchesCategory;
    });
  }, [allTools, query, category]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-4 px-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="size-4" /> Back
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="size-5 text-sky-500" />
            <h1 className="text-lg font-bold">Verified AI Tools</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-8">
        <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-500/10 to-blue-500/5 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="grid size-12 shrink-0 place-items-center rounded-full bg-sky-500/20 ring-2 ring-sky-500/50">
              <BadgeCheck className="size-7 text-sky-500" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Hand-verified by MarkBook</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Every tool on this page has been checked by our editorial team. Links are live, descriptions are accurate, and the product actually exists.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium text-sky-600 dark:text-sky-400">
            <span className="rounded-full bg-sky-500/10 px-3 py-1">
              {total.toLocaleString()} verified tools
            </span>
            <span className="rounded-full bg-sky-500/10 px-3 py-1">Live link tested</span>
            <span className="rounded-full bg-sky-500/10 px-3 py-1">Editorial review</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search verified tools..."
              className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-4 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-11 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-sky-500"
          >
            <option value="All">All categories</option>
            {categories.map(([cat, count]) => (
              <option key={cat} value={cat}>
                {cat} ({count})
              </option>
            ))}
          </select>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Showing {filtered.length.toLocaleString()} of {total.toLocaleString()} verified tools
        </p>

        {loading ? (
          <div className="mt-12 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            <span className="text-sm">Loading verified tools...</span>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((tool) => (
              <VerifiedToolCard key={tool.n + tool.u} tool={tool} />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="mt-12 text-center text-muted-foreground">
            <p className="text-sm">No verified tools match your filters.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setQuery("");
                setCategory("All");
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

function VerifiedToolCard({ tool }: { tool: Tool }) {
  const domain = extractDomain(tool.u);
  const gradient = getToolColor(tool.n);

  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <span
          className={`grid size-11 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${gradient} font-bold text-white shadow-sm text-xs`}
        >
          {initials(tool.n)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-bold">{tool.n}</h3>
            <span title="Verified">
              <BadgeCheck className="size-4 shrink-0 text-sky-500" />
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{tool.d}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {tool.c}
        </span>
        <span className="rounded-md bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-600 dark:text-sky-400">
          {tool.p}
        </span>
      </div>

      <div className="mt-auto pt-3 flex items-center justify-between gap-2">
        <span className="truncate text-[10px] text-muted-foreground">{domain}</span>
        <a href={tool.u} target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
            <ExternalLink className="size-3" />
            Visit
          </Button>
        </a>
      </div>
    </div>
  );
}
