import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

/**
 * Returns all blog categories with post counts (published + total).
 *
 * Used by:
 *   - Admin panel (needs published + total counts)
 *   - Public blog page (needs published counts for nav badges)
 *
 * Usage: GET /blog-categories-api.json
 *
 * Response:
 *   {
 *     categories: [...],
 *     counts: {
 *       "ai-tools": { published: 12, total: 15 },
 *       "productivity": { published: 8, total: 9 },
 *       ...
 *     }
 *   }
 */
export const Route = createFileRoute("/blog-categories-api.json")({
  server: {
    handlers: {
      GET: async () => {
        // Dynamic import — route files ship to the client bundle at build time
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        try {
          // Fetch all categories ordered by sort_order
          const { data: categories, error: catErr } = await supabaseAdmin
            .from("blog_categories")
            .select("*")
            .order("sort_order", { ascending: true });

          if (catErr) throw catErr;

          // Count published posts per category
          const { data: publishedRows, error: pubErr } = await supabaseAdmin
            .from("blog_posts")
            .select("category_id, status")
            .eq("status", "published")
            .not("published_at", "is", null)
            .lte("published_at", new Date().toISOString());

          if (pubErr) throw pubErr;

          // Count total (all-status) posts per category
          const { data: totalRows, error: totErr } = await supabaseAdmin
            .from("blog_posts")
            .select("category_id");

          if (totErr) throw totErr;

          // Build a slug → category_id map
          const slugToId = new Map<string, string>();
          for (const cat of categories ?? []) {
            slugToId.set(cat.slug, cat.id);
          }

          // Aggregate published counts by category_id
          const publishedByCategoryId: Record<string, number> = {};
          for (const row of publishedRows ?? []) {
            if (row.category_id) {
              publishedByCategoryId[row.category_id] =
                (publishedByCategoryId[row.category_id] ?? 0) + 1;
            }
          }

          // Aggregate total counts by category_id
          const totalByCategoryId: Record<string, number> = {};
          for (const row of totalRows ?? []) {
            if (row.category_id) {
              totalByCategoryId[row.category_id] =
                (totalByCategoryId[row.category_id] ?? 0) + 1;
            }
          }

          // Build the final counts map keyed by slug
          const counts: Record<string, { published: number; total: number }> =
            {};
          for (const cat of categories ?? []) {
            const pub = publishedByCategoryId[cat.id] ?? 0;
            const tot = totalByCategoryId[cat.id] ?? 0;
            counts[cat.slug] = { published: pub, total: tot };
          }

          return new Response(JSON.stringify({ categories, counts }), {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=300",
            },
          });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Internal server error";
          console.error("[blog-categories-api] error:", err);
          return new Response(JSON.stringify({ error: message, categories: [], counts: {} }), {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=300",
            },
          });
        }
      },
    },
  },
});