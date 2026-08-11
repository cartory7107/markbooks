import { SITE_URL, OG_IMAGE } from "@/lib/site";
import { TOTAL_TOOLS_LABEL, TOTAL_TOOLS_SHORT } from "@/lib/tool-count";
import { getSocialMeta, baseLikes } from "@/lib/social-meta";

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef, useCallback, memo } from "react";
import {
  ArrowRight,
  Bot,
  BadgeCheck,
  Bookmark,
  ChevronDown,
  ChevronRight,
  Code2,
  Compass,
  ExternalLink,
  Filter,
  Flame,
  Flag,
  Globe,
  Image,
  LogIn,
  LogOut,
  Menu,
  Moon,
  MoreVertical,
  Newspaper,
  Plus,
  Search,
  Send,
  Star,
  Sun,
  ThumbsDown,
  ThumbsUp,
  Trophy,
  TrendingUp,
  User,
  Video,
  WandSparkles,
  X,
  Zap,
  MessageSquare,
  Heart,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/tavbook-symbol.png.asset.json";
import { supabase } from "@/integrations/supabase/client";

type Tool = {
  n: string;
  d: string;
  c: string;
  g: string;
  p: string;
  u: string;
  fl?: string;
  /** Exclusive tile — render with holographic background. */
  ex?: boolean;
  /** Trending tag (verified-pool tool). */
  tr?: boolean;
  /** Admin-assigned premium badges. */
  badges?: string[];
  /** Admin-set positioning (lower = higher rank). */
  pos?: number;
};



const PRICING_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  Free: { bg: "bg-gradient-to-r from-emerald-500 to-green-500", text: "text-white", label: "\uD83C\uDFE2 Free" },
  "Free Plan": { bg: "bg-gradient-to-r from-green-500 to-emerald-500", text: "text-white", label: "\uD83D\uDC8E Free Plan" },
  "Free Trial": { bg: "bg-gradient-to-r from-sky-500 to-blue-500", text: "text-white", label: "\uD83C\uDF1F Free Trial" },
  "Free Credits": { bg: "bg-gradient-to-r from-violet-500 to-purple-500", text: "text-white", label: "\uD83C\uDFC6 Free Credits" },
  "Daily Free": { bg: "bg-gradient-to-r from-cyan-500 to-teal-500", text: "text-white", label: "\u2B50 Daily Free" },
  "Monthly Free": { bg: "bg-gradient-to-r from-teal-500 to-cyan-500", text: "text-white", label: "\uD83D\uDCC5 Monthly Free" },
  Paid: { bg: "bg-gradient-to-r from-amber-500 to-orange-500", text: "text-white", label: "\uD83D\uDCB0 Paid" },
  "Paid Plans": { bg: "bg-gradient-to-r from-orange-500 to-red-500", text: "text-white", label: "\uD83D\uDD25 Paid Plans" },
  "Open Source": { bg: "bg-gradient-to-r from-blue-500 to-indigo-500", text: "text-white", label: "\uD83D\uDCDA Open Source" },
  unknown: { bg: "bg-gradient-to-r from-zinc-400 to-zinc-500", text: "text-white", label: "\u2753 Unknown" },
  Unknown: { bg: "bg-gradient-to-r from-zinc-400 to-zinc-500", text: "text-white", label: "\u2753 Unknown" },
  freemium: { bg: "bg-gradient-to-r from-indigo-500 to-violet-500", text: "text-white", label: "\uD83C\uDFAF Freemium" },
};
type Catalog = {
  tools: Tool[];
  categories: Record<string, number>;
  categoryEmojis: Record<string, string>;
};



const topNavItems = [
  { label: "Verified", icon: "✅", href: "/verified" },
  { label: "Free Tools", icon: "🆓", action: "free" },
  { label: "Categories", icon: "📂", action: "categories" },
  { label: "Ranking", icon: "🏆", href: "/ranking" },
  { label: "Compare", icon: "⚖️", href: "/compare" },
  { label: "Blog", icon: "📝", href: "/blog" },
  { label: "Pricing", icon: "💎", href: "/pricing" },
  { label: "Contact", icon: "📬", href: "/contact" },
  { label: "Latest AI", icon: "⚡", action: "latest" },
  { label: "AI News", icon: "📰", action: "news" },
  { label: "Submit", icon: "➕", href: "/submit" },
  { label: "Advertise", icon: "📢", href: "/advertise" },
];

// ── Featured (sidebar) picks ──
interface FeaturedPick { name: string; url: string; tagline: string; rating: number }

const ZENITH_FEATURED: FeaturedPick = {
  name: "Zenith AI",
  url: "/?q=Zenith%20AI",
  tagline: "All-in-one AI workspace — chat, research and content in one place.",
  rating: 5.0,
};

const UNDERRATED_FEATURED: FeaturedPick[] = [
  { name: "Napkin AI", url: "https://www.napkin.ai", tagline: "Turns plain text into clean diagrams and visuals instantly.", rating: 4.9 },
  { name: "Krea AI", url: "https://www.krea.ai", tagline: "Real-time AI image generation and upscaling canvas.", rating: 4.8 },
  { name: "Recraft", url: "https://www.recraft.ai", tagline: "Vector-first AI design tool for icons, logos and illustrations.", rating: 4.8 },
  { name: "Elicit", url: "https://elicit.com", tagline: "AI research assistant that reads and summarises papers.", rating: 4.9 },
  { name: "Gamma", url: "https://gamma.app", tagline: "Generate polished decks, docs and sites from a prompt.", rating: 4.8 },
  { name: "Fathom", url: "https://fathom.video", tagline: "Free AI notetaker that records and summarises meetings.", rating: 4.9 },
  { name: "Ideogram", url: "https://ideogram.ai", tagline: "Image generator that actually renders readable text.", rating: 4.7 },
  { name: "tl;dv", url: "https://tldv.io", tagline: "Meeting recorder with AI highlights and CRM sync.", rating: 4.7 },
  { name: "Durable", url: "https://durable.co", tagline: "Builds a full business website in about 30 seconds.", rating: 4.6 },
  { name: "Cleanup.pictures", url: "https://cleanup.pictures", tagline: "Erase objects and people from photos in one click.", rating: 4.7 },
];



function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getToolGradient(name: string) {
  const gradients = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-red-500",
    "from-pink-500 to-rose-600",
    "from-cyan-500 to-blue-600",
    "from-amber-500 to-yellow-500",
    "from-fuchsia-500 to-purple-600",
    "from-lime-500 to-green-600",
    "from-sky-500 to-indigo-500",
    "from-red-500 to-orange-500",
    "from-teal-500 to-cyan-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
}

