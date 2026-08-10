/**
 * TavBook-hosted logo endpoint: /api/public/logo/{domain}
 * - ready  → streams the stored bytes from Supabase Storage with immutable caching
 * - not ready → enqueues the domain and instantly returns a lightweight placeholder
 *   (the background worker at /api/public/logo-worker does the discovery work)
 * Visitors never wait on third-party sites and never request a third-party host.
 */
import { createFileRoute } from "@tanstack/react-router";

const IMMUTABLE = "public, max-age=31536000, s-maxage=31536000, immutable";
const QUEUED = "public, max-age=300, s-maxage=300";
const PLACEHOLDER_CACHE = "public, max-age=86400, s-maxage=86400";
const RETRY_FAILED_MS = 14 * 24 * 60 * 60 * 1000;

export const Route = createFileRoute("/api/public/logo/$domain")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const { normalizeDomain, processDomainLogo, placeholderSvg, LOGO_BUCKET } = await import(
          "@/lib/logo-pipeline.server"
        );
        const svg = (seed: string, cache: string) =>
          new Response(placeholderSvg(seed), {
            headers: { "content-type": "image/svg+xml; charset=utf-8", "cache-control": cache },
          });

        const raw = decodeURIComponent(params.domain ?? "");
        const domain = normalizeDomain(raw);
        if (!domain) return svg(raw || "AI", PLACEHOLDER_CACHE);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const serveStored = async (path: string, type: string | null) => {
          const { data, error } = await supabaseAdmin.storage.from(LOGO_BUCKET).download(path);
          if (error || !data) return null;
          return new Response(await data.arrayBuffer(), {
            headers: {
              "content-type": type || "image/png",
              "cache-control": IMMUTABLE,
              "x-tavbook-logo": "hosted",
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
          return svg(domain, PLACEHOLDER_CACHE);
        }

        // Optional synchronous mode for admin tooling / warm-up scripts.
        if (new URL(request.url).searchParams.get("sync") === "1") {
          const result = await processDomainLogo(domain);
          if (result.status === "ready" && result.storage_path) {
            const served = await serveStored(result.storage_path, result.content_type);
            if (served) return served;
          }
          return svg(domain, result.status === "failed" ? PLACEHOLDER_CACHE : QUEUED);
        }

        if (!row) {
          await supabaseAdmin
            .from("tool_logos")
            .upsert({ domain, status: "pending" }, { onConflict: "domain", ignoreDuplicates: true });
        }
        return svg(domain, QUEUED);
      },
    },
  },
});
