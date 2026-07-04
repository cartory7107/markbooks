import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { searchTools } from "@/lib/catalog-server";
import { getAdminOverlay } from "@/lib/admin-overlay.server";

/**
 * Server-side search endpoint with pagination.
 * Searches the full 116K+ catalog on the server and returns paginated results.
 * Response is ~5-50 KB per request instead of downloading the full catalog.
 *
 * Usage: GET /search-api.json?q=chatgpt&category=All&pricing=All&offset=0&limit=20
 */
export const Route = createFileRoute("/search-api.json")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get("q") || "";
        const category = url.searchParams.get("category") || "All";
        const pricing = url.searchParams.get("pricing") || "All";
        const sort = url.searchParams.get("sort") || "";
        const offset = parseInt(url.searchParams.get("offset") || "0", 10);
        const limit = parseInt(url.searchParams.get("limit") || "20", 10);

        const overlay = await getAdminOverlay();
        const data = searchTools({ q, category, pricing, sort, offset, limit, overlay });

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
