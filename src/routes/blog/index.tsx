import { createFileRoute, Link } from "@tanstack/react-router";
import { blogPosts } from "@/lib/blog-posts";

const BASE_URL = "https://markbook.top";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Markbook AI Blog — Guides, Reviews & AI Tool Research" },
      {
        name: "description",
        content:
          "Deep guides, comparisons, and research on the best AI tools of 2026. Written by the Markbook editorial team using our 116,000+ verified AI directory.",
      },
      { property: "og:title", content: "Markbook AI Blog — AI Tool Guides & Research" },
      { property: "og:description", content: "Guides, comparisons, and research on the best AI tools of 2026 from Markbook AI." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${BASE_URL}/blog` },
    ],
    links: [{ rel: "canonical", href: `${BASE_URL}/blog` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "Markbook AI Blog",
          url: `${BASE_URL}/blog`,
          publisher: { "@type": "Organization", name: "MarkBook", url: BASE_URL },
          blogPost: blogPosts.map((p) => ({
            "@type": "BlogPosting",
            headline: p.title,
            url: `${BASE_URL}/blog/${p.slug}`,
            datePublished: p.publishedAt,
            dateModified: p.updatedAt,
            author: { "@type": "Organization", name: p.author },
            description: p.metaDescription,
          })),
        }),
      },
    ],
  }),
  component: BlogIndex,
});

function BlogIndex() {
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
          <span>Blog</span>
        </nav>
        <header className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Markbook AI Blog</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Deep guides, honest comparisons, and research on the best AI tools of 2026 — drawn
            from our 116,000+ verified directory.
          </p>
        </header>
        <div className="grid gap-6 sm:grid-cols-2">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              to="/blog/$slug"
              params={{ slug: post.slug }}
              className="group block rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
            >
              <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <span>{new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                <span>·</span>
                <span>{post.readMinutes} min read</span>
              </div>
              <h2 className="text-xl font-semibold leading-snug group-hover:text-primary">
                {post.title}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">{post.excerpt}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {post.tags.slice(0, 4).map((t) => (
                  <span key={t} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
