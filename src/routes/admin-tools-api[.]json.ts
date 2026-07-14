import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getRawCatalog, type Tool } from "@/lib/catalog-server";
import { getAdminOverlay, applyOverlay } from "@/lib/admin-overlay.server";

/**
 * Admin-only endpoint: returns the FULL raw catalog (all ~116K tools,
 * including duplicates and broken-link entries) with the admin overlay
 * applied. No ranking, no exclusive injection, no dedup — admins need
 * to see everything so they can edit or remove anything.
 *
 * Usage: GET /admin-tools-api.json?offset=0&limit=200000
 */
export const Route = createFileRoute("/admin-tools-api.json")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const offset = parseInt(url.searchParams.get("offset") || "0", 10);
        const limit = parseInt(url.searchParams.get("limit") || "200000", 10);

        const raw = getRawCatalog();
        const overlay = await getAdminOverlay();
        const tools: Tool[] = applyOverlay(raw.tools, overlay);
        const total = tools.length;
        const results = tools.slice(offset, offset + limit);

        // Rebuild category counts from the (possibly overlaid) full set.
        const categories: Record<string, number> = {};
        for (const t of tools) categories[t.c] = (categories[t.c] || 0) + 1;

        return new Response(JSON.stringify({ results, total, categories }), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "private, max-age=5",
          },
        });
      },
    },
  },
});
