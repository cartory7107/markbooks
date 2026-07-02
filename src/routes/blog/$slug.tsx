import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getPost, blogPosts } from "@/lib/blog-posts";

const BASE_URL = "https://markbook.top";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = getPost(params.slug);
    if (!post) throw notFound();
    return post;
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Article not found — Markbook AI" }, { name: "robots", content: "noindex" }] };
    }
    const url = `${BASE_URL}/blog/${params.slug}`;
    return {
      meta: [
        { title: loaderData.metaTitle },
        { name: "description", content: loaderData.metaDescription },
        { name: "keywords", content: loaderData.tags.join(", ") },
        { name: "author", content: loaderData.author },
        { property: "og:title", content: loaderData.ogTitle },
        { property: "og:description", content: loaderData.ogDescription },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "article:published_time", content: loaderData.publishedAt },
        { property: "article:modified_time", content: loaderData.updatedAt },
        { property: "article:author", content: loaderData.author },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: loaderData.ogTitle },
        { name: "twitter:description", content: loaderData.ogDescription },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": loaderData.schemaType,
            headline: loaderData.title,
            description: loaderData.metaDescription,
            author: { "@type": "Organization", name: loaderData.author, url: BASE_URL },
            publisher: {
              "@type": "Organization",
              name: "MarkBook",
              logo: { "@type": "ImageObject", url: `${BASE_URL}/favicon.png` },
            },
            datePublished: loaderData.publishedAt,
            dateModified: loaderData.updatedAt,
            mainEntityOfPage: url,
            keywords: loaderData.tags.join(", "),
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: loaderData.faq.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
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
              { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE_URL}/blog` },
              { "@type": "ListItem", position: 3, name: loaderData.title, item: url },
            ],
          }),
        },
      ],
    };
  },
  component: BlogPost,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Article not found</h1>
      <p className="mt-2 text-muted-foreground">This article does not exist or has been moved.</p>
      <Link to="/blog" className="mt-6 inline-block text-primary hover:underline">Back to blog</Link>
    </div>
  ),
});

function BlogPost() {
  const post = Route.useLoaderData();
  const related = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 3);

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
      <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <nav className="mb-8 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/blog" className="hover:text-foreground">Blog</Link>
          <span className="mx-2">/</span>
          <span>{post.title}</span>
        </nav>

        <header className="mb-10">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <span>{new Date(post.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
            <span>·</span>
            <span>{post.readMinutes} min read</span>
            <span>·</span>
            <span>by {post.author}</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{post.title}</h1>
          <p className="mt-5 text-lg text-muted-foreground">{post.excerpt}</p>
        </header>

        <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h2:mt-12 prose-h2:text-3xl prose-p:leading-relaxed prose-p:text-foreground/90 prose-a:text-primary">
          {post.intro.map((p, i) => (
            <p key={`intro-${i}`}>{p}</p>
          ))}

          {post.sections.map((section, i) => (
            <section key={i}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
              {section.list && (
                <ul>
                  {section.list.map((item, k) => (
                    <li key={k}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <section>
            <h2>Frequently asked questions</h2>
            {post.faq.map((f, i) => (
              <div key={i} className="mb-6">
                <h3 className="text-lg font-semibold">{f.q}</h3>
                <p className="mt-2">{f.a}</p>
              </div>
            ))}
          </section>

          <section>
            <h2>Explore next</h2>
            <ul>
              {post.internalLinks.map((l) => (
                <li key={l.to}>
                  <a href={l.to}>{l.label}</a>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {related.length > 0 && (
          <aside className="mt-16 border-t border-border pt-10">
            <h2 className="mb-6 text-xl font-semibold">More from the Markbook AI blog</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  to="/blog/$slug"
                  params={{ slug: r.slug }}
                  className="block rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
                >
                  <h3 className="font-semibold">{r.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{r.excerpt}</p>
                </Link>
              ))}
            </div>
          </aside>
        )}
      </article>
    </div>
  );
}
