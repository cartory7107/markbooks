import { createFileRoute } from "@tanstack/react-router";
import { getCompanies, type DiscoveryTool } from "@/lib/discovery.functions";
import { absUrl, SITE_NAME } from "@/lib/site";
import { DiscoveryShell, ToolRow } from "@/components/discovery-shell";

const TITLE = `AI Companies — Makers Behind the Tools | ${SITE_NAME}`;
const DESC = `Discover the companies shipping multiple AI products, ranked by how many of their tools are indexed on TavBook, with categories and direct links.`;

type Company = {
  domain: string;
  name: string;
  total: number;
  categories: string[];
  tools: DiscoveryTool[];
};

export const Route = createFileRoute("/companies")({
  loader: () => getCompanies(),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: absUrl("/companies") },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: absUrl("/companies") }],
  }),
  errorComponent: () => (
    <DiscoveryShell title="Companies" subtitle="This page could not load right now.">
      <p className="text-sm text-muted-foreground">Please refresh to try again.</p>
    </DiscoveryShell>
  ),
  notFoundComponent: () => (
    <DiscoveryShell title="Companies" subtitle="Nothing here.">
      <p className="text-sm text-muted-foreground">That company page does not exist.</p>
    </DiscoveryShell>
  ),
  component: CompaniesPage,
});

function CompaniesPage() {
  const { companies } = Route.useLoaderData();
  const list = companies as Company[];

  return (
    <DiscoveryShell
      title="AI Companies"
      subtitle="Domains that ship more than one indexed AI product, ranked by catalog footprint."
    >
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">No multi-product companies are indexed yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((company) => (
            <section key={company.domain} className="rounded-lg border border-border bg-card p-4">
              <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-display text-[15px] font-semibold">{company.name}</h2>
                  <p className="truncate text-xs text-muted-foreground">{company.domain}</p>
                </div>
                <span className="shrink-0 rounded border border-primary/50 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {company.total} tools
                </span>
              </header>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {company.categories.map((cat) => (
                  <span key={cat} className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {cat}
                  </span>
                ))}
              </div>
              <ul className="mt-2 divide-y divide-border/60">
                {company.tools.map((tool) => (
                  <ToolRow key={company.domain + tool.slug} tool={tool} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </DiscoveryShell>
  );
}
