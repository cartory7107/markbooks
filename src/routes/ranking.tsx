import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Crown,
  ExternalLink,
  Filter,
  GitCompare,
  Loader2,
  Medal,
  Search,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { aiRankTools } from "@/lib/ai-research.functions";

type Tool = { n: string; d: string; c: string; g: string; p: string; u: string; v?: number; fl?: string };
type Catalog = { tools: Tool[]; categories: Record<string, number> };

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

function getToolColor(name: string) {
  const colors = [
    "from-indigo-500 to-purple-600",
    "from-pink-500 to-rose-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-blue-500 to-cyan-600",
    "from-violet-500 to-fuchsia-600",
    "from-sky-500 to-indigo-600",
    "from-red-500 to-pink-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function extractDomain(url: string): string | null {
  try {
    const u = new URL(url);
    return u.hostname;
  } catch {
    return null;
  }
}

// Shared logo cache for ranking page (0 = TavBook-hosted logo, -1 = initials fallback)
const logoCache = new Map<string, number>();

function RankingToolIcon({ name, url, size = "sm" }: { name: string; url?: string; size?: "sm" | "lg" }) {
  const gradient = getToolColor(name);
  const domain = url ? extractDomain(url) : null;
  const cacheKey = domain || "";
  const cached = cacheKey ? logoCache.get(cacheKey) : undefined;

  const [stage, setStage] = useState<number>(cached !== undefined ? cached : domain ? 0 : -1);
  const [loaded, setLoaded] = useState(false);

  const getLogoSrc = useCallback((dom: string, s: number): string | null => {
    if (s === 0) return `/api/public/logo/${encodeURIComponent(dom)}`;
    return null;
  }, []);

  const handleError = useCallback(() => {
    if (cacheKey) logoCache.set(cacheKey, -1);
    setStage(-1);
  }, [cacheKey]);


  const handleLoad = useCallback(() => {
    if (cacheKey) logoCache.set(cacheKey, stage);
    setLoaded(true);
  }, [stage, cacheKey]);

  const sizeClass = size === "lg" ? "size-14" : "size-8";
  const textSize = size === "lg" ? "text-lg" : "text-[9px]";
  const currentSrc = domain ? getLogoSrc(domain, stage) : null;

  // All sources failed or no domain — show gradient initials (original design)
  if (stage === -1 || !currentSrc) {
    return (
      <span
        className={`grid shrink-0 place-items-center rounded-lg bg-gradient-to-br ${gradient} font-bold text-white shadow-sm ${sizeClass} ${textSize}`}
      >
        {initials(name)}
      </span>
    );
  }

  // Show logo inside a clean square matching original design
  const pxSize = size === "sm" ? 32 : size === "lg" ? 56 : 40;
  return (
    <span
      className="shrink-0 overflow-hidden rounded-lg bg-white dark:bg-zinc-800 shadow-sm"
      style={{ display: "inline-flex", position: "relative", width: pxSize, height: pxSize }}
    >
      {/* Gradient initials placeholder — visible while image loads */}
      <span
        className={`absolute inset-0 grid place-items-center bg-gradient-to-br ${gradient} font-bold text-white transition-opacity duration-200 ${textSize} ${
          loaded ? "opacity-0" : "opacity-100"
        }`}
      >
        {initials(name)}
      </span>
      {/* Real logo image — fills the square cleanly */}
      <img
        src={currentSrc}
        alt={name}
        width={pxSize}
        height={pxSize}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
        className="absolute inset-0 z-10 size-full object-contain p-[3px]"
      />
    </span>
  );
}

export const Route = createFileRoute("/ranking")({
  head: () => ({
    meta: [
      { title: "AI Tools Ranking — TavBook" },
      { name: "description", content: "See the top-ranked AI tools on TavBook." },
      { property: "og:url", content: "https://tavbook.top/ranking" },
    ],
    links: [{ rel: "canonical", href: "https://tavbook.top/ranking" }],
  }),
  component: RankingPage,
});

function RankingPage() {
  const [catalog, setCatalog] = useState<Catalog>({ tools: [], categories: {} });
  const [query, setQuery] = useState("");
  const [pricing, setPricing] = useState("All");

  const [rankingLoading, setRankingLoading] = useState(false);

  // AI verdict state
  type AiRank = {
    topic: string;
    summary: string;
    ranking: Array<{ rank: number; name: string; reason: string; strengths: string[]; bestFor: string }>;
  };
  const [aiTopic, setAiTopic] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AiRank | null>(null);
  const runAiRank = useServerFn(aiRankTools);

  async function onAiRank() {
    const topic = aiTopic.trim() || query.trim() || "best AI tools overall";
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    try {
      const out = await runAiRank({
        data: { topic, candidates: catalog.tools.slice(0, 20).map((t) => t.n) },
      });
      setAiResult(out as AiRank);
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : "AI ranking failed.");
    } finally {
      setAiLoading(false);
    }
  }


  // Phase 1: Instant load from lightweight tools-api.json (~10KB, 20 tools)
  useEffect(() => {
    setRankingLoading(true);
    fetch(`/tools-api.json`)
      .then((r) => r.json())
      .then((d: { topTools: Tool[] }) => {
        if (d.topTools?.length > 0) {
          setCatalog((prev) => prev.tools.length === 0 ? { tools: d.topTools, categories: {} } : prev);
        }
        setRankingLoading(false);
      })
      .catch(() => setRankingLoading(false));
  }, []);

  // Phase 2: Enhanced load from search-api.json for filtering/searching (runs after mount + when filters change)
  const [initialLoaded, setInitialLoaded] = useState(false);
  useEffect(() => {
    if (!initialLoaded) return; // Skip on first render — Phase 1 handles that
    setRankingLoading(true);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (pricing !== "All") params.set("pricing", pricing);
    params.set("sort", "popular");
    params.set("limit", "50");

    // Short timeout: fallback to tools-api if search-api is slow
    const timeout = setTimeout(() => {
      fetch(`/tools-api.json`)
        .then((r) => r.json())
        .then((d: { topTools: Tool[] }) => {
          if (d.topTools?.length > 0) {
            setCatalog({ tools: d.topTools, categories: {} });
          }
          setRankingLoading(false);
        })
        .catch(() => setRankingLoading(false));
    }, 3000);

    fetch(`/search-api.json?${params}`)
      .then((r) => r.json())
      .then((d: { results: Tool[]; total: number }) => {
        clearTimeout(timeout);
        if (d.results?.length > 0) {
          setCatalog({ tools: d.results, categories: {} });
        }
        setRankingLoading(false);
      })
      .catch(() => {
        clearTimeout(timeout);
        setRankingLoading(false);
      });
  }, [query, pricing, initialLoaded]);

  // Mark initial load complete after first data arrives
  useEffect(() => {
    if (catalog.tools.length > 0 && !initialLoaded) setInitialLoaded(true);
  }, [catalog.tools, initialLoaded]);

  const results = catalog.tools.slice(0, 50);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-4 px-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/"><ArrowLeft className="size-4" /> Back</Link>
          </Button>
          <div className="flex items-center gap-2">
            <Trophy className="size-5 text-amber-500" />
            <h1 className="text-lg font-bold">AI Tools Ranking</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/compare"><GitCompare className="size-4" /> Compare</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-4 py-6">
        {/* AI Verdict Panel */}
        <div className="mb-6 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-purple-500/5 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="size-4 text-primary" />
            <h2 className="text-sm font-bold">Ask AI: which tool is actually the best?</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">Live research</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            AI researches current capabilities, pricing, and reputation — then gives you an honest ranked verdict.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="e.g. best AI for writing code, image generation, video editing…"
              className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <Button onClick={onAiRank} disabled={aiLoading} className="shrink-0">
              {aiLoading ? (
                <><Loader2 className="size-4 animate-spin" /> Researching…</>
              ) : (
                <><Sparkles className="size-4" /> Get AI verdict</>
              )}
            </Button>
          </div>
          {aiError && (
            <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{aiError}</p>
          )}
          {aiResult && (
            <div className="mt-4 rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-3 italic">{aiResult.summary}</p>
              <ol className="space-y-3">
                {aiResult.ranking.map((r) => (
                  <li key={r.rank} className="flex gap-3">
                    <span className={`grid size-7 shrink-0 place-items-center rounded-md text-xs font-bold ${
                      r.rank === 1 ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" :
                      r.rank <= 3 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>{r.rank}</span>
                    <div className="min-w-0">
                      <div className="font-bold text-sm">{r.name}</div>
                      <p className="text-xs text-muted-foreground mt-0.5">{r.reason}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {r.strengths.map((s, i) => (
                          <span key={i} className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">{s}</span>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1"><span className="font-semibold">Best for:</span> {r.bestFor}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-[10px] text-muted-foreground">AI-generated. Verify on the tool's official site before deciding.</p>
            </div>
          )}
        </div>

        {/* Loading State */}
        {rankingLoading && (
          <div className="mb-6 flex flex-col items-center gap-4 py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
            <p className="text-sm font-medium text-muted-foreground">Loading top AI tools…</p>
          </div>
        )}

        {/* Top 3 Podium */}
        {!rankingLoading && results.length > 0 && (
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {results.slice(0, 3).map((tool, i) => {
            const medals = [
              { icon: Crown, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950", label: "#1" },
              { icon: Medal, color: "text-slate-400", bg: "bg-slate-50 dark:bg-slate-900", label: "#2" },
              { icon: Medal, color: "text-amber-700", bg: "bg-orange-50 dark:bg-orange-950", label: "#3" },
            ];
            const m = medals[i];
            return (
              <div
                key={tool.n}
                className={`relative overflow-hidden rounded-2xl border border-border ${m.bg} p-6 text-center`}
              >
                <m.icon className={`mx-auto size-8 ${m.color}`} />
                <span className={`mt-1 block text-2xl font-extrabold ${m.color}`}>{m.label}</span>
                <span className="mx-auto my-3">
                  <RankingToolIcon name={tool.n} url={tool.u} size="lg" />
                </span>
                <h3 className="font-bold">{tool.n}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{tool.c}</p>
                <span className="mt-2 inline-block rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {tool.p}
                </span>
              </div>
            );
          })}
        </div>
        )}

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter ranking..."
              className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="size-4 text-muted-foreground" />
            {["All", "Free", "Free Plan", "Paid", "Paid Plans"].map((item) => (
              <button
                key={item}
                onClick={() => setPricing(item)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                  pricing === item
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Ranking Table */}
        {!rankingLoading && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Tool</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground sm:table-cell">Category</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground md:table-cell">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Pricing</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">🌐 Visit</th>
              </tr>
            </thead>
            <tbody>
              {results.map((tool, i) => (
                <tr key={`${tool.n}-${i}`} className="border-b border-border transition-colors hover:bg-accent/50">
                  <td className="px-4 py-3">
                    <span className={`flex size-7 place-items-center justify-center rounded-md text-xs font-bold ${
                      i < 3 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <RankingToolIcon name={tool.n} url={tool.u} size="sm" />
                      <span className="font-medium text-sm">{tool.n}</span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {tool.c}
                    </span>
                  </td>
                  <td className="hidden max-w-xs truncate px-4 py-3 text-sm text-muted-foreground md:table-cell">
                    {tool.d}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold text-white shadow-sm ${
                      tool.p === "Free" || tool.p === "Free Plan" || tool.p === "Free Trial" || tool.p === "Free Credits" || tool.p === "Daily Free" || tool.p === "Monthly Free"
                        ? "bg-gradient-to-r from-emerald-500 to-green-500"
                        : tool.p === "Paid" || tool.p === "Paid Plans"
                          ? "bg-gradient-to-r from-amber-500 to-orange-500"
                          : "bg-gradient-to-r from-blue-500 to-indigo-500"
                    }`}>
                      {tool.p === "Free" ? "🟢 Free" : tool.p === "Paid" || tool.p === "Paid Plans" ? "💰 " + tool.p : tool.p}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" className="text-xs" asChild>
                      <a href={tool.u} target="_blank" rel="noopener noreferrer">
                        🌐 Visit <ExternalLink className="size-3" />
                      </a>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

        {/* Empty state */}
        {!rankingLoading && results.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Trophy className="size-10 text-muted-foreground" />
            <h3 className="text-lg font-bold">No tools found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}
