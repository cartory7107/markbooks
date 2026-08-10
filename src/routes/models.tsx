import { createFileRoute } from "@tanstack/react-router";
import { getModelTools, type DiscoveryTool } from "@/lib/discovery.functions";
import { absUrl, SITE_NAME } from "@/lib/site";
import { DiscoveryShell, ToolRow } from "@/components/discovery-shell";

const TITLE = `AI Models Directory — LLMs, Diffusion & Foundation Tools | ${SITE_NAME}`;
const DESC = `Explore model-centric AI products on TavBook: large language models, diffusion image models, embeddings and foundation-model platforms with pricing at a glance.`;

export const Route = createFileRoute("/models")({
  loader: () => getModelTools(),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: absUrl("/models") },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: absUrl("/models") }],
  }),
  errorComponent: () => (
    <DiscoveryShell title="Models" subtitle="This page could not load right now.">
      <p className="text-sm text-muted-foreground">Please refresh to try again.</p>
    </DiscoveryShell>
  ),
  notFoundComponent: () => (
    <DiscoveryShell title="Models" subtitle="Nothing here.">
      <p className="text-sm text-muted-foreground">That model page does not exist.</p>
    </DiscoveryShell>
  ),
  component: ModelsPage,
});

function ModelsPage() {
  const { tools, total } = Route.useLoaderData();
  const list = tools as DiscoveryTool[];

  return (
    <DiscoveryShell
      title="AI Models"
      subtitle={`${total.toLocaleString("en-US")} model-centric entries in the index — LLMs, diffusion models, embeddings and the platforms that serve them. Showing the top ${list.length}.`}
    >
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">No model entries are indexed yet.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {chunk(list, Math.ceil(list.length / 2)).map((column, i) => (
            <ul key={i} className="divide-y divide-border/60 rounded-lg border border-border bg-card px-4">
              {column.map((tool) => (
                <ToolRow key={tool.slug + tool.url} tool={tool} />
              ))}
            </ul>
          ))}
        </div>
      )}
    </DiscoveryShell>
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0) return [arr];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
