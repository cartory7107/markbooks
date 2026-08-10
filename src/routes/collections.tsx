import { createFileRoute, Link } from "@tanstack/react-router";
import { getCollections } from "@/lib/discovery.functions";
import { absUrl, SITE_NAME } from "@/lib/site";
import { TOTAL_TOOLS_LABEL } from "@/lib/tool-count";
import { DiscoveryShell, ToolRow } from "@/components/discovery-shell";

const TITLE = `AI Tool Collections — Curated Sets by Category | ${SITE_NAME}`;
const DESC = `Browse curated AI tool collections built from ${TOTAL_TOOLS_LABEL} indexed products. Jump straight into the largest categories on TavBook.`;

export const Route = createFileRoute("/collections")({
  loader: () => getCollections(),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: absUrl("/collections") },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: absUrl("/collections") }],
  }),
  errorComponent: () => (
    <DiscoveryShell title="Collections" subtitle="This page could not load right now.">
      <p className="text-sm text-muted-foreground">Please refresh to try again.</p>
    </DiscoveryShell>
  ),
  notFoundComponent: () => (
    <DiscoveryShell title="Collections" subtitle="Nothing here.">
      <p className="text-sm text-muted-foreground">That collection does not exist.</p>
    </DiscoveryShell>
  ),
  component: CollectionsPage,
});

function CollectionsPage() {
  const { groups } = Route.useLoaderData();

  return (
    <DiscoveryShell
      title="Collections"
      subtitle={`Curated entry points into the largest parts of the ${TOTAL_TOOLS_LABEL} tool index.`}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((group) => (
          <section key={group.slug} className="rounded-lg border border-border bg-card p-4">
            <header className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-display text-base font-semibold">{group.title}</h2>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{group.subtitle}</p>
              </div>
              <Link
                to="/category/$slug"
                params={{ slug: group.slug }}
                className="shrink-0 rounded-md border border-primary/50 bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary"
              >
                View all
              </Link>
            </header>
            <ul className="mt-3 divide-y divide-border/60">
              {group.tools.map((tool) => (
                <ToolRow key={`${group.slug}-${tool.slug}`} tool={tool} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </DiscoveryShell>
  );
}
