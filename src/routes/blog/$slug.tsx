import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import type { BlogPostRow } from "@/lib/blog.server";

const BASE_URL = "https://tavbook.top";

type LoaderData = {
  post: BlogPostRow;
  related: BlogPostRow[];
};

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const { getPublishedPostBySlug, getPublishedPosts } =
      await import("@/lib/blog.server");

    const post = await getPublishedPostBySlug(params.slug);
    if (!post) throw notFound();

    const relatedRes = await getPublishedPosts({ limit: 4 });
    const related = relatedRes.posts.filter((p) => p.id !== post.id).slice(0, 3);

    return { post, related } satisfies LoaderData;
  },
  head: ({ params, loaderData }) => {
    const data = loaderData as LoaderData | undefined;
    if (!data) {
      return {
        meta: [
          { title: "Article not found — TavBook AI" },
          { name: "robots", content: "noindex" },
        ],
      };
    }

    const { post } = data;
    const slug = params.slug;
    const url =
      post.canonical_url || `${BASE_URL}/blog/${slug}`;
    const title =
      post.meta_title || `${post.title} — TavBook AI Blog`;
    const description = post.meta_description || post.excerpt || "";
    const ogTitle = post.og_title || title;
    const ogDescription = post.og_description || description;
    const ogImage = post.og_image_url || post.featured_image_url || `${BASE_URL}/og-image.png`;

    const authorLd = post.author
      ? {
          "@type": "Person" as const,
          name: post.author.name,
          url: post.author.website_url || undefined,
          jobTitle: post.author.role_title || undefined,
          image: post.author.avatar_url || undefined,
          ...(post.author.twitter_url && {
            sameAs: [post.author.twitter_url, post.author.linkedin_url].filter(Boolean),
          }),
        }
      : { "@type": "Organization" as const, name: "TavBook", url: BASE_URL };

    const scripts: Array<{ type: string; children: string }> = [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description,
          author: authorLd,
          publisher: {
            "@type": "Organization",
            name: "TavBook",
            url: BASE_URL,
            logo: { "@type": "ImageObject", url: `${BASE_URL}/favicon.png` },
          },
          datePublished: post.published_at,
          dateModified: post.updated_at,
          mainEntityOfPage: url,
          image: ogImage,
          keywords: post.keywords.join(", "),
          wordCount: post.word_count,
          articleSection: post.category?.name || undefined,
          ...(post.tags.length > 0 && { about: post.tags }),
        }),
      },
    ];

    // FAQ schema
    if (post.faq && post.faq.length > 0) {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      });
    }

    // Breadcrumb
    scripts.push({
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
          {
            "@type": "ListItem",
            position: 3,
            name: post.title,
            item: url,
          },
        ],
      }),
    });

    const meta = [
      { title },
      { name: "description", content: description },
      { name: "keywords", content: post.keywords.join(", ") },
      ...(post.author ? [{ name: "author", content: post.author.name }] : []),
      { property: "og:title", content: ogTitle },
      { property: "og:description", content: ogDescription },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
      { property: "og:image", content: ogImage },
      { property: "og:site_name", content: "TavBook" },
      ...(post.published_at
        ? [
            { property: "article:published_time", content: post.published_at },
            { property: "article:modified_time", content: post.updated_at },
          ]
        : []),
      ...(post.author
        ? [{ property: "article:author", content: post.author.name }]
        : []),
      ...post.tags.flatMap((t) => [
        { property: "article:tag", content: t },
      ]),
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@tavbook" },
      { name: "twitter:title", content: ogTitle },
      { name: "twitter:description", content: ogDescription },
      { name: "twitter:image", content: ogImage },
    ];

    return {
      meta,
      links: [{ rel: "canonical", href: url }],
      scripts,
    };
  },
  component: BlogPostPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <div className="mb-4 text-5xl">🔍</div>
      <h1 className="text-2xl font-bold">Article not found</h1>
      <p className="mt-2 text-muted-foreground">
        This article does not exist or has been moved.
      </p>
      <Link
        to="/blog"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        ← Back to Blog
      </Link>
    </div>
  ),
});

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

