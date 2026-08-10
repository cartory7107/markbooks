import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import type { DiscoveryTool } from "@/lib/discovery.functions";

/**
 * Shared chrome for the discovery sections (collections, companies, models).
 * Static, flat surfaces — no animation, matching the premium dark system.
 */
export function DiscoveryShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-[1480px] items-center gap-4 px-4 py-3">
          <Link to="/" className="font-display text-lg font-bold">
            Tav<span className="text-primary">Book</span>
          </Link>
          <nav className="ml-auto flex items-center gap-1 text-sm">
            <Link to="/categories" className="rounded-md px-2.5 py-1.5 text-muted-foreground hover:bg-elevated hover:text-foreground">
              Categories
            </Link>
            <Link to="/collections" className="rounded-md px-2.5 py-1.5 text-muted-foreground hover:bg-elevated hover:text-foreground">
              Collections
            </Link>
            <Link to="/models" className="rounded-md px-2.5 py-1.5 text-muted-foreground hover:bg-elevated hover:text-foreground">
              Models
            </Link>
            <Link to="/companies" className="rounded-md px-2.5 py-1.5 text-muted-foreground hover:bg-elevated hover:text-foreground">
              Companies
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1480px] px-4 py-8">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-7">{children}</div>
      </main>
    </div>
  );
}

export function ToolRow({ tool }: { tool: DiscoveryTool }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <Link
        to="/tool/$slug"
        params={{ slug: tool.slug }}
        className="min-w-0 flex-1"
      >
        <span className="block truncate text-sm font-semibold">{tool.name}</span>
        <span className="block truncate text-xs text-muted-foreground">{tool.desc}</span>
      </Link>
      <span className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
        {tool.pricing}
      </span>
      <a
        href={tool.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        aria-label={`Visit ${tool.name}`}
        className="shrink-0 rounded-md border border-border p-1.5 text-muted-foreground hover:bg-elevated hover:text-foreground"
      >
        <ExternalLink className="size-3.5" />
      </a>
    </li>
  );
}
