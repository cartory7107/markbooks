import { TOTAL_TOOLS_LABEL } from "@/lib/tool-count";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import type { BlogPostRow, BlogCategoryRow } from "@/lib/blog.server";

const BASE_URL = "https://markbook.top";

type LoaderData = {
  posts: BlogPostRow[];
  total: number;
  categories: BlogCategoryRow[];
  counts: Record<string, number>;
};

export const Route = createFileRoute("/blog/")({
  loader: async () => {
    const { getPublishedPosts, getAllCategories, getPostCountByCategory } =
      await import("@/lib/blog.server");
    const [postsRes, categories, counts] = await Promise.all([
      getPublishedPosts({ limit: 500 }),
      getAllCategories(),
      getPostCountByCategory(),
    ]);
    return {
      posts: postsRes.posts,
      total: postsRes.total,
      categories,
      counts,
    } satisfies LoaderData;
  },
  head: ({ loaderData }) => {
    const data = loaderData as LoaderData | undefined;
    return {
      meta: [
        { title: "TavBook AI Blog — Guides, Reviews & AI Tool Research" },
        {
          name: "description",
          content:
            `Deep guides, comparisons, and research on the best AI tools of 2026. Written by the TavBook editorial team using our ${TOTAL_TOOLS_LABEL} verified AI directory.`,
        },
        { property: "og:title", content: "TavBook AI Blog — AI Tool Guides & Research" },
        {
          property: "og:description",
          content:
            "Guides, comparisons, and research on the best AI tools of 2026 from TavBook AI.",
        },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `${BASE_URL}/blog` },
        { property: "og:site_name", content: "TavBook" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:site", content: "@tavbook" },
        { name: "twitter:title", content: "TavBook AI Blog — AI Tool Guides & Research" },
        {
          name: "twitter:description",
          content:
            "Guides, comparisons, and research on the best AI tools of 2026 from TavBook AI.",
        },
      ],
      links: [{ rel: "canonical", href: `${BASE_URL}/blog` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            name: "TavBook AI Blog",
            url: `${BASE_URL}/blog`,
            description:
              "Deep guides, comparisons, and research on the best AI tools of 2026.",
            publisher: {
              "@type": "Organization",
              name: "TavBook",
              url: BASE_URL,
              logo: { "@type": "ImageObject", url: `${BASE_URL}/favicon.png` },
            },
            blogPost: (data?.posts ?? []).map((p) => ({
              "@type": "BlogPosting",
              headline: p.title,
              url: `${BASE_URL}/blog/${p.slug}`,
              datePublished: p.published_at,
              dateModified: p.updated_at,
              author: p.author
                ? { "@type": "Person", name: p.author.name }
                : { "@type": "Organization", name: "TavBook" },
              description: p.excerpt,
            })),
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
              {
                "@type": "ListItem",
                position: 2,
                name: "Blog",
                item: `${BASE_URL}/blog`,
              },
            ],
          }),
        },
      ],
    };
  },
  component: BlogIndex,
});

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

