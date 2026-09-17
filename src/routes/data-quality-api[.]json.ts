import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getRawCatalog, slugify, type Tool } from "@/lib/catalog-server";
import { getAdminOverlay, applyOverlay } from "@/lib/admin-overlay.server";
import { scoreTool, summarizeQuality } from "@/lib/quality.server";

/**
 * Chapter 06 — data-quality report for the whole catalogue.
 *
 * Returns the indexability breakdown (index / thin / excluded), duplicate
 * count, average score and the most common problems, plus a sample of the
 * weakest listings so they can be fixed or removed from the admin panel.
 *
 * Usage: GET /data-quality-api.json?sample=100
 */
export const Route = createFileRoute("/data-quality-api.json")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const sampleSize = Math.min(500, Math.max(0, parseInt(url.searchParams.get("sample") || "100", 10)));

        const raw = getRawCatalog();
        const overlay = await getAdminOverlay();
        const tools: Tool[] = applyOverlay(raw.tools, overlay);

        const summary = summarizeQuality(tools);

        const worst: Array<{ name: string; slug: string; url: string; score: number; tier: string; reasons: string[] }> = [];
        if (sampleSize > 0) {
          for (const t of tools) {
            const r = scoreTool(t);
            if (r.tier === "index") continue;
            worst.push({
              name: t.n,
              slug: slugify(t.n || ""),
              url: t.u,
              score: r.score,
              tier: r.tier,
              reasons: r.reasons,
            });
            if (worst.length >= sampleSize * 4) break;
          }
          worst.sort((a, b) => a.score - b.score);
          worst.length = Math.min(worst.length, sampleSize);
        }

        return new Response(JSON.stringify({ summary, worst }), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "private, max-age=60",
          },
        });
      },
    },
  },
});
