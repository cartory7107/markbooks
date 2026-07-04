import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getCatalog, getCategoryEmojis, slugify, normalizeCategory } from "@/lib/catalog-server";
import { getAdminOverlay, applyOverlay } from "@/lib/admin-overlay.server";


const loadCategories = createServerFn({ method: "GET" }).handler(async () => {
  const overlay = await getAdminOverlay();
  const catalog = getCatalog();
  const tools = applyOverlay(catalog.tools, overlay);
  const emojis = getCategoryEmojis();

  const counts: Record<string, number> = {};
  for (const t of tools) {
    const nc = normalizeCategory(t.c);
    counts[nc] = (counts[nc] || 0) + 1;
  }

  const list = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      count,
      emoji: emojis[name] || pickEmoji(name),
      slug: slugify(name),
    }));

  return { categories: list, total: tools.length };
});

// Deterministic emoji fallback so every category has something unique-ish.
function pickEmoji(name: string) {
  const POOL = ["✨","🚀","🎨","🎬","🎧","🧠","🤖","📈","💡","📸","📝","🧩","💬","🔍","⚡","🎯","🛠️","📊","🧪","🌟","🔮","🎓","🏆","🌈","🎪","🎭","🎮","💎","🔥","⚙️","🧬","🧭","🖌️","🖼️","🎼","🎹","🎤","📽️","🎥","🗂️","📚","🧾","💼","🏢","🛒","🏷️","🧮","🧰","🔗","📡"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return POOL[h % POOL.length];
}

export const Route = createFileRoute("/categories")({
  loader: () => loadCategories(),
  head: () => ({
    meta: [
      { title: "All AI Categories — MarkBook" },
      { name: "description", content: "Browse every AI tool category on MarkBook — from AI writing and image generation to marketing, productivity and business automation." },
      { property: "og:title", content: "All AI Categories — MarkBook" },
      { property: "og:description", content: "Every AI tool category tracked on MarkBook, with emoji icons and live counts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: () => <div className="p-8 text-center">Failed to load categories.</div>,
  notFoundComponent: () => <div className="p-8 text-center">Not found.</div>,
  component: CategoriesPage,
});

function CategoriesPage() {
  const { categories, total } = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-lg font-extrabold">
            Mark<span className="text-primary">Book</span>
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Home</Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">All AI Categories</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {categories.length} categories · {total.toLocaleString()} AI tools indexed. Tap any category to open its full listing.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {categories.map((c: { name: string; count: number; emoji: string; slug: string }) => (
            <Link
              key={c.slug}
              to="/category/$slug"
              params={{ slug: c.slug }}
              className="group flex flex-col items-start gap-2 rounded-xl border-2 border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
            >
              <span className="text-3xl leading-none">{c.emoji}</span>
              <span className="text-sm font-bold text-foreground line-clamp-2">{c.name}</span>
              <span className="text-[11px] font-semibold text-primary">
                {c.count.toLocaleString()} tools
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
