import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold gradient-text">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient; auth: { user: User | null } }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MarkBook — 116,000+ AI Tools Directory | Discover, Compare & Search the Best AI" },
      {
        name: "description",
        content:
          "MarkBook is the world's largest AI tools directory with 116,000+ AI tools across 500+ categories. Search, compare, and discover the best AI chatbots, image generators, video tools, code assistants, writing tools, and more. Free & paid. Updated daily.",
      },
      {
        name: "keywords",
        content:
          "MarkBook, MarkBook AI, markbook.top, MarkBook AI tools, MarkBook directory, AI tools, AI tools directory, best AI tools 2026, free AI tools, AI chatbot, AI image generator, AI video generator, AI code assistant, AI writing tool, AI music generator, AI voice generator, AI search engine, AI assistant, AI directory, AI tools list, AI tools comparison, AI software, ChatGPT alternatives, Midjourney alternatives, Claude alternatives, Gemini alternatives, generative AI tools, artificial intelligence tools, AI dictionary, AI encyclopedia, AI research, AI research tools, AI tool list, ai directory, ai research, ai tool, ai tool list, best AI directory, top AI tools 2026, 116000 AI tools, 116K AI tools, AI finder, discover AI tools, AI catalog, comprehensive AI directory, AI search platform, all AI tools in one place, AI tools review, AI tools comparison site, markbook",
      },
      { name: "application-name", content: "MarkBook" },
      { name: "apple-mobile-web-app-title", content: "MarkBook" },
      { name: "author", content: "MarkBook" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { property: "og:title", content: "MarkBook — 116,000+ AI Tools Directory | Discover, Compare & Search the Best AI" },
      { property: "og:description", content: "MarkBook is the world's largest AI tools directory with 116,000+ AI tools across 500+ categories. Search, compare, and discover the best AI tools. Updated daily." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "MarkBook" },
      { property: "og:url", content: "https://markbook.top" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@markbook" },
      { name: "twitter:title", content: "MarkBook — 116,000+ AI Tools Directory | Discover, Compare & Search the Best AI" },
      { name: "twitter:description", content: "MarkBook is the world's largest AI tools directory with 116,000+ AI tools across 500+ categories. Updated daily." },
      { property: "og:image", content: "https://markbook.top/og-image.png" },
      { name: "twitter:image", content: "https://markbook.top/og-image.png" },
      { name: "description", content: "MarkBook — 116,000+ AI Tools Directory | Discover, Compare & Search the Best AI" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "canonical", href: "https://markbook.top" },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "shortcut icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "preconnect", href: "https://icon.horse" },
      { rel: "preconnect", href: "https://www.google.com" },
      { rel: "preconnect", href: "https://icons.duckduckgo.com" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "MarkBook",
          "alternateName": ["MarkBook AI", "MarkBook AI Tools Directory", "markbook.top"],
          "url": "https://markbook.top",
          "description": "MarkBook is the world's largest AI tools directory with 116,000+ AI tools across 500+ categories.",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://markbook.top/?q={search_term_string}",
            "query-input": "required name=search_term_string"
          },
          "publisher": {
            "@type": "Organization",
            "name": "MarkBook",
            "url": "https://markbook.top",
            "logo": { "@type": "ImageObject", "url": "https://markbook.top/favicon.png" }
          }
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "MarkBook",
          "alternateName": "MarkBook AI",
          "url": "https://markbook.top",
          "logo": "https://markbook.top/favicon.png",
          "description": "MarkBook — the world's largest AI tools directory. Discover, compare, and search 116,000+ AI tools.",
          "sameAs": ["https://markbook.top"]
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Dataset",
          "name": "MarkBook AI Tools Directory",
          "description": "A comprehensive directory of 116,000+ AI tools spanning 500+ categories, including pricing, descriptions, categories, and direct links.",
          "url": "https://markbook.top/tools-dictionary.json",
          "creator": { "@type": "Organization", "name": "MarkBook" },
          "distribution": { "@type": "DataDownload", "encodingFormat": "application/json", "contentUrl": "https://markbook.top/tools-dictionary.json" },
          "temporalCoverage": "2024/2026",
          "spatialCoverage": "Worldwide"
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What is MarkBook?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "MarkBook is the world's largest AI tools directory with 116,000+ AI tools across 500+ categories. It helps users discover, compare, and choose the best AI tools for any task."
              }
            },
            {
              "@type": "Question",
              "name": "Is MarkBook free to use?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, MarkBook is completely free. Search, browse, and compare AI tools without any cost."
              }
            },
            {
              "@type": "Question",
              "name": "How many AI tools are on MarkBook?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "MarkBook features over 116,000 AI tools spanning 500+ categories. New tools are added daily."
              }
            },
            {
              "@type": "Question",
              "name": "How to find the best AI tool?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Use MarkBook's search to find by keyword, browse categories, or filter by pricing. Sort by popularity or newest."
              }
            }
          ]
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://markbook.top" },
            { "@type": "ListItem", "position": 2, "name": "AI Tools Directory", "item": "https://markbook.top" },
          ]
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />


      </body>
    </html>
  );
}

function SplashOverlay() {
  const status = useRouterState({ select: (s) => s.status });
  const isLoading = status === "pending";
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Hide initial splash after first paint settles
  useEffect(() => {
    setMounted(true);
    const t = window.setTimeout(() => setVisible(false), 350);
    return () => window.clearTimeout(t);
  }, []);

  // Show splash whenever router is navigating; hide shortly after it settles
  useEffect(() => {
    if (!mounted) return;
    if (isLoading) {
      setVisible(true);
      return;
    }
    const t = window.setTimeout(() => setVisible(false), 180);
    return () => window.clearTimeout(t);
  }, [isLoading, mounted]);

  return (
    <div
      id="mb-initial-loader"
      aria-hidden={!visible}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "14px",
        background: "var(--background)",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 220ms ease",
      }}
    >
      <div className="mb-loader-bars" aria-label="Loading">
        <span /><span /><span /><span /><span />
      </div>
      <div className="mb-loader-text">Loading MarkBook…</div>
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {

    supabase.auth.getUser().then(({ data, error }) => {
      if (!error) setUser(data.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        supabase.auth.getUser().then(({ data, error }) => {
          if (!error) setUser(data.user);
        });
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SplashOverlay />
      <Outlet />
    </QueryClientProvider>
  );
}
