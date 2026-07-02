import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, GitCompare, Loader2, Sparkles, Trophy, X, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compareTools } from "@/lib/ai-research.functions";

type Tool = { n: string; d: string; c: string; g: string; p: string; u: string };

type CompareResult = {
  verdict: string;
  winner: string;
  tools: Array<{
    name: string;
    summary: string;
    bestFor: string;
    pricing: string;
    pros: string[];
    cons: string[];
    rating: number;
  }>;
};

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare AI Tools — MarkBook" },
      { name: "description", content: "Pick 2–4 AI tools and get an AI-researched side-by-side comparison with pros, cons, and a clear winner." },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const [allTools, setAllTools] = useState<Tool[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompareResult | null>(null);

  const runCompare = useServerFn(compareTools);

  // Phase 1: Instant load from lightweight tools-api.json
  useEffect(() => {
    fetch("/tools-api.json")
      .then((r) => r.json())
      .then((d: { topTools: Tool[] }) => {
        if (d.topTools?.length > 0) {
          setAllTools(d.topTools);
        }
      })
      .catch(() => {});
  }, []);

  // Phase 2: Load more tools from search-api when user starts searching
  useEffect(() => {
    if (!search.trim()) return; // Don't fetch until user types
    fetch(`/search-api.json?limit=200&q=${encodeURIComponent(search)}`)
      .then((r) => r.json())
      .then((d: { results: Tool[] }) => {
        if (d.results?.length > 0) {
          setAllTools((prev) => {
            const existingNames = new Set(prev.map(t => t.n));
            const newTools = d.results.filter(t => !existingNames.has(t.n));
            return [...prev, ...newTools].slice(0, 200);
          });
        }
      })
      .catch(() => {});
  }, [search]);

  const matches = useMemo(() => {
    if (!search.trim()) return allTools.slice(0, 12);
    const q = search.toLowerCase();
    return allTools.filter((t) => t.n.toLowerCase().includes(q)).slice(0, 20);
  }, [allTools, search]);

  function toggle(name: string) {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : prev.length >= 4 ? prev : [...prev, name],
    );
  }

  async function onCompare() {
    if (selected.length < 2) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const out = await runCompare({ data: { tools: selected, context: context.trim() || undefined } });
      setResult(out as CompareResult);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Comparison failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-4 px-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/"><ArrowLeft className="size-4" /> Back</Link>
          </Button>
          <div className="flex items-center gap-2">
            <GitCompare className="size-5 text-primary" />
            <h1 className="text-lg font-bold">Compare AI Tools</h1>
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              <Sparkles className="size-3" /> AI Powered
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1100px] px-4 py-6">
        {/* Selection */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-bold mb-1">Pick 2 to 4 tools</h2>
          <p className="text-xs text-muted-foreground mb-3">
            AI will research each tool and produce a side-by-side comparison with a clear winner.
          </p>

          {/* Selected chips */}
          <div className="mb-3 flex flex-wrap gap-2 min-h-[2rem]">
            {selected.length === 0 && (
              <span className="text-xs text-muted-foreground italic">No tools selected yet</span>
            )}
            {selected.map((n) => (
              <span key={n} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {n}
                <button onClick={() => toggle(n)} aria-label={`Remove ${n}`}><X className="size-3" /></button>
              </span>
            ))}
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools to add… (e.g. ChatGPT, Claude, Midjourney)"
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />

          <div className="mt-3 grid gap-1.5 max-h-64 overflow-y-auto">
            {matches.map((t) => {
              const isOn = selected.includes(t.n);
              const disabled = !isOn && selected.length >= 4;
              return (
                <button
                  key={t.n}
                  onClick={() => toggle(t.n)}
                  disabled={disabled}
                  className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    isOn ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <span className="min-w-0">
                    <span className="font-medium">{t.n}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{t.c}</span>
                  </span>
                  {isOn ? <Check className="size-4 text-primary shrink-0" /> : <Plus className="size-4 text-muted-foreground shrink-0" />}
                </button>
              );
            })}
          </div>

          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Optional: what are you trying to do? (e.g. 'writing marketing copy for a small team')"
            rows={2}
            className="mt-3 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />

          <Button
            onClick={onCompare}
            disabled={selected.length < 2 || loading}
            className="mt-3 w-full"
          >
            {loading ? (
              <><Loader2 className="size-4 animate-spin" /> Researching {selected.length} tools…</>
            ) : (
              <><Sparkles className="size-4" /> Compare with AI ({selected.length}/4 selected)</>
            )}
          </Button>

          {error && (
            <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className="mt-6 space-y-5">
            {/* Verdict */}
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 dark:border-amber-900/50 dark:from-amber-950/40 dark:to-orange-950/40">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="size-5 text-amber-500" />
                <h3 className="text-sm font-bold">AI Verdict — Winner: {result.winner}</h3>
              </div>
              <p className="text-sm">{result.verdict}</p>
            </div>

            {/* Cards grid */}
            <div className={`grid gap-4 ${result.tools.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-" + result.tools.length}`}>
              {result.tools.map((t) => {
                const isWinner = t.name === result.winner;
                return (
                  <div
                    key={t.name}
                    className={`rounded-xl border p-4 ${isWinner ? "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20" : "border-border bg-card"}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold">{t.name}</h4>
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                        {t.rating.toFixed(1)}/10
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{t.summary}</p>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="font-semibold">Best for:</span> {t.bestFor}
                      </div>
                      <div>
                        <span className="font-semibold">Pricing:</span> {t.pricing}
                      </div>
                      <div>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">Pros</span>
                        <ul className="mt-1 ml-4 list-disc space-y-0.5 text-muted-foreground">
                          {t.pros.map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                      </div>
                      <div>
                        <span className="font-semibold text-rose-600 dark:text-rose-400">Cons</span>
                        <ul className="mt-1 ml-4 list-disc space-y-0.5 text-muted-foreground">
                          {t.cons.map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[10px] text-muted-foreground text-center">
              AI-generated comparison. Always verify pricing and capabilities on the tool's official site.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
