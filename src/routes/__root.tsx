import { TOTAL_TOOLS, TOTAL_TOOLS_EXACT, TOTAL_TOOLS_LABEL } from "@/lib/tool-count";
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
import { useEffect, useRef, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "../assets/tavbook-symbol.png.asset.json";
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
      { title: `TavBook AI — ${TOTAL_TOOLS_LABEL} AI Tools Directory | Discover & Compare` },
      {
        name: "description",
        content:
          `TavBook AI is the world's largest AI tools directory with ${TOTAL_TOOLS_LABEL} AI tools across 500+ categories. Search, compare, and discover the best AI chatbots, image generators, video tools, code assistants, and writing tools. Free & paid. Updated daily.`,
      },
      {
        name: "keywords",
        content:
          `TavBook, TavBook AI, markbook.top, tavbook ai tools, tavbook directory, AI tools, AI tools directory, best AI tools 2026, free AI tools, AI chatbot, AI image generator, AI video generator, AI code assistant, AI writing tool, ChatGPT alternatives, Midjourney alternatives, Claude alternatives, Gemini alternatives, generative AI tools, artificial intelligence tools, AI directory 2026, top AI tools, ${TOTAL_TOOLS} AI tools, AI finder, AI catalog, AI search platform`,
      },
      { name: "application-name", content: "TavBook" },
      { name: "apple-mobile-web-app-title", content: "TavBook" },
      { name: "author", content: "TavBook" },
      { name: "publisher", content: "TavBook" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { name: "googlebot", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { name: "bingbot", content: "index, follow" },
      { property: "og:title", content: `TavBook AI — ${TOTAL_TOOLS_LABEL} AI Tools Directory` },
      { property: "og:description", content: `Discover, compare & search ${TOTAL_TOOLS_LABEL} AI tools across 500+ categories. The world's largest AI directory.` },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "TavBook" },
      { property: "og:url", content: "https://markbook.top" },
      { property: "og:locale", content: "en_US" },
      { property: "og:image", content: "https://markbook.top/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: `TavBook AI — ${TOTAL_TOOLS_LABEL} AI Tools Directory` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@tavbook" },
      { name: "twitter:creator", content: "@tavbook" },
      { name: "twitter:title", content: `TavBook AI — ${TOTAL_TOOLS_LABEL} AI Tools Directory` },
      { name: "twitter:description", content: `Discover, compare & search ${TOTAL_TOOLS_LABEL} AI tools across 500+ categories.` },
      { name: "twitter:image", content: "https://markbook.top/og-image.png" },
      { name: "theme-color", content: "#0a0a0a" },
      { name: "color-scheme", content: "dark light" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "format-detection", content: "telephone=no" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "canonical", href: "https://markbook.top" },
      // Favicon chain — multiple sizes so Google Search, browser tabs, and PWA all
      // resolve a valid logo even when a specific size fails or the CDN is slow.
      { rel: "icon", type: "image/png", sizes: "any", href: "/favicon.png" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/favicon.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/favicon.png" },
      { rel: "shortcut icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/favicon.png" },
      { rel: "mask-icon", href: "/favicon.png", color: "#0a0a0a" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "alternate", type: "application/rss+xml", title: "TavBook Blog RSS", href: "https://markbook.top/rss.xml" },
      { rel: "sitemap", type: "application/xml", href: "https://markbook.top/sitemap.xml" },
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
          "name": "TavBook",
          "alternateName": ["TavBook AI", "TavBook AI Tools Directory", "markbook.top"],
          "url": "https://markbook.top",
          "description": `TavBook is the world's largest AI tools directory with ${TOTAL_TOOLS_LABEL} AI tools across 500+ categories.`,
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://markbook.top/?q={search_term_string}",
            "query-input": "required name=search_term_string"
          },
          "publisher": {
            "@type": "Organization",
            "name": "TavBook",
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
          "@id": "https://markbook.top/#organization",
          "name": "TavBook",
          "alternateName": ["TavBook AI", "markbook.top", "TavBook AI Tools Directory"],
          "url": "https://markbook.top",
          "logo": {
            "@type": "ImageObject",
            "url": "https://markbook.top/favicon.png",
            "width": 512,
            "height": 512,
            "caption": "TavBook logo"
          },
          "image": "https://markbook.top/og-image.png",
          "description": `TavBook — the world's largest AI tools directory. Discover, compare, and search ${TOTAL_TOOLS_LABEL} AI tools across 500+ categories.`,
          "foundingDate": "2024",
          "sameAs": [
            "https://markbook.top",
            "https://markbooks.lovable.app"
          ]
        }),
      },

      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Dataset",
          "name": "TavBook AI Tools Directory",
          "description": `A comprehensive directory of ${TOTAL_TOOLS_LABEL} AI tools spanning 500+ categories, including pricing, descriptions, categories, and direct links.`,
          "url": "https://markbook.top/tools-dictionary.json",
          "creator": { "@type": "Organization", "name": "TavBook" },
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
              "name": "What is TavBook?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": `TavBook is the world's largest AI tools directory with ${TOTAL_TOOLS_LABEL} AI tools across 500+ categories. It helps users discover, compare, and choose the best AI tools for any task.`
              }
            },
            {
              "@type": "Question",
              "name": "Is TavBook free to use?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, TavBook is completely free. Search, browse, and compare AI tools without any cost."
              }
            },
            {
              "@type": "Question",
              "name": "How many AI tools are on TavBook?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": `TavBook features ${TOTAL_TOOLS_EXACT} AI tools spanning 500+ categories. New tools are added daily.`
              }
            },
            {
              "@type": "Question",
              "name": "How to find the best AI tool?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Use TavBook's search to find by keyword, browse categories, or filter by pricing. Sort by popularity or newest."
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
  const shownAtRef = useRef<number>(Date.now());

  // Minimum time the splash stays on screen so it never "flashes".
  const MIN_VISIBLE = 900;
  // Ignore very short navigations entirely (no flicker for instant routes).
  const SHOW_DELAY = 400;

  // Hide the initial splash after the first paint settles, but never sooner
  // than MIN_VISIBLE so the animation can actually be seen.
  useEffect(() => {
    setMounted(true);
    const remaining = Math.max(0, MIN_VISIBLE - (Date.now() - shownAtRef.current));
    const t = window.setTimeout(() => setVisible(false), remaining);
    return () => window.clearTimeout(t);
  }, []);

  // On navigation: only show the splash if the load takes a noticeable time,
  // and once shown keep it up for MIN_VISIBLE before fading out.
  useEffect(() => {
    if (!mounted) return;
    if (isLoading) {
      const t = window.setTimeout(() => {
        shownAtRef.current = Date.now();
        setVisible(true);
      }, SHOW_DELAY);
      return () => window.clearTimeout(t);
    }
    const remaining = Math.max(0, MIN_VISIBLE - (Date.now() - shownAtRef.current));
    const t = window.setTimeout(() => setVisible(false), remaining);
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
        transition: "opacity 420ms ease",
      }}
    >
      <img
        src={logoAsset.url}
        alt="TavBook"
        width={88}
        height={88}
        style={{
          width: 88,
          height: 88,
          objectFit: "contain",
          filter: "drop-shadow(0 8px 32px rgba(99,102,241,0.35))",
          animation: "mb-logo-pulse 2.2s ease-in-out infinite",
        }}
      />
      <div className="mb-loader-bars" aria-label="Loading">
        <span /><span /><span /><span /><span />
      </div>
      <div className="mb-loader-text">Loading TavBook…</div>
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
