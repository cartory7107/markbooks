/**
 * TavBook-hosted logo endpoint: /api/public/logo/{domain}
 * Serves the stored logo bytes from Supabase Storage with long-lived caching.
 * On first ever request for a domain it runs the one-time discovery pipeline;
 * every later request (for every visitor) is served from TavBook + CDN cache.
 */
import { createFileRoute } from "@tanstack/react-router";

const IMMUTABLE = "public, max-age=31536000, s-maxage=31536000, immutable";
const SHORT = "public, max-age=120, s-maxage=120";
const PLACEHOLDER_CACHE = "public, max-age=86400, s-maxage=86400";
const STALE_PROCESSING_MS = 3 * 60 * 1000;
const RETRY_FAILED_MS = 14 * 24 * 60 * 60 * 1000;

function svgResponse(seed: string, cache: string, placeholderSvg: (s: string) => string) {
  return new Response(placeholderSvg(seed), {
    headers: { "content-type": "image/svg+xml; charset=utf-8", "cache-control": cache },
  });
}

export const Route = createFileRoute("/api/public/logo/$domain")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { normalizeDomain, processDomainLogo, placeholderSvg, LOGO_BUCKET } = await import(
          "@/lib/logo-pipeline.server"
        );
        const raw = decodeURIComponent(params.domain ?? "");
        const domain = normalizeDomain(raw);
        if (!domain) return svgResponse(raw || "AI", PLACEHOLDER_CACHE, placeholderSvg);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const serveStored = async (path: string, type: string | null) => {
          const { data, error } = await supabaseAdmin.storage.from(LOGO_BUCKET).download(path);
          if (error || !data) return null;
          return new Response(await data.arrayBuffer(), {
            headers: {
              "content-type": type || "image/png",
              "cache-control": IMMUTABLE,
              "x-tavbook-logo": "stored",
            },
          });
        };

        const { data: row } = await supabaseAdmin
          .from("tool_logos")
          .select("status, storage_path, content_type, updated_at")
          .eq("domain", domain)
          .maybeSingle();

        if (row?.status === "ready" && row.storage_path) {
          const served = await serveStored(row.storage_path, row.content_type);
          if (served) return served;
        }

        const age = row ? Date.now() - new Date(row.updated_at).getTime() : Infinity;
        if (row?.status === "failed" && age < RETRY_FAILED_MS) {
          return svgResponse(domain, PLACEHOLDER_CACHE, placeholderSvg);
        }
        if (row?.status === "processing" && age < STALE_PROCESSING_MS) {
          return svgResponse(domain, SHORT, placeholderSvg);
        }

        // One-time processing, bounded so a slow third-party site never stalls a visitor.
        const result = await Promise.race([
          processDomainLogo(domain),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 9000)),
        ]);

        if (result?.status === "ready" && result.storage_path) {
          const served = await serveStored(result.storage_path, result.content_type);
          if (served) return served;
        }
        return svgResponse(
          domain,
          result?.status === "failed" ? PLACEHOLDER_CACHE : SHORT,
          placeholderSvg,
        );
      },
    },
  },
});
