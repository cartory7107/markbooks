import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, LayoutGrid, List, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAJOR_CATEGORIES, type MajorCategory } from "@/lib/category-map";

type CatalogData = {
  categories: Record<string, number>;
  categoryEmojis: Record<string, string>;
};

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "All AI Tool Categories — 100+ Categories | MarkBook AI Directory" },
      {
        name: "description",
        content:
          "Explore 100+ AI tool categories on MarkBook. Browse 116,000+ AI tools across chatbots, image generators, video editors, code assistants, and more.",
      },
    ],
  }),
  component: CategoriesPage,
});

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function CategoriesPage() {
  const [catalog, setCatalog] = useState<CatalogData>({ categories: {}, categoryEmojis: {} });
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grouped" | "all">("grouped");

  useEffect(() => {
    fetch("/tools-api.json")
      .then((r) => r.json())
      .then((d) => {
        const catEmojis: Record<string, string> = d.categoryEmojis || {};
        const catCounts: Record<string, number> = d.categories || {};
        setCatalog({ categories: catCounts, categoryEmojis: catEmojis });
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const totalCount = useMemo(
    () => Object.values(catalog.categories).reduce((a, b) => a + b, 0),
    [catalog.categories]
  );
  const catCount = useMemo(() => Object.keys(catalog.categories).length, [catalog.categories]);

  // Group categories into major categories
  const grouped = useMemo(() => {
    const result: Array<MajorCategory & { count: number; subCategories: string[] }> = [];
    for (const mc of MAJOR_CATEGORIES) {
      const subs: string[] = [];
      let count = 0;
      for (const [cat, cnt] of Object.entries(catalog.categories)) {
        const majorName = getMajorForCat(cat);
        if (majorName === mc.name) {
          subs.push(cat);
          count += cnt;
        }
      }
      if (count > 0) {
        result.push({ ...mc, count, subCategories: subs });
      }
    }
    // Sort by count descending
    result.sort((a, b) => b.count - a.count);
    return result;
  }, [catalog.categories]);

  // Sorted individual categories
  const sortedCategories = useMemo(
    () => Object.entries(catalog.categories).sort((a, b) => b[1] - a[1]),
    [catalog.categories]
  );

  // Filtered results
  const filteredGrouped = useMemo(
    () =>
      query.trim()
        ? grouped.filter(
            (g) =>
              g.name.toLowerCase().includes(query.toLowerCase()) ||
              g.description.toLowerCase().includes(query.toLowerCase()) ||
              g.subCategories.some((s) => s.toLowerCase().includes(query.toLowerCase()))
          )
        : grouped,
    [grouped, query]
  );

  const filteredCategories = useMemo(
    () =>
      query.trim()
        ? sortedCategories.filter(([name]) => name.toLowerCase().includes(query.toLowerCase()))
        : sortedCategories,
    [sortedCategories, query]
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-4 px-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="size-4" /> Back
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <LayoutGrid className="size-5 text-primary" />
            <h1 className="text-lg font-bold">All Categories</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative max-w-xs flex-1 sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search categories..."
                className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-4 py-6">
        {/* Stats Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-8 rounded-2xl border border-border bg-card p-5">
          <div className="text-center">
            <div className="text-3xl font-extrabold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              {loaded ? totalCount.toLocaleString() : "---"}+
            </div>
            <div className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">AI Tools</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              {loaded ? catCount : "---"}+
            </div>
            <div className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Categories</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">Daily</div>
            <div className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Updates</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">Free</div>
            <div className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Available</div>
          </div>
        </div>

        {/* View Toggle Tabs */}
        <div className="mb-5 flex items-center justify-center gap-2">
          <button
            onClick={() => setView("grouped")}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              view === "grouped"
                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-purple-500/20"
                : "border border-border bg-card text-muted-foreground hover:border-primary hover:text-foreground"
            }`}
          >
            <LayoutGrid className="size-4" />
            Major ({filteredGrouped.length})
          </button>
          <button
            onClick={() => setView("all")}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              view === "all"
                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-purple-500/20"
                : "border border-border bg-card text-muted-foreground hover:border-primary hover:text-foreground"
            }`}
          >
            <List className="size-4" />
            All ({filteredCategories.length})
          </button>
        </div>

        {/* Loading skeleton */}
        {!loaded && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="size-14 rounded-xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                    <div className="h-5 w-20 rounded-full bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Grouped View */}
        {loaded && view === "grouped" && (
          <>
            {filteredGrouped.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredGrouped.map((g) => (
                  <Link
                    key={g.name}
                    to="/category/$slug"
                    params={{ slug: slugify(g.name) }}
                    className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
                  >
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 transition-all duration-200 group-hover:from-indigo-500/[0.04] group-hover:to-purple-500/[0.04]" />
                    <div className="relative flex items-start gap-4">
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-muted text-3xl">
                        {g.emoji}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold">{g.name}</h3>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {g.subCategories.slice(0, 4).join(", ")}
                          {g.subCategories.length > 4 && ` +${g.subCategories.length - 4} more`}
                        </p>
                        <span className="mt-2 inline-flex items-center rounded-full bg-purple-500/10 px-2.5 py-1 text-[11px] font-bold text-purple-500">
                          {g.count.toLocaleString()} tools
                        </span>
                      </div>
                      <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground/50 transition-all duration-200 group-hover:text-primary group-hover:translate-x-1" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <div className="text-5xl">🔍</div>
                <h3 className="text-lg font-bold">No categories found</h3>
                <p className="text-sm text-muted-foreground">Try a different search term</p>
              </div>
            )}
          </>
        )}

        {/* All Categories View */}
        {loaded && view === "all" && (
          <>
            {filteredCategories.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredCategories.map(([name, count]) => {
                  const emoji = catalog.categoryEmojis?.[name] || "🤖";
                  return (
                    <Link
                      key={name}
                      to="/category/$slug"
                      params={{ slug: slugify(name) }}
                      className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-all duration-200 hover:border-primary hover:bg-primary/5"
                    >
                      <span className="text-xl">{emoji}</span>
                      <span className="flex-1 truncate text-sm font-medium">{name}</span>
                      <span className="shrink-0 rounded-lg bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        {count.toLocaleString()}
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 transition-all group-hover:text-primary group-hover:translate-x-0.5" />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <div className="text-5xl">🔍</div>
                <h3 className="text-lg font-bold">No categories found</h3>
                <p className="text-sm text-muted-foreground">Try a different search term</p>
              </div>
            )}
          </>
        )}

        {/* CTA */}
        <div className="mt-12 rounded-2xl border border-border bg-card py-10 text-center">
          <h2 className="text-xl font-bold">Explore 116,000+ AI Tools</h2>
          <p className="mt-2 text-sm text-muted-foreground">Find the perfect AI tool for your needs</p>
          <Button asChild className="mt-4">
            <Link to="/">Browse All AI Tools</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Simple mapping to match raw categories to major categories (client-side). */
const KEYWORD_MAP: Array<[string[], string]> = [
  [["chatbot", "chat bot", "assistant", "character", "girlfriend", "boyfriend", "roleplay", "dating", "joke", "rizz", "pickup", "dialogue"], "AI Chatbot"],
  [["image generator", "art generator", "text to image", "text-to-image", "ai image", "ai art", "ai painting", "poster generator", "banner generator", "thumbnail maker", "sticker generator", "avatar generator", "headshot generator", "disney"], "AI Image Generator"],
  [["photo editor", "photo enhancer", "background remover", "image upscaler", "watermark remover", "object remover", "unblur", "face swap", "colorize", "photo restoration", "inpainting", "qr code"], "AI Photo Editor"],
  [["video generator", "text to video", "text-to-video", "animated video", "script to video", "lip sync"], "AI Video Generator"],
  [["video editor", "video enhancer", "video summarizer", "video upscaler"], "AI Video Editor"],
  [["code generator", "code assistant", "developer tools", "code review", "app builder", "website builder", "api", "no-code", "low-code", "nocode"], "AI Code Assistant"],
  [["writing", "writer", "copywriting", "paraphras", "grammar", "story generator", "text generator", "caption generator", "blog generator", "essay writer", "rewriter", "proofreading", "script writing", "novel", "poem generator", "slogan", "prompt generator", "repurpose", "reply", "ad copy", "bio generator"], "AI Writing"],
  [["music generator", "music production", "vocal remover", "song generator", "lyrics generator", "text-to-music", "beat generator", "rap generator", "podcast"], "AI Music Generator"],
  [["voice generator", "text-to-speech", "voice changer", "transcription", "speech-to-text", "voice cloning", "dubbing", "voice over"], "AI Voice Generator"],
  [["graphic design", "design generator", "logo generator", "infographic generator", "ux design", "font generator", "color palette", "mockup generator"], "AI Design"],
  [["3d model", "text to 3d", "image to 3d"], "AI 3D Model"],
  [["search engine", "search tool"], "AI Search Engine"],
  [["marketing", "seo", "ad generator", "advertising", "pitch deck"], "AI Marketing"],
  [["social media", "influencer", "youtube", "instagram", "tweet", "twitter", "tiktok", "facebook", "meme generator", "hashtag", "linkedin"], "AI Social Media"],
  [["education", "course", "homework", "flashcard", "math", "language learning", "quiz", "knowledge graph"], "AI Education"],
  [["healthcare", "medical", "therapist", "mental health", "health"], "AI Healthcare"],
  [["finance", "investing", "trading", "accounting", "crypto", "stock", "tax"], "AI Finance"],
  [["productivity", "automation", "workflow", "scheduling", "calendar", "task management", "copilot", "agent"], "AI Productivity"],
  [["crm", "project management", "recruiting", "interview", "call center", "business name", "company name"], "AI Business"],
  [["translate", "translation", "image translator", "video translator", "voice translator"], "AI Translation"],
  [["legal", "contract review", "contract management"], "AI Legal"],
  [["real estate", "interior design", "landscape generator", "room planner", "floor plan", "outfit generator"], "AI Real Estate"],
  [["data analytics", "spreadsheet", "excel", "charting", "report generator", "diagram generator"], "AI Data & Analytics"],
  [["game", "minecraft", "poker", "sports"], "AI Gaming"],
  [["fashion"], "AI Fashion"],
  [["presentation", "ppt", "whiteboard"], "AI Presentation"],
  [["resume", "jobs", "job description"], "AI Resume & Career"],
  [["shopify", "product description", "shopping", "gift ideas"], "AI E-commerce"],
  [["email assistant", "email writer", "email generator", "email marketing"], "AI Email"],
  [["pdf", "document", "forms", "word", "scanner", "ocr"], "AI PDF & Documents"],
  [["image recognition", "face recognition", "image to prompt"], "AI Image Recognition"],
  [["audio editing", "noise cancellation", "stem splitting"], "AI Audio Editing"],
  [["content detector", "detector", "humanizer", "bypasser", "plagiarism"], "AI Content Detection"],
  [["research tool", "research papers"], "AI Research"],
  [["trip planner", "travel"], "AI Travel"],
  [["recipe", "cooking", "nutrition", "food"], "AI Food & Cooking"],
  [["fitness", "workout"], "AI Sports & Fitness"],
  [["entertainment", "news", "dream interpreter", "pet", "parenting"], "AI Entertainment"],
  [["large language model", "llm", "open source model", "ai model"], "AI Models & LLMs"],
  [["security", "privacy", "compliance"], "AI Security"],
  [["agriculture", "farming", "crop"], "AI Agriculture"],
  [["architecture"], "AI Architecture"],
  [["customer"], "AI Customer Support"],
  [["religion", "bible", "quran"], "AI Religion & Spirituality"],
  [["web3", "nft", "blockchain"], "AI Web3 & Blockchain"],
  [["robot"], "AI Robotics"],
];

const _cache = new Map<string, string>();

function getMajorForCat(cat: string): string {
  const cached = _cache.get(cat);
  if (cached) return cached;
  const lower = cat.toLowerCase().replace(/^free\s+/i, "").trim();
  for (const [patterns, parent] of KEYWORD_MAP) {
    for (const pattern of patterns) {
      if (lower.includes(pattern)) {
        _cache.set(cat, parent);
        return parent;
      }
    }
  }
  _cache.set(cat, "Other");
  return "Other";
}
