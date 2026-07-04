import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getTopToolsBundle } from "@/lib/catalog-server";
import { getAdminOverlay } from "@/lib/admin-overlay.server";

/**
 * Lightweight API endpoint — returns only the data the homepage needs:
 * top 20 tools, categories, emojis, total count, and hidden gems.
 * Response is ~10-15 KB instead of the full 11 MB catalog.
 *
 * Usage: GET /tools-api.json
 */
export const Route = createFileRoute("/tools-api.json")({
  server: {
    handlers: {
      GET: async () => {
        const overlay = await getAdminOverlay();
        const data = getTopToolsBundle(overlay);
        return new Response(JSON.stringify(data), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=5, s-maxage=5",
          },
        });
      },
    },
  },
});
