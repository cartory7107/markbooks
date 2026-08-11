import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Newspaper, ArrowLeft, ExternalLink } from "lucide-react";
import { SITE_URL } from "@/lib/site";

interface NewsItem {
  title: string;
  time: string;
  url?: string;
  source?: string;
}

export const Route = createFileRoute("/news")({
  component: NewsPage,
  head: () => ({
    meta: [
      { title: "Latest AI News — Trending AI Updates Today | TavBook" },
      {
        name: "description",
        content:
          "Live AI news feed on TavBook: today's trending artificial intelligence launches, model releases, funding and research updates, refreshed continuously.",
      },
      { property: "og:title", content: "Latest AI News — Trending AI Updates Today | TavBook" },
      {
        property: "og:description",
        content: "Today's trending AI news, model launches and research updates, updated live on TavBook.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/news` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/news` }],
  }),
});

function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/ai-news-api.json")
      .then((r) => r.json())
      .then((data: NewsItem[]) => setNews(data))
      .catch(() => setNews([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Link to="/" className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to feed
        </Link>

        <header className="mb-5 flex items-center gap-2">
          <Newspaper className="size-5 shrink-0 text-primary" />
          <h1 className="text-xl font-bold">Latest AI News</h1>
        </header>
        <p className="mb-6 text-sm text-muted-foreground">
          Trending artificial-intelligence stories right now — model launches, research, funding and product updates.
        </p>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="mb-skeleton block h-16 w-full rounded-xl">&nbsp;</div>
            ))}
          </div>
        ) : news.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            News is temporarily unavailable. Please try again shortly.
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {news.map((item, i) => (
              <li key={i}>
                <a
                  href={item.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent"
                >
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium leading-5">{item.title}</span>
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {item.time}
                      {item.source ? ` · ${item.source}` : ""}
                    </span>
                  </span>
                  <ExternalLink className="mt-1 size-3.5 shrink-0 text-muted-foreground" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