function BlogPostPage() {
  const { post, related } = Route.useLoaderData() as LoaderData;
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const shareUrl = `${BASE_URL}/blog/${post.slug}`;
  const shareTitle = post.title;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(shareTitle);

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [shareUrl]);

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
      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14 lg:py-20">
        {/* ── Breadcrumb ── */}
        <nav
          className="mb-8 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Link to="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <span className="mx-1 text-muted-foreground/60">/</span>
          <Link to="/blog" className="transition-colors hover:text-foreground">
            Blog
          </Link>
          <span className="mx-1 text-muted-foreground/60">/</span>
          <span className="max-w-[240px] truncate font-medium text-foreground">
            {post.title}
          </span>
        </nav>

        {/* ── Article header ── */}
        <header className="mb-10">
          {/* Category badge */}
          {post.category && (
            <Link
              to="/blog"
              search={{ _category: post.category.slug } as any}
              className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600 transition-colors hover:bg-indigo-100"
            >
              {post.category.emoji && ` ${post.category.emoji}`}
              {post.category.name}
            </Link>
          )}

          <div className="mb-4 flex flex-wrap items-center gap-2.5 text-sm text-muted-foreground">
            <time dateTime={post.published_at || undefined}>
              {formatDate(post.published_at)}
            </time>
            <span className="text-muted-foreground/40">·</span>
            <span>{post.reading_minutes} min read</span>
            <span className="text-muted-foreground/40">·</span>
            <span>{post.word_count.toLocaleString()} words</span>
          </div>

          <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {post.excerpt}
            </p>
          )}

          {/* Author */}
          {post.author && (
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              {post.author.avatar_url ? (
                <img
                  src={post.author.avatar_url}
                  alt={post.author.name}
                  className="h-11 w-11 rounded-full object-cover ring-2 ring-white"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">
                  {post.author.name
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold">{post.author.name}</p>
                {post.author.role_title && (
                  <p className="text-xs text-muted-foreground">
                    {post.author.role_title}
                  </p>
                )}
              </div>
            </div>
          )}
        </header>

        {/* ── Featured image ── */}
        {post.featured_image_url && (
          <div className="mb-10 overflow-hidden rounded-2xl border border-border">
            <img
              src={post.featured_image_url}
              alt={post.featured_image_alt || post.title}
              className="w-full object-cover"
            />
          </div>
        )}

        {/* ── Layout: TOC sidebar + content ── */}
        <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
          {/* Table of Contents */}
          {post.toc && post.toc.length > 0 && (
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  On this page
                </p>
                <nav className="flex flex-col gap-1 border-l-2 border-indigo-100 pl-3">
                  {post.toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-indigo-50 hover:text-indigo-700 ${
                        item.level === 2
                          ? "font-medium text-foreground"
                          : "pl-4 text-sm text-muted-foreground"
                      }`}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>

                {/* Share (sidebar) */}
                <div className="mt-8 border-t border-border pt-6">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Share
                  </p>
                  <div className="flex flex-col gap-2">
                    <a
                      href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-indigo-200 hover:text-indigo-700"
                    >
                      𝕏 Twitter
                    </a>
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-blue-200 hover:text-blue-700"
                    >
                      in LinkedIn
                    </a>
                    <button
                      onClick={copyLink}
                      className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-emerald-200 hover:text-emerald-700"
                    >
                      {copied ? "✓ Copied" : "🔗 Copy link"}
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          )}

          {/* ── Article body ── */}
          <article className="min-w-0">
            {post.content_html ? (
              <div
                className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h2:mt-10 prose-h2:text-2xl prose-h2:scroll-mt-24 sm:prose-h2:text-3xl prose-h3:mt-8 prose-h3:text-xl sm:prose-h3:text-2xl prose-p:leading-relaxed prose-p:text-foreground/90 prose-a:text-primary prose-a:underline decoration-indigo-300 underline-offset-2 hover:decoration-indigo-500 prose-a:transition-colors prose-img:rounded-xl prose-img:border prose-img:border-border prose-pre:rounded-xl prose-pre:border prose-pre:border-border prose-pre:bg-slate-50 prose-code:text-indigo-600 prose-code:before:content-none prose-code:after:content-none prose-blockquote:border-l-indigo-400 prose-blockquote:bg-indigo-50/50 prose-blockquote:rounded-r-lg prose-blockquote:py-2 prose-blockquote:pr-4 prose-li:marker:text-indigo-400 prose-strong:text-foreground prose-table:border prose-th:border prose-th:bg-slate-50 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:text-sm prose-th:font-semibold prose-td:border prose-td:px-3 prose-td:py-2 prose-td:text-sm"
                dangerouslySetInnerHTML={{ __html: post.content_html }}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
                <p className="text-lg font-medium">Content is being prepared</p>
                <p className="mt-1 text-sm">
                  This article's content is currently being formatted. Please check
                  back soon.
                </p>
              </div>
            )}

            {/* ── Tags ── */}
            {post.tags.length > 0 && (
              <div className="mt-10 flex flex-wrap gap-2 border-t border-border pt-6">
                {post.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {/* ── Mobile share bar ── */}
            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6 lg:hidden">
              <span className="text-sm font-medium text-muted-foreground">
                Share this article:
              </span>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-indigo-200 hover:text-indigo-700"
              >
                𝕏 Twitter
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-blue-200 hover:text-blue-700"
              >
                in LinkedIn
              </a>
              <button
                onClick={copyLink}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-emerald-200 hover:text-emerald-700"
              >
                {copied ? "✓ Copied!" : "🔗 Copy link"}
              </button>
            </div>

            {/* ── FAQ Section ── */}
            {post.faq && post.faq.length > 0 && (
              <section className="mt-12 border-t border-border pt-10">
                <h2 className="mb-6 text-2xl font-bold tracking-tight">
                  Frequently Asked Questions
                </h2>
                <div className="flex flex-col gap-3">
                  {post.faq.map((faq, i) => {
                    const isOpen = openFaq === i;
                    return (
                      <div
                        key={i}
                        className="overflow-hidden rounded-xl border border-border transition-colors"
                      >
                        <button
                          onClick={() => setOpenFaq(isOpen ? null : i)}
                          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold transition-colors hover:bg-slate-50 sm:text-base"
                          aria-expanded={isOpen}
                        >
                          <span className="flex-1">{faq.q}</span>
                          <svg
                            className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                        <div
                          className={`overflow-hidden transition-all ${
                            isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                          }`}
                        >
                          <div className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                            {faq.a}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </article>
        </div>

        {/* ── Related articles ── */}
        {related.length > 0 && (
          <aside className="mt-16 border-t border-border pt-10">
            <h2 className="mb-6 text-xl font-bold tracking-tight sm:text-2xl">
              More from the TavBook AI Blog
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to="/blog/$slug"
                  params={{ slug: r.slug }}
                  className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-indigo-300/60 hover:shadow-lg hover:shadow-indigo-100/40"
                >
                  <div className="flex h-32 items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                    {r.featured_image_url ? (
                      <img
                        src={r.featured_image_url}
                        alt={r.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-3xl opacity-60">
                        {r.category?.emoji || "📄"}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    {r.category && (
                      <span className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {r.category.emoji && ` ${r.category.emoji}`}
                        {r.category.name}
                      </span>
                    )}
                    <h3 className="text-sm font-semibold leading-snug group-hover:text-primary sm:text-base">
                      {r.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 flex-1 text-xs leading-relaxed text-muted-foreground">
                      {r.excerpt}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{formatDate(r.published_at)}</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span>{r.reading_minutes} min read</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </aside>
        )}

        {/* ── Newsletter CTA ── */}
        <section className="mt-16 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 text-center text-white sm:p-12">
          <div className="mx-auto max-w-lg">
            <span className="mb-3 inline-block text-3xl">📬</span>
            <h2 className="text-2xl font-bold sm:text-3xl">Never miss an insight</h2>
            <p className="mt-3 text-indigo-100">
              Join thousands of AI professionals. Get weekly deep-dives,
              comparisons, and research from the TavBook editorial team.
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
                Subscribe Free
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}