// Returns raw CSS color string for inline style gradient backgrounds
function getToolGradientColors(name: string) {
  const colorPairs = [
    ["#8b5cf6", "#9333ea"],
    ["#3b82f6", "#4f46e5"],
    ["#10b981", "#0d9488"],
    ["#f97316", "#ef4444"],
    ["#ec4899", "#e11d48"],
    ["#06b6d4", "#2563eb"],
    ["#f59e0b", "#eab308"],
    ["#d946ef", "#9333ea"],
    ["#84cc16", "#16a34a"],
    ["#0ea5e9", "#6366f1"],
    ["#ef4444", "#f97316"],
    ["#14b8a6", "#0891b2"],
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const pair = colorPairs[Math.abs(hash) % colorPairs.length];
  return `${pair[0]}, ${pair[1]}`;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `TavBook — ${TOTAL_TOOLS_LABEL} AI Tools Directory | Discover, Compare & Search the Best AI` },
      {
        name: "description",
        content:
          `TavBook is the world's largest AI tools directory. Search, compare, and discover ${TOTAL_TOOLS_LABEL} AI tools — chatbots, image, video, code, and writing — across 500+ categories.`,
      },
      { property: "og:url", content: SITE_URL },
      { property: "og:title", content: `TavBook — ${TOTAL_TOOLS_LABEL} AI Tools Directory` },
      { property: "og:description", content: `Search and compare ${TOTAL_TOOLS_LABEL} AI tools across 500+ categories on TavBook, the AI discovery platform.` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "TavBook — AI Tools Directory" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": `${SITE_URL}/#webpage`,
          name: `TavBook — ${TOTAL_TOOLS_LABEL} AI Tools Directory`,
          url: SITE_URL,
          description: `TavBook is an AI tools directory and AI discovery platform indexing ${TOTAL_TOOLS_LABEL} AI tools across 500+ categories.`,
          isPartOf: { "@id": `${SITE_URL}/#website` },
          about: { "@id": `${SITE_URL}/#organization` },
          primaryImageOfPage: { "@type": "ImageObject", url: OG_IMAGE },
        }),
      },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<Catalog>({
    tools: [],
    categories: {},
    categoryEmojis: {},
  });
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [pricing, setPricing] = useState("All");
  const [activeCategory, setActiveCategory] = useState("All");
  const [visible, setVisible] = useState(1000);
  const [totalResults, setTotalResults] = useState(0);
  const [totalTools, setTotalTools] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  // True once the feed has data at least once — after that we never blank the
  // page again; refreshes keep existing cards visible.
  const [feedReady, setFeedReady] = useState(false);
  const [dark, setDark] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [aiNews, setAiNews] = useState<Array<{ title: string; time: string; url?: string; source?: string }>>([]);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [savedTools, setSavedTools] = useState<Set<string>>(new Set());
  const [showSponsor, setShowSponsor] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"today" | "new" | "saved" | "popular">("today");
  const [authUser, setAuthUser] = useState<{ email: string; name?: string } | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [exclusiveTools, setExclusiveTools] = useState<Tool[]>([]);
  const [showVisitorPopup, setShowVisitorPopup] = useState(false);
  const [reportTool, setReportTool] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [recommendTools, setRecommendTools] = useState<Set<string>>(new Set());
  const [reactions, setReactions] = useState<Record<string, { type: "like" | "dislike" | null; emoji: string | null; counts: { like: number; dislike: number } }>>({});
  const [reactionPopup, setReactionPopup] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  // Random seed applied only after hydration (0 on server + first client render)
  // so SSR markup matches and the page never flickers into a different order.
  const [pageSeed, setPageSeed] = useState(0);
  useEffect(() => {
    setPageSeed(Math.random() * 1000);
  }, []);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-scroll to search results when user types
  const scrollToResults = useCallback(() => {
    setTimeout(() => {
      document.getElementById("tools-feed")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setQuery(value);
    setVisible(20);
    // Auto-scroll to results after a brief delay so results render first
    if (value.trim().length > 0) {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        scrollToResults();
      }, 300);
    }
  }, [scrollToResults]);

  // ── Fetch AI news from server endpoint ──
  useEffect(() => {
    fetch("/ai-news-api.json")
      .then((r) => r.json())
      .then((data) => setAiNews(data))
      .catch(() => {});
  }, []);

  // ── New visitor popup: show once ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem("mb-visitor-popup-seen");
    if (!seen) {
      const timer = setTimeout(() => {
        if (!authUser) setShowVisitorPopup(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [authUser]);

  // ── Load lightweight homepage data from server API (~10KB instead of 11MB) ──
  useEffect(() => {
    fetch("/tools-api.json")
      .then((r) => r.json())
      .then((data: { topTools: Tool[]; categories: Record<string, number>; categoryEmojis: Record<string, string>; totalTools: number; gems: Tool[] }) => {
        setCatalog({
          tools: data.topTools,
          categories: data.categories,
          categoryEmojis: data.categoryEmojis,
        });
        setTotalTools(data.totalTools);
        setCatalogLoaded(true);
      })
      .catch(() => setCatalogLoaded(true));
  }, []);

  // ── Load 50 exclusive tools for bottom section ──
  useEffect(() => {
    fetch("/exclusive-api.json")
      .then((r) => r.json())
      .then((data: { exclusives: Tool[] }) => {
        setExclusiveTools(data.exclusives);
      })
      .catch(() => {});
  }, []);

  // ── Server-side search/browsing: triggered when query/category/pricing changes ──
  const [searchOffset, setSearchOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    // Runs in parallel with /tools-api.json (no waterfall): feed data is
    // critical, so it must not wait for the categories/stats payload.
    setSearchLoading(true);
    setSearchOffset(0);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (activeCategory !== "All") params.set("category", activeCategory);
    if (pricing !== "All") params.set("pricing", pricing);
    if (activeFilter && activeFilter !== "saved") params.set("sort", activeFilter);
    params.set("offset", "0");
    params.set("limit", "50");

    let cancelled = false;
    fetch(`/search-api.json?${params}`)
      .then((r) => r.json())
      .then((data: { results: Tool[]; total: number }) => {
        if (cancelled) return;
        // Use search results directly — server already handles ranking + exclusive injection
        setCatalog((prev) => ({
          ...prev,
          tools: data.results,
        }));
        setTotalResults(data.total);
        setFeedReady(true);
        setSearchLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setFeedReady(true);
        setSearchLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query, activeCategory, pricing, activeFilter]);

  // ── Restore scroll position when returning from a tool detail page ──
  useEffect(() => {
    if (!feedReady || searchLoading) return;
    try {
      const saved = sessionStorage.getItem("mb:home:scroll");
      if (saved && catalog.tools.length > 0) {
        const y = parseInt(saved, 10);
        if (!Number.isNaN(y) && y > 0) {
          // Wait for layout to settle, then restore.
          requestAnimationFrame(() => {
            window.scrollTo({ top: y, behavior: "auto" });
            sessionStorage.removeItem("mb:home:scroll");
          });
        } else {
          sessionStorage.removeItem("mb:home:scroll");
        }
      }
    } catch {}
  }, [feedReady, searchLoading, catalog.tools.length]);

  // ── Load more tools from server API ──
  const loadMore = useCallback(() => {
    setLoadingMore(true);
    const newOffset = searchOffset + 50;
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (activeCategory !== "All") params.set("category", activeCategory);
    if (pricing !== "All") params.set("pricing", pricing);
    if (activeFilter && activeFilter !== "saved") params.set("sort", activeFilter);
    params.set("offset", String(newOffset));
    params.set("limit", "50");

    fetch(`/search-api.json?${params}`)
      .then((r) => r.json())
      .then((data: { results: Tool[]; total: number }) => {
        if (data.results.length > 0) {
          setCatalog((prev) => ({ ...prev, tools: [...prev.tools, ...data.results] }));
          setSearchOffset(newOffset);
        }
        setLoadingMore(false);
      })
      .catch(() => setLoadingMore(false));
  }, [query, activeCategory, pricing, activeFilter, searchOffset, catalogLoaded]);

  // Track auth state for navbar login/signup button
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setAuthUser({
          email: data.user.email ?? "",
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split("@")[0],
        });
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuthUser({
          email: session.user.email ?? "",
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split("@")[0],
        });
      } else {
        setAuthUser(null);
      }
    });
    return () => { listener.subscription.unsubscribe(); };
  }, []);

  const handleSignIn = async () => {
    const { lovable } = await import("@/integrations/lovable/index");
    await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setAuthUser(null);
    setShowUserMenu(false);
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const CATEGORY_PRIORITY = [
    "AI Chatbot",
    "AI Girlfriend",
    "AI Code Generator",
    "AI Code Assistant",
    "AI Developer Tools",
    "AI Video Generator",
    "AI Video Editor",
    "AI Image Generator",
    "AI Art Generator",
    "AI Photo Editor",
    "AI 3D Model Generator",
    "Image to 3D Model",
    "Text to 3D",
    "AI Writing",
    "AI Music Generator",
    "AI Voice Generator",
    "AI Search Engine",
    "AI Assistant",
    "AI Character",
    "AI Roleplay",
  ];

  const categories = useMemo(() => {
    const prioritySet = new Set(CATEGORY_PRIORITY);
    const priorityMap = new Map(CATEGORY_PRIORITY.map((c, i) => [c, i]));
    return Object.entries(catalog.categories).sort((a, b) => {
      const aPri = priorityMap.has(a[0]);
      const bPri = priorityMap.has(b[0]);
      if (aPri && bPri) return priorityMap.get(a[0])! - priorityMap.get(b[0])!;
      if (aPri) return -1;
      if (bPri) return 1;
      return b[1] - a[1];
    });
  }, [catalog]);

  // ── Featured picks: Zenith AI is always first, then underrated real tools that
  //    rotate on every page reload ──
  const featuredPicks = useMemo(() => {
    const seed = pageSeed;
    const pool = [...UNDERRATED_FEATURED];
    for (let i = pool.length - 1; i > 0; i--) {
      const x = Math.sin((i + 1) * 45.164 + seed * 91.777) * 43758.5453;
      const j = Math.floor((x - Math.floor(x)) * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return [ZENITH_FEATURED, ...pool.slice(0, 5)];
  }, [pageSeed]);


  // In browsing mode we reshuffle per page load so the feed never looks identical
  // after a reload: lower tools get surfaced, top tools get pushed down.
  const results = useMemo(() => {
    const list = catalog.tools;
    if (query || list.length < 4) return list;

    const seed = pageSeed;
    const rand = (i: number) => {
      const x = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453;
      return x - Math.floor(x);
    };

    // Rotate the whole list so a different slice leads on every reload,
    // then shuffle inside windows of 8 to break predictable ordering.
    const rotate = Math.floor(rand(0) * list.length);
    const rotated = [...list.slice(rotate), ...list.slice(0, rotate)];

    const WINDOW = 8;
    for (let start = 0; start < rotated.length; start += WINDOW) {
      const end = Math.min(start + WINDOW, rotated.length);
      for (let i = end - 1; i > start; i--) {
        const j = start + Math.floor(rand(start + i) * (i - start + 1));
        [rotated[i], rotated[j]] = [rotated[j], rotated[i]];
      }
    }
    return rotated;
  }, [catalog.tools, query, pageSeed]);


  const displayedCount = totalResults > 0 ? totalResults : totalTools;

  // ── Pagination is manual only: tools load when the user clicks "Show more" ──


  const suggestions = searchFocused && query.length > 1 ? results.slice(0, 8) : [];

  const toggleSave = useCallback((name: string) => {
    setSavedTools((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  // Helper to generate ToolCard props for reaction/recommend/report features
  const getReactionProps = useCallback((tool: Tool) => ({
    reactionData: reactions[tool.n] || { type: null as "like" | "dislike" | null, emoji: null as string | null, counts: { like: baseLikes(tool.n), dislike: 0 } },
    onReaction: (_name: string, type: "like" | "dislike", emoji?: string) => {
      setReactions((prev) => {
        const name = tool.n;
        const curr = prev[name] || { type: null, emoji: null, counts: { like: 0, dislike: 0 } };
        if (type === "like" && curr.type === "like") {
          return { ...prev, [name]: { ...curr, type: null, emoji: null, counts: { ...curr.counts, like: Math.max(0, curr.counts.like - 1) } } };
        }
        if (type === "dislike" && curr.type === "dislike") {
          return { ...prev, [name]: { ...curr, type: null, emoji: null, counts: { ...curr.counts, dislike: Math.max(0, curr.counts.dislike - 1) } } };
        }
        const wasLike = curr.type === "like";
        const wasDislike = curr.type === "dislike";
        return { ...prev, [name]: { type, emoji: emoji || null, counts: { like: (curr.counts.like + (type === "like" ? 1 : 0)) - (wasLike ? 1 : 0), dislike: (curr.counts.dislike + (type === "dislike" ? 1 : 0)) - (wasDislike ? 1 : 0) } } };
      });
    },
    onReport: (_name: string) => setReportTool(tool.n),
    onRecommend: (_name: string) => setRecommendTools((prev) => { const next = new Set(prev); if (next.has(tool.n)) next.delete(tool.n); else next.add(tool.n); return next; }),
    isRecommended: recommendTools.has(tool.n),
    showReactionPopup: reactionPopup === tool.n,
    onToggleReactionPopup: (_name: string) => setReactionPopup(reactionPopup === tool.n ? null : tool.n),
  }), [reactions, recommendTools, reactionPopup]);



  return (
    <div ref={topRef} className="min-h-screen bg-background text-foreground moving-grid-bg overflow-x-hidden">
      <div className="relative z-10 max-w-full overflow-x-hidden">
      {/* ─── Sponsored Banner ─── */}
      {showSponsor && (
        <div className="sponsor-glow py-2 text-center text-sm text-white relative">
          <span className="font-medium">🔥 Sponsored by TavBook AI</span>
          <span className="mx-2 opacity-60">—</span>
          <span className="opacity-90">Discover {TOTAL_TOOLS_LABEL} AI tools. Updated daily.</span>
          <button
            onClick={() => setShowSponsor(false)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* ─── Glass Navigation Bar ─── */}
      <header className="glass-nav sticky top-0 z-50 w-full">
        <div className="mx-auto flex h-14 max-w-[1480px] items-center gap-1.5 px-3 sm:gap-2 sm:px-4 lg:h-16 min-w-0">
          {/* Logo */}
          <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="TavBook home">
            <img src={logoAsset.url} alt="TavBook" className="h-8 w-8 object-contain" />
            <span className="text-lg font-extrabold tracking-tight hidden sm:inline">
              Tav<span className="gradient-text">Book</span>
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="ml-2 hidden items-center gap-0.5 xl:flex shrink min-w-0 overflow-hidden">
            {topNavItems.map((item, navIdx) =>
              item.href ? (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`${navIdx >= 6 ? "hidden 2xl:flex" : "flex"} shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1.5 text-[13px] font-medium text-foreground/75 transition-colors hover:bg-accent hover:text-foreground`}
                >
                  <span className="text-sm">{item.icon}</span>
                  {item.label}
                </Link>
              ) : (
                <button
                  key={item.label}
                  onClick={() => {
                    if (item.action === "free") {
                      setPricing(pricing === "Free" ? "All" : "Free");
                      setVisible(20);
                    } else if (item.action === "categories") {
                      navigate({ to: "/categories" });
                    } else if (item.action === "latest") {
                      document.getElementById("tools-feed")?.scrollIntoView({ behavior: "smooth" });
                    } else if (item.action === "news") {
                      if (window.innerWidth < 1024) { document.getElementById("ai-news-section")?.scrollIntoView({ behavior: "smooth" }); } else { window.location.href = "/news"; }
                    }
                  }}
                  className={`${navIdx >= 6 ? "hidden 2xl:flex" : "flex"} shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1.5 text-[13px] font-medium text-foreground/75 transition-colors hover:bg-accent hover:text-foreground`}
                >
                  <span className="text-sm">{item.icon}</span>
                  {item.label}
                </button>
              ),
            )}
          </nav>

          {/* Search */}
          <div className="relative ml-auto hidden w-[200px] shrink-0 md:block lg:w-[260px] 2xl:w-[300px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              placeholder="Search AI tools, e.g. Video Translation..."
              className="h-9 w-full rounded-lg border border-border/60 bg-muted/40 pl-9 pr-10 text-sm outline-none transition focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20"
            />
            <kbd className="absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground xl:block">
              ⌘K
            </kbd>
            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
                {suggestions.map((tool) => (
                  <a
                    key={`${tool.n}-${tool.c}`}
                    href={tool.u}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseDown={() => setQuery(tool.n)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-accent"
                  >
                    <ToolIcon name={tool.n} url={tool.u} small />
                    <span className="min-w-0 flex-1">
                      <b className="block truncate text-sm">{tool.n}</b>
                      <span className="block truncate text-xs text-muted-foreground">{tool.c}</span>
                    </span>
                    <ExternalLink className="size-3 text-muted-foreground" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDark(!dark)}
              aria-label="Toggle theme"
              className="size-9"
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Link
              to="/submit"
              className="hidden items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:flex"
            >
              <Plus className="size-3.5" /> Submit
            </Link>

            {/* Sign In / User Menu */}
            {authUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
                >
                  <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {authUser.name?.[0]?.toUpperCase() || "U"}
                  </span>
                  <span className="hidden max-w-[120px] truncate text-foreground/80 sm:inline">{authUser.name}</span>
                  <ChevronDown className="size-3 text-muted-foreground" />
                </button>
                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
                      <div className="border-b border-border px-4 py-3">
                        <p className="text-sm font-semibold truncate">{authUser.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{authUser.email}</p>
                      </div>
                      <div className="p-1.5">
                        <Link
                          to="/submit"
                          onClick={() => setShowUserMenu(false)}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
                        >
                          <Plus className="size-4" /> Submit AI Tool
                        </Link>
                        {authUser.email === "cartory7107@gmail.com" && (
                          <Link
                            to="/admin"
                            onClick={() => setShowUserMenu(false)}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
                          >
                            <Star className="size-4" /> Admin Panel
                          </Link>
                        )}
                      </div>
                      <div className="border-t border-border p-1.5">
                        <button
                          onClick={handleSignOut}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <LogOut className="size-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignIn}
                className="gap-1.5 text-xs sm:text-sm"
              >
                <LogIn className="size-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 xl:hidden"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              {mobileMenu ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenu && (
          <div className="border-t border-border bg-background p-4 lg:hidden">
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search AI tools..."
                className="h-10 w-full rounded-lg border border-border bg-muted/40 pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {topNavItems.map((item) =>
                item.href ? (
                  <Link
                    key={item.label}
                    to={item.href}
                    onClick={() => setMobileMenu(false)}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium hover:bg-accent active:bg-accent"
                  >
                    <span className="text-sm">{item.icon}</span>
                    {item.label}
                  </Link>
                ) : (
                  <button
                    key={item.label}
                    onClick={() => {
                      if (item.action === "free") { setPricing("Free"); setVisible(20); }
                      else if (item.action === "categories") { navigate({ to: "/categories" }); }
                      else if (item.action === "latest") { document.getElementById("tools-feed")?.scrollIntoView({ behavior: "smooth" }); }
                      else if (item.action === "news") { if (window.innerWidth < 1024) { document.getElementById("ai-news-section")?.scrollIntoView({ behavior: "smooth" }); } else { window.location.href = "/news"; } }
                      setMobileMenu(false);
                    }}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium hover:bg-accent active:bg-accent"
                  >
                    <span className="text-sm">{item.icon}</span>
                    {item.label}
                  </button>
                ),
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <Link
                to="/submit"
                onClick={() => setMobileMenu(false)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                <Plus className="size-3.5" /> Submit
              </Link>
              {authUser ? (
                <button
                  onClick={() => { handleSignOut(); setMobileMenu(false); }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <LogOut className="size-3.5" /> Sign Out
                </button>
              ) : (
                <button
                  onClick={() => { handleSignIn(); setMobileMenu(false); }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  Sign Up | Login
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden border-b border-border bg-white">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
        <div className="relative mx-auto max-w-[1480px] px-4 py-12 text-center sm:py-16 lg:py-20">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">
            🔍 The AI Discovery Engine
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Discover The Best{" "}
            <span className="gradient-text">AI Websites</span>
            <br />
            & Tools
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            {catalogLoaded ? (
              <>
                {TOTAL_TOOLS_LABEL} AI tools and {categories.length} categories in the best AI tools directory.
                Updated daily.
              </>
            ) : (
              <>
                <span className="mb-skeleton" style={{ width: "3ch", display: "inline-block", height: "1.2em", verticalAlign: "text-bottom" }}>&nbsp;</span>{" "}
                AIs and{" "}
                <span className="mb-skeleton" style={{ width: "2ch", display: "inline-block", height: "1.2em", verticalAlign: "text-bottom" }}>&nbsp;</span>{" "}
                categories in the best AI tools directory. Updated daily.
              </>
            )}
          </p>

          {/* Search Bar */}
          <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by AI, e.g Video Translation AI Tool"
                className="h-12 w-full rounded-xl border border-border bg-card pl-12 pr-4 text-base outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15 shadow-sm"
              />
            </div>
            <Button
              variant="brand"
              size="lg"
              onClick={() => {
                if (query) scrollToResults();
              }}
              className="h-12 rounded-xl px-8 shadow-sm"
            >
              <Search className="size-4" /> Search
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="mx-auto mt-8 flex max-w-3xl items-center justify-center gap-6 sm:gap-10">
            {[
              {
                value: catalogLoaded ? TOTAL_TOOLS_SHORT : null,
                label: "AI Tools",
                skeletonWidth: "4ch",
              },
              {
                value: catalogLoaded ? `${categories.length}` : null,
                label: "Categories",
                skeletonWidth: "3ch",
              },
              { value: "Daily", label: "Updates", skeletonWidth: "4ch" },
              { value: "Free", label: "To Use", skeletonWidth: "3ch" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-xl font-extrabold sm:text-2xl">
                  {stat.value !== null ? (
                    stat.value
                  ) : (
                    <span
                      className="mb-skeleton"
                      style={{ width: stat.skeletonWidth, height: "1em", display: "inline-block" }}
                    >
                      &nbsp;
                    </span>
                  )}
                </div>
                <div className="mt-1.5 text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
          {/* Submit AI CTA */}
          <div className="mx-auto mt-6 flex max-w-xl flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <div className="text-center sm:text-left">
              <p className="text-sm font-bold text-foreground">
                🚀 Submit Your Unique AI Tool — Get Featured!
              </p>
              <p className="text-xs text-muted-foreground">
                List your AI on the fastest-growing AI directory
              </p>
            </div>
            <Link
              to="/submit"
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
            >
              Submit Now <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Category Quick Scroll ─── */}
      <div className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-[1480px] items-center gap-2 overflow-x-auto px-4 py-3 category-scroll">
          <span className="shrink-0 text-xs font-semibold text-muted-foreground mr-1">Browse:</span>
          <button
            onClick={() => {
              setActiveCategory("All");
              setVisible(20);
            }}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeCategory === "All"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            All
          </button>
          {catalogLoaded ? (
            <>
              {categories.slice(0, 30).map(([name, count]) => {
                const emoji = catalog.categoryEmojis?.[name] || "🤖";
                return (
                  <button
                    key={name}
                    onClick={() => {
                      setActiveCategory(name);
                      setVisible(20);
                      document.getElementById("tools-feed")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      activeCategory === name
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <span>{emoji}</span>
                    <span className="hidden sm:inline">{name}</span>
                    <span className="sm:hidden">{name.slice(0, 14)}</span>
                    <span className="rounded-full bg-background/20 px-1 py-0.5 text-[10px]">{count}</span>
                  </button>
                );
              })}
              {categories.length > 30 && (
                <Link
                  to="/categories"
                  className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-primary hover:bg-accent"
                >
                  +{categories.length - 30} more
                </Link>
              )}
            </>
          ) : (
            // Skeleton chip placeholders while catalog loads
            Array.from({ length: 8 }).map((_, i) => (
              <span
                key={i}
                className="mb-skeleton shrink-0 rounded-full"
                style={{ width: `${60 + (i % 4) * 24}px`, height: "1.6em", display: "inline-block" }}
                aria-hidden="true"
              >
                &nbsp;
              </span>
            ))
          )}
        </div>
      </div>

      {/* ─── Main Content: 3-Column Layout ─── */}
      <main className="mx-auto grid max-w-[1480px] gap-0 px-4 py-5 lg:grid-cols-[250px_minmax(0,1fr)_280px] lg:px-6">

        {/* ─── Left Sidebar: Featured ─── */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-4">
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="border-b border-border p-3">
                <h2 className="flex items-center gap-2.5 text-sm font-bold">
                  ⭐ Featured
                </h2>
              </div>
              <div className="divide-y divide-border">
                {featuredPicks.map((f, i) => (
                  <a
                    key={f.name}
                    href={f.url}
                    target={f.url.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="flex items-start gap-2.5 px-3 py-2.5 transition-colors hover:bg-accent"
                  >
                    <ToolIcon name={f.name} url={f.url} small />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-semibold">{f.name}</span>
                        {i === 0 && (
                          <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">#1</span>
                        )}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1">
                        <span className="text-[10px] leading-none text-amber-500">★★★★★</span>
                        <span className="text-[10px] leading-none text-muted-foreground">{f.rating.toFixed(1)}</span>
                      </span>
                      <span className="mt-1 block line-clamp-2 text-[10px] leading-3.5 text-muted-foreground">{f.tagline}</span>
                    </span>
                  </a>
                ))}
              </div>
            </div>


            {/* Sponsored placeholder */}
            <div className="overflow-hidden rounded-xl border border-border bg-card p-4">
              <p className="mb-3 text-[10px] uppercase tracking-widest text-muted-foreground">
                💎 Sponsored
              </p>
              <div className="flex min-h-[120px] items-center justify-center rounded-lg border border-dashed border-border">
                <p className="text-center text-xs text-muted-foreground">Ad space available</p>
              </div>
              <Link
                to="/advertise"
                className="mt-3 flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-primary"
              >
                Advertise on TavBook <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>
        </aside>

        {/* Mobile Category Drawer removed — categories now via top scroll only */}

        {/* ─── Center: Tool Feed ─── */}
        <section id="tools-feed" className="min-w-0">

          {/* Filter Tabs */}
          <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
            <div className="flex items-center gap-1">
              <Filter className="size-4 text-muted-foreground mr-1" />
              {["All", "Free", "Free Plan", "Free Trial", "Paid"].map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setPricing(item);
                    setVisible(20);
                  }}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    pricing === item
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="ml-auto hidden items-center gap-1 sm:flex">
              {(["today", "new", "popular"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveFilter(s)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    activeFilter === s
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s === "today" ? "⚡ Latest" : s === "new" ? "✨ New" : "📈 Popular"}
                </button>
              ))}
            </div>
          </div>

          {/* Section Title */}
          <div className="mb-4">
            <h2 className="text-lg font-bold sm:text-xl">
              {query
                ? `Results for "${query}"`
                : activeCategory !== "All"
                  ? `${catalog.categoryEmojis?.[activeCategory] || "🤖"} ${activeCategory}`
                  : "⚡ Latest AI Tools"}
            </h2>
          </div>

          {/* Inline search/refresh indicator — the feed below stays visible */}
          {searchLoading && feedReady && (
            <div className="mb-4 flex items-center justify-center gap-3 rounded-xl border border-primary/20 bg-primary/5 py-4">
              <span className="mb-logo-loader" aria-hidden="true"><img src={logoAsset.url} alt="" /></span>
              <span className="text-sm font-medium text-primary">Searching...</span>
            </div>
          )}

          {/* Tool Cards Grid — skeletons only on the very first load */}
          {!feedReady ? (
            <ToolCardSkeletons />
          ) : results.length ? (
            <div
              className={`flex flex-col gap-3 mb-reveal transition-opacity duration-200 ${searchLoading ? "opacity-60" : "opacity-100"}`}
            >


              {results.map((tool, index) => (
                <ToolCard
                  key={`${tool.n}-${tool.c}-${index}`}
                  tool={tool}
                  saved={savedTools.has(tool.n)}
                  onToggleSave={() => toggleSave(tool.n)}
                  featured={!!tool.ex}
                  trending={!!tool.tr}
                  exclusive={!!tool.ex}
                  {...getReactionProps(tool)}
                />
              ))}
            </div>

          ) : (
            <EmptyState
              onReset={() => {
                setQuery("");
                setPricing("All");
                setActiveCategory("All");
              }}
            />
          )}

          {results.length < displayedCount && (
            <>
              {/* Minimal load-more state: thin progress line + placeholder cards */}
              {loadingMore && (
                <div className="mt-3">
                  <div className="mb-progress-line" aria-hidden="true">
                    <span />
                  </div>
                  <div className="mt-3 opacity-70">
                    <ToolCardSkeletons count={3} />
                  </div>
                </div>
              )}
              <Button
                variant="outline"
                size="lg"
                className="mt-4 w-full"
                onClick={loadMore}
                disabled={loadingMore}
                aria-busy={loadingMore}
              >
                {loadingMore ? (
                  <span className="flex items-center justify-center gap-2.5">
                    <span className="mb-logo-loader" aria-hidden="true">
                      <img src={logoAsset.url} alt="" />
                    </span>
                    <span className="text-sm text-muted-foreground">Loading more tools…</span>
                  </span>
                ) : (
                  <>
                    {`Show more tools (${results.length.toLocaleString()} of ${displayedCount.toLocaleString()})`}{" "}
                    <ChevronRight className="size-4" />
                  </>
                )}
              </Button>
            </>
          )}


          {/* ─── Hidden Gems Section ─── */}
          {!query && activeCategory === "All" && (
            <section className="mt-10">
              <div className="mb-4 flex items-center gap-2">
                <Star className="size-5 text-amber-500" />
                <h2 className="text-lg font-bold">Hidden AI Gems</h2>
                <span className="ml-2 text-xs text-muted-foreground">Underrated, not underpowered</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {catalog.tools
                  .filter((_, i) => i % 97 === 0)
                  .slice(0, 3)
                  .map((tool) => (
                    <article
                      key={tool.n}
                      className="tool-lift rounded-xl border border-border bg-card p-5"
                    >
                      <ToolIcon name={tool.n} url={tool.u} />
                      <h3 className="mt-3 font-bold text-sm">{tool.n}</h3>
                      <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{tool.d}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="rounded-md bg-primary/5 px-2 py-1 text-[10px] font-medium text-primary">
                          {tool.p}
                        </span>
                        {tool.u && tool.u !== "#" && (
                          <a href={tool.u} target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground hover:text-primary">
                            Visit ↗
                          </a>
                        )}
                      </div>
                    </article>
                  ))}
              </div>
            </section>
          )}




          {/* ─── Free AI Collections ─── */}
          {!query && activeCategory === "All" && (
            <section className="mt-10">
              <div className="mb-4 flex items-center gap-2">
                <Flame className="size-5 text-orange-500" />
                <h2 className="text-lg font-bold">Trending Free Collections</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { t: "Image generators", emoji: "🎨", q: "image" },
                  { t: "Video generators", emoji: "🎬", q: "video" },
                  { t: "Coding assistants", emoji: "💻", q: "code" },
                  { t: "Writing tools", emoji: "✍️", q: "writing" },
                  { t: "Chatbots", emoji: "🤖", q: "chatbot" },
                  { t: "Music generators", emoji: "🎵", q: "music" },
                ].map(({ t, emoji, q }) => (
                  <button
                    key={t}
                    onClick={() => {
                      setQuery(q);
                      setPricing("Free");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="tool-lift group flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-left"
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-xl">
                      {emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block text-sm">Best free AI {t}</b>
                      <span className="text-xs text-muted-foreground">
                        Explore the curated collection
                      </span>
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ─── AI News Section ─── */}
          {aiNews.length > 0 && (
          <section id="ai-news-section" className="mt-10 lg:hidden">
            <div className="mb-4 flex items-center gap-2">
              <Newspaper className="size-5 text-primary" />
              <h2 className="text-lg font-bold">AI News</h2>
              <span className="ml-2 text-xs text-muted-foreground">Live updates</span>
            </div>
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="divide-y divide-border">
                {aiNews.map((news, i) => (
                  <a
                    key={i}
                    href={news.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent"
                  >
                    <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold leading-none text-primary tabular-nums">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-medium leading-5">{news.title}</p>
                      <span className="mt-1 block text-[10px] text-muted-foreground">{news.time}{news.source && news.source !== "AI News" ? ` · ${news.source}` : ""}</span>
                    </div>
                  </a>
                ))}
              </div>
              <div className="border-t border-border p-3 text-center">
                <a href="/news" className="text-xs font-medium text-primary hover:underline">
                  Read More AI News →
                </a>
              </div>
            </div>
          </section>
          )}
        </section>

        {/* ─── Right Sidebar ─── */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-4">
            {/* AI News */}
            {aiNews.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border p-3">
                <span className="text-sm">📰</span>
                <h2 className="text-sm font-bold">AI News</h2>
              </div>
              <div className="divide-y divide-border">
                {aiNews.slice(0, 8).map((news, i) => (
                  <a
                    key={i}
                    href={news.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2.5 px-3 py-2 transition-colors hover:bg-accent"
                  >
                    <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold leading-none text-primary tabular-nums">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-xs font-medium leading-4">{news.title}</p>
                      <span className="mt-0.5 block text-[10px] text-muted-foreground">{news.time}{news.source && news.source !== "AI News" ? ` · ${news.source}` : ""}</span>
                    </div>
                  </a>
                ))}
              </div>
              <div className="border-t border-border p-2 text-center">
                <a href="/news" className="text-[10px] font-medium text-primary hover:underline">
                  Read More AI News →
                </a>
              </div>
            </div>
            )}

            {/* Top Ranked */}
            <div className="overflow-hidden rounded-xl border border-border bg-card p-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm">🏆</span>
                <h3 className="text-sm font-bold">Top Ranked</h3>
              </div>
              {catalog.tools
                .filter((t) => t.p === "Free" && t.fl)
                .slice(0, 5)
                .map((tool, i) => (
                <a
                  key={tool.n}
                  href={tool.u}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                >
                  <span className="inline-flex size-5 shrink-0 items-center justify-center rounded bg-primary/10 text-[10px] font-bold leading-none text-primary tabular-nums">
                    {i + 1}
                  </span>
                  <ToolIcon name={tool.n} url={tool.u} small />
                  <span className="min-w-0 flex-1 truncate font-medium text-xs">{tool.n}</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Free</span>
                </a>
              ))}
              <Link
                to="/ranking"
                className="mt-2 flex items-center justify-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                View full ranking <ArrowRight className="size-3" />
              </Link>
            </div>

            {/* Quick Links */}
            <div className="rounded-xl border border-border bg-card p-3">
              <h3 className="mb-2 text-sm font-bold">⚡ Quick Links</h3>
              <div className="space-y-1">
                {[
                  { label: "Submit your AI tool", href: "/submit", icon: "➕" },
                  { label: "Advertise with us", href: "/advertise", icon: "📢" },
                  { label: "Browse categories", href: "/categories", icon: "📂" },
                ].map((link) => (
                  <Link
                    key={link.label}
                    to={link.href || "/"}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <span className="text-sm">{link.icon}</span>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* ─── Top Picks (above footer) ─── */}
      {!query && activeCategory === "All" && exclusiveTools.length > 0 && (
        <section className="mx-auto max-w-[1480px] px-4 lg:px-6 mt-10">
          {/* Top 4 Featured */}
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-4">Editor's Pick</h2>
            <div className="space-y-3">
              {exclusiveTools.slice(0, 4).map((tool, i) => (
                <ToolCard
                  key={`pick-${tool.n}-${i}`}
                  tool={tool}
                  saved={savedTools.has(tool.n)}
                  onToggleSave={() => toggleSave(tool.n)}
                  featured
                  {...getReactionProps(tool)}
                />
              ))}
            </div>
          </div>

          {/* More recommended tools */}
          {exclusiveTools.length > 4 && (
            <div>
              <h2 className="text-lg font-bold mb-4">Recommended</h2>
              <div className="space-y-3">
                {exclusiveTools.slice(4).map((tool, i) => (
                  <ToolCard
                    key={`rec-${tool.n}-${i}`}
                    tool={tool}
                    saved={savedTools.has(tool.n)}
                    onToggleSave={() => toggleSave(tool.n)}
                    {...getReactionProps(tool)}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ─── New Visitor Popup ─── */}
      {showVisitorPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={() => { setShowVisitorPopup(false); localStorage.setItem("mb-visitor-popup-seen", "1"); }}>
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { setShowVisitorPopup(false); localStorage.setItem("mb-visitor-popup-seen", "1"); }} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"><X className="size-5" /></button>
            <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary/10 text-3xl">👋</span>
            <h3 className="mt-5 text-xl font-extrabold">Welcome to TavBook!</h3>
            <p className="mt-3 text-sm text-muted-foreground leading-6">Join thousands of AI enthusiasts discovering the best tools. Sign in to save, recommend, and track your favorites.</p>
            <div className="mt-6 space-y-2">
              <Button variant="brand" className="w-full gap-2" onClick={() => { setShowVisitorPopup(false); localStorage.setItem("mb-visitor-popup-seen", "1"); handleSignIn(); }}>
                <LogIn className="size-4" /> Sign Up & Login
              </Button>
              <Button variant="outline" className="w-full" onClick={() => { setShowVisitorPopup(false); localStorage.setItem("mb-visitor-popup-seen", "1"); }}>
                Do it later
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Report Dialog ─── */}
      {reportTool && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={() => { setReportTool(null); setReportReason(""); setReportSubmitted(false); }}>
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { setReportTool(null); setReportReason(""); setReportSubmitted(false); }} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"><X className="size-5" /></button>
            {!reportSubmitted ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Flag className="size-5 text-red-500" />
                  <h3 className="text-lg font-bold">Report Tool</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Why are you reporting <strong>{reportTool}</strong>?</p>
                <div className="space-y-2">
                  {["Scam or fraudulent", "Abusive content", "Phishing attempt", "Broken link / doesn't work", "Misleading description"].map((reason) => (
                    <button key={reason} onClick={() => setReportReason(reason)}
                      className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${reportReason === reason ? "border-red-400 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400" : "border-border hover:bg-accent"}`}>
                      {reason}
                    </button>
                  ))}
                </div>
                <Button variant="outline" className="mt-4 w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30" disabled={!reportReason}
                  onClick={() => { setReportSubmitted(true); }}>
                  <Send className="size-4 mr-2" /> Submit Report
                </Button>
              </>
            ) : (
              <div className="py-6 text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-3xl dark:bg-emerald-950/30">✅</span>
                <h3 className="mt-4 text-lg font-bold">Report Submitted</h3>
                <p className="mt-2 text-sm text-muted-foreground">Thank you! Our team will review your report.</p>
                <Button variant="outline" className="mt-5" onClick={() => { setReportTool(null); setReportReason(""); setReportSubmitted(false); }}>Close</Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Footer ─── */}
      <footer className="mt-12 border-t border-border bg-card">
        <div className="mx-auto max-w-[1480px] px-4 py-10 lg:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img src={logoAsset.url} alt="TavBook" className="h-8 w-8 object-contain" />
                <span className="text-lg font-extrabold">
                  Tav<span className="gradient-text">Book</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-6">
                The world's AI discovery and research platform. Find, compare, and choose the best AI tools for any task.
              </p>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-bold">🔍 Discover</h4>
              <div className="space-y-2">
                {["Latest AI Tools", "Free AI Tools", "AI Rankings", "Categories"].map((item) => (
                  <a key={item} href="#" className="block text-sm text-muted-foreground hover:text-primary">
                    {item}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-bold">📚 Resources</h4>
              <div className="space-y-2">
                {["AI News", "Blog", "Submit Tool", "Advertise", "Ranking", "Pricing"].map((label) => {
                  const hrefs: Record<string, string> = { "AI News": "/news", "Blog": "/blog", "Submit Tool": "/submit", "Advertise": "/advertise", "Ranking": "/ranking", "Pricing": "/pricing" };
                  return (
                    <Link key={label} to={hrefs[label] || "/"} className="block text-sm text-muted-foreground hover:text-primary">
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-bold">🏢 Company</h4>
              <div className="space-y-2">
                {[{ label: "About Us", to: "/about" }, { label: "Contact", to: "/contact" }, { label: "Privacy Policy", to: "/privacy" }, { label: "Terms of Service", to: "/terms" }].map((item) => (
                  <Link key={item.label} to={item.to} className="block text-sm text-muted-foreground hover:text-primary">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} TavBook. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Globe className="size-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">EN</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Back to Top */}
      <BackToTop />
      </div>
    </div>
  );
}

/* ─── Shared Components ─────────────────────────────────────── */

function extractDomain(url: string): string | null {
  try {
    const u = new URL(url);
    return u.hostname;
  } catch {
    return null;
  }
}

// Logo source stages: 0=icon.horse, 1=Google favicon, 2=DuckDuckGo, -1=all failed
const logoCache = new Map<string, number>();

function ToolIcon({ name, url, small = false }: { name: string; url?: string; small?: boolean }) {
  const gradient = getToolGradient(name);
  const domain = url ? extractDomain(url) : null;
  const cacheKey = domain || "";
  const cached = cacheKey ? logoCache.get(cacheKey) : undefined;

  const [stage, setStage] = useState<number>(cached !== undefined ? cached : domain ? 0 : -1);
  const [loaded, setLoaded] = useState(false);

  const getLogoSrc = useCallback((dom: string, s: number): string | null => {
    if (s === 0) return `https://icon.horse/icon/${dom}`;
    if (s === 1) return `https://www.google.com/s2/favicons?domain=${dom}&sz=128`;
    if (s === 2) return `https://icons.duckduckgo.com/ip3/${dom}.ico`;
    return null;
  }, []);

  const handleError = useCallback(() => {
    const nextStage = stage + 1;
    if (nextStage <= 2) {
      if (cacheKey) logoCache.set(cacheKey, nextStage);
      setStage(nextStage);
      setLoaded(false);
    } else {
      // All sources failed — show clean initials fallback immediately
      if (cacheKey) logoCache.set(cacheKey, -1);
      setStage(-1);
    }
  }, [stage, cacheKey]);

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      // Reject tiny (16px) favicons that would look blurry when scaled up —
      // fall through to the next, higher-resolution source instead.
      const w = e.currentTarget.naturalWidth;
      if (w > 0 && w < 40 && stage < 2) {
        const nextStage = stage + 1;
        if (cacheKey) logoCache.set(cacheKey, nextStage);
        setStage(nextStage);
        setLoaded(false);
        return;
      }
      if (cacheKey) logoCache.set(cacheKey, stage);
      setLoaded(true);
    },
    [stage, cacheKey],
  );

  const currentSrc = domain ? getLogoSrc(domain, stage) : null;

  // All sources failed or no domain — show gradient initials (original design)
  if (stage === -1 || !currentSrc) {
    return (
      <span
        className={`grid shrink-0 place-items-center rounded-lg bg-gradient-to-br ${gradient} font-bold text-white shadow-sm ${
          small ? "size-8 text-[9px]" : "size-10 text-xs"
        }`}
      >
        {initials(name)}
      </span>
    );
  }

  // Show logo inside a clean square matching original design
  const pxSize = small ? 32 : 40;
  return (
    <span
      className="shrink-0 overflow-hidden rounded-lg bg-white dark:bg-zinc-800 shadow-sm"
      style={{ display: "inline-flex", position: "relative", width: pxSize, height: pxSize }}
    >
      {/* Loading placeholder — muted, pulsing so it doesn't look like the real logo is already loaded */}
      <span
        className={`absolute inset-0 grid place-items-center rounded-lg bg-muted/30 dark:bg-muted/20 transition-opacity duration-300 ${
          loaded ? "opacity-0" : "opacity-100 animate-pulse"
        }`}
      >
        <img
          src={logoAsset.url}
          alt=""
          aria-hidden="true"
          className="size-full object-contain opacity-40 grayscale"
        />
      </span>
      {/* Real logo image — fills the square cleanly */}
      <img
        src={currentSrc}
        alt={name}
        width={pxSize}
        height={pxSize}
        loading="eager"
        fetchPriority="high"

        onLoad={handleLoad}
        onError={handleError}
        decoding="async"
        style={{ imageRendering: "auto" }}
        className="absolute inset-0 z-10 size-full object-contain p-[3px]"
      />
    </span>
  );
}

/** Generate hashtags from tool data for the algorithm feature. */
const HASHTAG_KEYWORDS = [
  "chatbot", "image", "video", "audio", "music", "voice", "code", "writing", "design",
  "photo", "art", "3d", "animation", "seo", "marketing", "email", "productivity", "automation",
  "translation", "transcription", "resume", "presentation", "social media", "chat", "assistant",
  "generator", "editor", "analyzer", "detector", "classifier", "summarizer", "rephraser",
  "robotics", "healthcare", "finance", "education", "gaming", "fashion", "interior",
  "ecommerce", "customer support", "data", "machine learning", "deep learning", "nlp",
  "computer vision", "speech", "text to speech", "ocr", "pdf", "excel", "spreadsheet",
  "database", "api", "cloud", "devops", "security", "privacy", "compliance",
  "free", "open source", "no code", "low code", "plugin", "extension", "mobile",
  "desktop", "web app", "saas", "enterprise", "startup", "freelance",
];

function generateHashtags(tool: Tool): string[] {
  const tags: string[] = [];
  const seen = new Set<string>();
  const lower = tool.d.toLowerCase();

  // Extract matching keywords from description
  for (const kw of HASHTAG_KEYWORDS) {
    if (lower.includes(kw) && !seen.has(kw)) {
      seen.add(kw);
      tags.push(kw);
      if (tags.length >= 3) break;
    }
  }

  // If fewer than 2 tags, extract from category name
  if (tags.length < 2) {
    const catWords = tool.c.toLowerCase().replace(/^ai\s*/i, "").split(/\s+/);
    for (const w of catWords) {
      if (w.length > 2 && !seen.has(w)) {
        seen.add(w);
        tags.push(w);
        if (tags.length >= 3) break;
      }
    }
  }

  // If still fewer than 2, extract from group name
  if (tags.length < 2 && tool.g && tool.g !== tool.c) {
    const groupWords = tool.g.toLowerCase().replace(/^ai\s*/i, "").replace(/^free\s*/i, "").split(/\s+/);
    for (const w of groupWords) {
      if (w.length > 2 && !seen.has(w)) {
        seen.add(w);
        tags.push(w);
        if (tags.length >= 3) break;
      }
    }
  }

  return tags.slice(0, 3);
}

// Reaction emojis for the popup
const REACTION_EMOJIS = ["👍", "❤️", "🔥", "😮", "😢"];

const ToolCard = memo(function ToolCard({
  tool,
  saved,
  onToggleSave,
  featured = false,
  trending = false,
  exclusive = false,
  reactionData,
  onReaction,
  onReport,
  onRecommend,
  isRecommended,
  showReactionPopup,
  onToggleReactionPopup,
}: {
  tool: Tool;
  saved: boolean;
  onToggleSave: () => void;
  featured?: boolean;
  trending?: boolean;
  exclusive?: boolean;
  reactionData: { type: "like" | "dislike" | null; emoji: string | null; counts: { like: number; dislike: number } };
  onReaction: (name: string, type: "like" | "dislike", emoji?: string) => void;
  onReport: (name: string) => void;
  onRecommend: (name: string) => void;
  isRecommended: boolean;
  showReactionPopup: boolean;
  onToggleReactionPopup: (name: string) => void;
}) {
  const hashtags = useMemo(() => generateHashtags(tool), [tool.n, tool.d, tool.c, tool.g]);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  // Close popup on outside click
  useEffect(() => {
    if (!showReactionPopup) return;
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) onToggleReactionPopup(tool.n);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showReactionPopup, tool.n, onToggleReactionPopup]);

  const cardStyle: React.CSSProperties = exclusive
    ? {
        backgroundImage: "url('/holographic-card.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        contentVisibility: "auto",
        containIntrinsicSize: "260px",
      } as React.CSSProperties
    : ({ contentVisibility: "auto", containIntrinsicSize: "260px" } as React.CSSProperties);

  const toolSlug = tool.n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const social = useMemo(() => getSocialMeta(tool.n), [tool.n]);


  return (
    <article
      onClick={() => {
        try {
          sessionStorage.setItem("mb:home:scroll", String(window.scrollY));
        } catch {}
        window.location.href = `/tool/${toolSlug}`;
      }}
      style={cardStyle}
      className={`tool-lift flex min-w-0 flex-col rounded-xl border-2 p-4 cursor-pointer ${
        exclusive
          ? "border-fuchsia-400/60 ring-1 ring-fuchsia-400/30 shadow-[0_0_24px_-12px_rgba(217,70,239,0.45)]"
          : `border-zinc-300 dark:border-zinc-600 bg-card ${featured ? "ring-1 ring-primary/20" : ""}`
      }`}
    >
      {/* Poster row — who added this AI and when */}
      <div className="mb-3 flex min-w-0 items-center gap-2">
        <img
          src={social.curator.avatar}
          alt={`${social.curator.name} profile photo`}
          width={28}
          height={28}
          loading="lazy"
          decoding="async"
          className="size-7 shrink-0 rounded-full object-cover ring-1 ring-border"
        />
        <div className="flex min-w-0 items-center gap-1">
          <span className={`truncate text-xs font-semibold ${exclusive ? "text-white" : ""}`}>{social.curator.name}</span>
          {social.curator.verified && (
            <BadgeCheck className="size-3.5 shrink-0 fill-sky-500 text-white" aria-label="Verified curator" />
          )}
        </div>
        <span className={`shrink-0 text-[11px] ${exclusive ? "text-white/70" : "text-muted-foreground"}`}>
          · added {social.postedAgo} ago
        </span>
      </div>

      <div className="flex min-w-0 items-start gap-3">

        <a href={tool.u} target="_blank" rel="noopener noreferrer" className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <ToolIcon name={tool.n} url={tool.u} />
        </a>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <a href={tool.u} target="_blank" rel="noopener noreferrer" className="hover:underline" onClick={(e) => e.stopPropagation()}>
              <h3 className={`truncate font-semibold text-sm ${exclusive ? "text-white drop-shadow" : ""}`}>{tool.n}</h3>
            </a>
            {isRecommended && (
              <span className="shrink-0 rounded-md bg-gradient-to-r from-emerald-500 to-green-500 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
                Recommended
              </span>
            )}
            {(() => {
              // Merge implicit badges (from ex/tr flags) with admin-assigned badges.
              const set = new Set<string>();
              if (exclusive) set.add("Exclusive");
              if (trending) set.add("Trending");
              for (const b of tool.badges || []) set.add(b);
              const ORDER = ["Verified", "Exclusive", "Trending", "Super Valuable", "Underrated"];
              const list = Array.from(set).sort((a, b) => {
                const ia = ORDER.indexOf(a); const ib = ORDER.indexOf(b);
                return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
              });
              const STYLE: Record<string, string> = {
                "Verified": "bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 ring-1 ring-sky-300/60 shadow-[0_0_14px_-3px_rgba(56,189,248,0.75)]",
                "Exclusive": "bg-gradient-to-r from-fuchsia-500 via-pink-500 to-violet-500 ring-1 ring-fuchsia-400/60 shadow-[0_0_12px_-2px_rgba(217,70,239,0.7)]",
                "Trending": "bg-gradient-to-r from-orange-500 to-amber-500 ring-1 ring-orange-400/60 shadow-[0_0_12px_-2px_rgba(249,115,22,0.6)]",
                "Super Valuable": "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 ring-1 ring-emerald-300/60 shadow-[0_0_12px_-2px_rgba(16,185,129,0.6)]",
                "Underrated": "bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-400 ring-1 ring-amber-300/60 shadow-[0_0_12px_-2px_rgba(245,158,11,0.6)]",
              };
              const ICON: Record<string, string> = {
                "Verified": "✓",
                "Exclusive": "✨",
                "Trending": "🔥",
                "Super Valuable": "💎",
                "Underrated": "⭐",
              };
              return list.map((b) => (
                <span
                  key={b}
                  className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-extrabold text-white ${STYLE[b] || "bg-gradient-to-r from-slate-500 to-slate-700"}`}
                >
                  {ICON[b] || "🏅"} {b}
                </span>
              ));
            })()}

            {(() => {
              const style = PRICING_STYLES[tool.p];
              if (!style) return null;
              return (
                <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-extrabold shadow-sm ${style.bg} ${style.text}`}>
                  {style.label}
                </span>
              );
            })()}
          </div>
          <p className={`mt-1 truncate text-xs ${exclusive ? "text-white/85" : "text-muted-foreground"}`}>{tool.c}</p>
        </div>

        {/* Three-dot menu button */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="More options"
          >
            <MoreVertical className="size-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
              <button
                onClick={(e) => { e.stopPropagation(); onToggleSave(); setShowMenu(false); }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
              >
                <Bookmark className={`size-4 ${saved ? "fill-primary text-primary" : ""}`} />
                {saved ? "Unsave" : "Save"}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onRecommend(tool.n); setShowMenu(false); }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
              >
                <Send className="size-4" />
                {isRecommended ? "Unrecommend" : "Recommend"}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onReport(tool.n); setShowMenu(false); }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <Flag className="size-4" />
                Report
              </button>
            </div>
          )}
        </div>
      </div>
      <p className="my-3 min-h-8 text-sm leading-5 text-muted-foreground" style={{display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",wordBreak:"break-word",overflowWrap:"break-word"}}>{tool.d}</p>
      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {hashtags.map((tag) => (
            <span key={tag} className="rounded-md bg-gradient-to-r from-primary/15 to-primary/5 px-1.5 py-0.5 text-[10px] font-semibold text-primary border border-primary/20">
              #{tag}
            </span>
          ))}
        </div>
      )}
      <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-2 min-w-0 max-w-[55%]">
          <span className="truncate rounded-md bg-gradient-to-r from-violet-500/15 to-indigo-500/10 px-1.5 py-0.5 text-[10px] font-bold text-violet-600 dark:text-violet-400 border border-violet-500/20">
            🏷️ {tool.c.replace(/\s+/g, "").replace(/^AI/i, "AI")}
          </span>
          {tool.g && tool.g !== tool.c && (
            <span className="truncate rounded-md bg-gradient-to-r from-indigo-500/15 to-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hidden sm:inline">
              📂 {tool.g.replace(/\s+/g, "").replace(/^FreeAI/i, "AI")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Like button */}
          <div className="relative" ref={popupRef}>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleReactionPopup(tool.n); }}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors ${
                reactionData.type === "like"
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {reactionData.emoji && reactionData.type === "like"
                ? <span className="text-sm leading-none">{reactionData.emoji}</span>
                : <ThumbsUp className={`size-3.5 ${reactionData.type === "like" ? "fill-emerald-500" : ""}`} />
              }
              <span className="text-[11px]">{reactionData.counts.like}</span>
            </button>
            {/* Emoji popup */}
            {showReactionPopup && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex gap-1 rounded-xl border border-border bg-popover p-2 shadow-xl">
                {REACTION_EMOJIS.map((em) => (
                  <button key={em} onClick={(e) => { e.stopPropagation(); onReaction(tool.n, "like", em); onToggleReactionPopup(tool.n); }}
                    className="size-9 grid place-items-center rounded-lg hover:bg-accent text-lg transition-transform hover:scale-125">
                    {em}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Dislike button */}
          <button
            onClick={(e) => { e.stopPropagation(); onReaction(tool.n, "dislike"); }}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors ${
              reactionData.type === "dislike"
                ? "bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-400"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <ThumbsDown className={`size-3.5 ${reactionData.type === "dislike" ? "fill-red-500" : ""}`} />
            <span className="text-[11px]">{reactionData.counts.dislike}</span>
          </button>
          {/* Save button with count */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
            title={saved ? "Unsave" : "Save"}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors ${
              saved
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <Bookmark className={`size-3.5 ${saved ? "fill-primary" : ""}`} />
            <span className="text-[11px]">{social.saves + (saved ? 1 : 0)}</span>
          </button>
          {/* Visit button */}

          <a href={tool.u} target="_blank" rel="noopener noreferrer" className="shrink-0" onClick={(e) => e.stopPropagation()}>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5 px-3 py-1.5 text-xs font-bold text-primary transition-all hover:from-primary/20 hover:to-primary/10 hover:shadow-[0_0_12px_-4px_rgba(var(--primary),0.4)]">
              🌐 Visit <ExternalLink className="size-3" />
            </span>
          </a>
        </div>
      </div>
    </article>
  );
});

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-16 text-center">
      <Search className="mx-auto mb-4 size-10 text-muted-foreground" />
      <h3 className="text-lg font-bold">No exact matches yet</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Try a broader keyword or reset your filters.
      </p>
      <Button variant="outline" className="mt-5" onClick={onReset}>
        Reset search
      </Button>
    </div>
  );
}

function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const handler = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);
  if (!show) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-40 grid size-10 place-items-center rounded-full border border-border bg-card shadow-lg transition hover:bg-accent"
      aria-label="Back to top"
    >
      <ChevronRight className="size-4 -rotate-90" />
    </button>
  );
}

/** Skeleton placeholder grid shown while the AI catalog JSON is still being fetched. */
function ToolCardSkeletons({ count = 6 }: { count?: number }) {
  // Render skeleton cards matching the layout of ToolCard
  const cards = Array.from({ length: count });
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {cards.map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-card p-3 flex gap-3 items-start"
          style={{ minHeight: "116px" }}
        >
          {/* Icon placeholder */}
          <div
            className="mb-skeleton shrink-0 rounded-lg"
            style={{ width: "44px", height: "44px", display: "block" }}
          >
            &nbsp;
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            {/* Title + pricing badge row */}
            <div className="flex items-center justify-between gap-2">
              <span
                className="mb-skeleton"
                style={{ width: "45%", height: "1em", display: "inline-block" }}
              >
                &nbsp;
              </span>
              <span
                className="mb-skeleton"
                style={{ width: "3ch", height: "1em", display: "inline-block" }}
              >
                &nbsp;
              </span>
            </div>
            {/* Description line 1 */}
            <span
              className="mb-skeleton"
              style={{ width: "92%", height: "0.9em", display: "inline-block" }}
            >
              &nbsp;
            </span>
            {/* Description line 2 */}
            <span
              className="mb-skeleton"
              style={{ width: "70%", height: "0.9em", display: "inline-block" }}
            >
              &nbsp;
            </span>
            {/* Footer: category + visit button */}
            <div className="flex items-center justify-between pt-1">
              <span
                className="mb-skeleton"
                style={{ width: "8ch", height: "0.9em", display: "inline-block" }}
              >
                &nbsp;
              </span>
              <span
                className="mb-skeleton"
                style={{ width: "5ch", height: "0.9em", display: "inline-block" }}
              >
                &nbsp;
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