function BlogIndex() {
  const { posts, categories, counts } = Route.useLoaderData() as LoaderData;
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!activeCategory) return posts;
    return posts.filter((p) => p.category?.slug === activeCategory);
  }, [posts, activeCategory]);

  const featuredPost = useMemo(() => {
    const feat = filtered.find((p) => p.is_featured);
    return feat || filtered[0] || null;
  }, [filtered]);

  const gridPosts = useMemo(() => {
    if (!featuredPost) return filtered;
    return filtered.filter((p) => p.id !== featuredPost.id);
  }, [filtered, featuredPost]);

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
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16 lg:py-20">
        {/* ── Breadcrumb ── */}
        <nav
          className="mb-8 flex items-center gap-1.5 text-sm text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Link to="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <span className="mx-1 text-muted-foreground/60">/</span>
          <span className="font-medium text-foreground">Blog</span>
        </nav>

        {/* ── Hero ── */}
        <header className="mb-10 sm:mb-14">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-600">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
            </span>
            Updated Weekly
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            TavBook AI Blog
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            In-depth guides, honest comparisons, and original research on the best AI
            tools of 2026 — powered by our {TOTAL_TOOLS_LABEL} verified directory.
          </p>
        </header>

        {/* ── Category filter bar ── */}
        {categories.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setActiveCategory(null)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all ${
                  activeCategory === null
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:border-indigo-200 hover:text-foreground"
                }`}
              >
                <span>All</span>
                <span
                  className={`ml-0.5 text-xs ${
                    activeCategory === null
                      ? "text-indigo-500"
                      : "text-muted-foreground/60"
                  }`}
                >
                  {posts.length}
                </span>
              </button>
              {categories
                .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))
                .map((cat) => {
                  const count = counts[cat.slug] ?? 0;
                  if (count === 0) return null;
                  return (
                    <button
                      key={cat.id}
                      onClick={() =>
                        setActiveCategory(
                          activeCategory === cat.slug ? null : cat.slug,
                        )
                      }
                      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all ${
                        activeCategory === cat.slug
                          ? "border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm"
                          : "border-border bg-card text-muted-foreground hover:border-indigo-200 hover:text-foreground"
                      }`}
                    >
                      {cat.emoji && <span>{cat.emoji}</span>}
                      <span>{cat.name}</span>
                      <span
                        className={`ml-0.5 text-xs ${
                          activeCategory === cat.slug
                            ? "text-indigo-500"
                            : "text-muted-foreground/60"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl">
              📝
            </div>
            <h2 className="text-xl font-semibold">Coming Soon</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              We're crafting in-depth guides and research. Check back soon for
              the latest AI insights from the TavBook team.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Explore AI Tools
            </Link>
          </div>
        )}

        {/* ── Featured article ── */}
        {featuredPost && filtered.length > 0 && (
          <Link
            to="/blog/$slug"
            params={{ slug: featuredPost.slug }}
            className="group mb-10 block overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-indigo-300/60 hover:shadow-xl hover:shadow-indigo-100/50"
          >
            <div className="grid gap-0 sm:grid-cols-2">
              {/* Image area */}
              <div className="relative flex min-h-[220px] items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 sm:min-h-[280px]">
                {featuredPost.featured_image_url ? (
                  <img
                    src={featuredPost.featured_image_url}
                    alt={featuredPost.featured_image_alt || featuredPost.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="text-center text-white/90">
                    <span className="block text-5xl">
                      {featuredPost.category?.emoji || "📰"}
                    </span>
                    <span className="mt-3 block text-sm font-medium uppercase tracking-wider opacity-80">
                      Featured
                    </span>
                  </div>
                )}
                {featuredPost.is_featured && (
                  <span className="absolute left-3 top-3 rounded-full bg-amber-400/90 px-2.5 py-0.5 text-xs font-bold text-amber-900 shadow-sm">
                    ⭐ Featured
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-col justify-center p-6 sm:p-8">
                {featuredPost.category && (
                  <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {featuredPost.category.emoji &&
                      ` ${featuredPost.category.emoji}`}
                    {featuredPost.category.name}
                  </span>
                )}
                <h2 className="text-2xl font-bold leading-tight tracking-tight group-hover:text-primary sm:text-3xl">
                  {featuredPost.title}
                </h2>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {featuredPost.excerpt}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>{formatDate(featuredPost.published_at)}</span>
                  <span className="text-muted-foreground/40">·</span>
                  <span>{featuredPost.reading_minutes} min read</span>
                  {featuredPost.author && (
                    <>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="font-medium text-foreground/80">
                        {featuredPost.author.name}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* ── Article grid ── */}
        {gridPosts.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {gridPosts.map((post) => (
              <Link
                key={post.id}
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-indigo-300/60 hover:shadow-lg hover:shadow-indigo-100/40"
              >
                {/* Card header image / color */}
                <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                  {post.featured_image_url ? (
                    <img
                      src={post.featured_image_url}
                      alt={post.featured_image_alt || post.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-4xl opacity-60">
                      {post.category?.emoji || "📄"}
                    </span>
                  )}
                  {post.is_trending && (
                    <span className="absolute right-3 top-3 rounded-full bg-orange-400/90 px-2 py-0.5 text-[10px] font-bold uppercase text-orange-900 shadow-sm">
                      🔥 Trending
                    </span>
                  )}
                </div>

                {/* Card body */}
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2.5 flex items-center gap-2 text-xs text-muted-foreground">
                    {post.category && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-medium">
                        {post.category.emoji && ` ${post.category.emoji}`}
                        {post.category.name}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold leading-snug group-hover:text-primary sm:text-lg">
                    {post.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {post.excerpt}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                    <span>{formatDate(post.published_at)}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span>{post.reading_minutes} min</span>
                    {post.author && (
                      <>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="font-medium text-foreground/70">
                          {post.author.name}
                        </span>
                      </>
                    )}
                  </div>
                  {post.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {post.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* ── Newsletter CTA ── */}
        {posts.length > 0 && (
          <section className="mt-16 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 text-center text-white sm:p-12">
            <div className="mx-auto max-w-lg">
              <span className="mb-3 inline-block text-3xl">📬</span>
              <h2 className="text-2xl font-bold sm:text-3xl">
                Stay ahead of AI
              </h2>
              <p className="mt-3 text-indigo-100">
                Get weekly guides, research insights, and tool comparisons
                delivered to your inbox. No spam — just the best AI content.
              </p>
              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full rounded-xl bg-white/15 px-4 py-3 text-sm text-white placeholder:text-white/60 backdrop-blur-sm transition-colors focus:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/30 sm:max-w-xs"
                  aria-label="Email address"
                />
                <button
                  type="button"
                  className="w-full rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-lg transition-all hover:bg-indigo-50 hover:shadow-xl sm:w-auto"
                >
                  Subscribe
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}