import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

/**
 * Admin blog management API endpoint.
 *
 * Receives POST requests with a JSON body: { action, ...params }
 * and dispatches to the appropriate CRUD operation.
 *
 * Uses supabaseAdmin (service-role key) on the server side, which bypasses RLS.
 * The admin panel (client-side) calls this endpoint with fetch().
 *
 * Usage: POST /blog-admin-api.json  { action: "list", status?: "draft", limit?: 20, offset?: 0 }
 */

const POST_SELECT = [
  "id",
  "slug",
  "title",
  "excerpt",
  "content_md",
  "content_html",
  "toc",
  "faq",
  "featured_image_url",
  "featured_image_alt",
  "category_id",
  "author_id",
  "tags",
  "meta_title",
  "meta_description",
  "canonical_url",
  "keywords",
  "og_title",
  "og_description",
  "og_image_url",
  "twitter_card",
  "related_tool_slugs",
  "related_post_slugs",
  "status",
  "is_featured",
  "is_trending",
  "reading_minutes",
  "word_count",
  "view_count",
  "ai_generated",
  "ai_model",
  "published_at",
  "scheduled_at",
  "created_at",
  "updated_at",
  "rejection_reason",
  "blog_categories!blog_posts_category_id_fkey(id,slug,name,description,intro,meta_title,meta_description,emoji,faq,sort_order)",
  "blog_authors!blog_posts_author_id_fkey(id,slug,name,bio,avatar_url,role_title,twitter_url,linkedin_url,website_url,email)",
].join(",");

const CATEGORY_SELECT = [
  "id",
  "slug",
  "name",
  "description",
  "intro",
  "meta_title",
  "meta_description",
  "emoji",
  "faq",
  "sort_order",
].join(",");

const AUTHOR_SELECT = [
  "id",
  "slug",
  "name",
  "bio",
  "avatar_url",
  "role_title",
  "twitter_url",
  "linkedin_url",
  "website_url",
  "email",
].join(",");

/** Normalise the Supabase join shape into flat objects. */
function normalisePosts(rows: Record<string, unknown>[]) {
  return rows.map((row) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { blog_categories, blog_authors, ...rest } = row;
    return {
      ...rest,
      category: blog_categories ?? null,
      author: blog_authors ?? null,
    };
  });
}

/** Compute word_count from markdown content. */
function computeWordCount(contentMd: string): number {
  if (!contentMd) return 0;
  return contentMd.split(/\s+/).filter(Boolean).length;
}

/** Extract mutable post fields from the incoming payload (strip unknown keys). */
function extractPostFields(raw: Record<string, unknown>) {
  return {
    title: raw.title,
    slug: raw.slug,
    excerpt: raw.excerpt ?? null,
    content_md: raw.content_md ?? "",
    category_id: raw.category_id ?? null,
    author_id: raw.author_id ?? null,
    tags: raw.tags ?? [],
    meta_title: raw.meta_title ?? null,
    meta_description: raw.meta_description ?? null,
    canonical_url: raw.canonical_url ?? null,
    keywords: raw.keywords ?? [],
    og_title: raw.og_title ?? null,
    og_description: raw.og_description ?? null,
    og_image_url: raw.og_image_url ?? null,
    featured_image_url: raw.featured_image_url ?? null,
    featured_image_alt: raw.featured_image_alt ?? null,
    is_featured: raw.is_featured ?? false,
    is_trending: raw.is_trending ?? false,
    reading_minutes: raw.reading_minutes ?? 0,
    status: raw.status ?? "draft",
    ai_generated: raw.ai_generated ?? false,
    ai_model: raw.ai_model ?? null,
    faq: raw.faq ?? [],
    related_tool_slugs: raw.related_tool_slugs ?? [],
    related_post_slugs: raw.related_post_slugs ?? [],
    scheduled_at: raw.scheduled_at ?? null,
    // Computed
    word_count: computeWordCount((raw.content_md as string) ?? ""),
  };
}

/** If publishing for the first time, stamp published_at. */
function maybeSetPublishedAt(
  fields: Record<string, unknown>,
  existingPublishedAt: string | null | undefined,
) {
  if (fields.status === "published" && !existingPublishedAt) {
    fields.published_at = new Date().toISOString();
  }
}

// ---------------------------------------------------------------------------
// Route definition
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/blog-admin-api.json")({
  ssr: false,
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Dynamic import — route files ship to the client bundle at build time
        const { supabaseAdmin: rawSupabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const supabaseAdmin = rawSupabaseAdmin as never as {
          from: (table: string) => {
            select: (...args: unknown[]) => unknown;
            insert: (...args: unknown[]) => unknown;
            update: (...args: unknown[]) => unknown;
            delete: (...args: unknown[]) => unknown;
          };
        };

        let body: Record<string, unknown>;
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
            },
          });
        }

        const action = body.action as string;

        try {
          // -----------------------------------------------------------------
          // LIST
          // -----------------------------------------------------------------
          if (action === "list") {
            const status = body.status as string | undefined;
            const limit = Math.min(
              Math.max(Number(body.limit) || 20, 1),
              100,
            );
            const offset = Math.max(Number(body.offset) || 0, 0);

            let query = supabaseAdmin
              .from("blog_posts")
              .select(POST_SELECT, { count: "exact" });

            if (status && status !== "all") {
              query = query.eq("status", status);
            }

            const { data, error, count } = await query
              .order("updated_at", { ascending: false })
              .range(offset, offset + limit - 1);

            if (error) throw error;

            return new Response(
              JSON.stringify({
                posts: normalisePosts(data ?? []),
                total: count ?? 0,
              }),
              {
                headers: {
                  "Content-Type": "application/json",
                  "Cache-Control": "no-store",
                },
              },
            );
          }

          // -----------------------------------------------------------------
          // GET
          // -----------------------------------------------------------------
          if (action === "get") {
            const id = body.id as string;
            if (!id) {
              return new Response(
                JSON.stringify({ error: "Missing required field: id" }),
                {
                  status: 400,
                  headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store",
                  },
                },
              );
            }

            const { data, error } = await supabaseAdmin
              .from("blog_posts")
              .select(POST_SELECT)
              .eq("id", id)
              .single();

            if (error) throw error;

            const normalised = normalisePosts([data]);
            return new Response(
              JSON.stringify({ post: normalised[0] ?? null }),
              {
                headers: {
                  "Content-Type": "application/json",
                  "Cache-Control": "no-store",
                },
              },
            );
          }

          // -----------------------------------------------------------------
          // CREATE
          // -----------------------------------------------------------------
          if (action === "create") {
            const raw = body.post as Record<string, unknown>;
            if (!raw) {
              return new Response(
                JSON.stringify({ error: "Missing required field: post" }),
                {
                  status: 400,
                  headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store",
                  },
                },
              );
            }

            const fields = extractPostFields(raw);
            maybeSetPublishedAt(fields, null);

            const { data, error } = await supabaseAdmin
              .from("blog_posts")
              .insert(fields)
              .select(POST_SELECT)
              .single();

            if (error) throw error;

            // Auto-create initial revision snapshot
            const snapshot = { ...data, blog_categories: null, blog_authors: null };
            await supabaseAdmin.from("blog_post_revisions").insert({
              post_id: data.id,
              snapshot,
            });

            const normalised = normalisePosts([data]);
            return new Response(
              JSON.stringify({ post: normalised[0] }),
              {
                status: 201,
                headers: {
                  "Content-Type": "application/json",
                  "Cache-Control": "no-store",
                },
              },
            );
          }

          // -----------------------------------------------------------------
          // UPDATE
          // -----------------------------------------------------------------
          if (action === "update") {
            const id = body.id as string;
            const raw = body.post as Record<string, unknown>;
            if (!id || !raw) {
              return new Response(
                JSON.stringify({
                  error: "Missing required fields: id, post",
                }),
                {
                  status: 400,
                  headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store",
                  },
                },
              );
            }

            // Fetch current state for revision snapshot
            const { data: existing, error: fetchErr } = await supabaseAdmin
              .from("blog_posts")
              .select("*")
              .eq("id", id)
              .single();

            if (fetchErr) throw fetchErr;

            // Save current state as a revision
            await supabaseAdmin.from("blog_post_revisions").insert({
              post_id: id,
              snapshot: existing,
            });

            const fields = extractPostFields(raw);
            maybeSetPublishedAt(fields, existing.published_at);

            const { data, error } = await supabaseAdmin
              .from("blog_posts")
              .update(fields)
              .eq("id", id)
              .select(POST_SELECT)
              .single();

            if (error) throw error;

            const normalised = normalisePosts([data]);
            return new Response(
              JSON.stringify({ post: normalised[0] }),
              {
                headers: {
                  "Content-Type": "application/json",
                  "Cache-Control": "no-store",
                },
              },
            );
          }

          // -----------------------------------------------------------------
          // DELETE
          // -----------------------------------------------------------------
          if (action === "delete") {
            const id = body.id as string;
            if (!id) {
              return new Response(
                JSON.stringify({ error: "Missing required field: id" }),
                {
                  status: 400,
                  headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store",
                  },
                },
              );
            }

            const { error } = await supabaseAdmin
              .from("blog_posts")
              .delete()
              .eq("id", id);

            if (error) throw error;

            return new Response(
              JSON.stringify({ success: true }),
              {
                headers: {
                  "Content-Type": "application/json",
                  "Cache-Control": "no-store",
                },
              },
            );
          }

          // -----------------------------------------------------------------
          // UPDATE_STATUS
          // -----------------------------------------------------------------
          if (action === "update_status") {
            const id = body.id as string;
            const status = body.status as string;
            const rejection_reason = body.rejection_reason as
              | string
              | undefined;

            if (!id || !status) {
              return new Response(
                JSON.stringify({
                  error: "Missing required fields: id, status",
                }),
                {
                  status: 400,
                  headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store",
                  },
                },
              );
            }

            // Fetch existing to check published_at
            const { data: existing, error: fetchErr } = await supabaseAdmin
              .from("blog_posts")
              .select("published_at")
              .eq("id", id)
              .single();

            if (fetchErr) throw fetchErr;

            const updateFields: Record<string, unknown> = { status };
            if (status === "rejected" && rejection_reason) {
              updateFields.rejection_reason = rejection_reason;
            }
            maybeSetPublishedAt(updateFields, existing.published_at);

            const { data, error } = await supabaseAdmin
              .from("blog_posts")
              .update(updateFields)
              .eq("id", id)
              .select(POST_SELECT)
              .single();

            if (error) throw error;

            const normalised = normalisePosts([data]);
            return new Response(
              JSON.stringify({ post: normalised[0] }),
              {
                headers: {
                  "Content-Type": "application/json",
                  "Cache-Control": "no-store",
                },
              },
            );
          }

          // -----------------------------------------------------------------
          // LIST_CATEGORIES
          // -----------------------------------------------------------------
          if (action === "list_categories") {
            const { data, error } = await supabaseAdmin
              .from("blog_categories")
              .select(CATEGORY_SELECT)
              .order("sort_order", { ascending: true });

            if (error) throw error;

            return new Response(
              JSON.stringify({ categories: data ?? [] }),
              {
                headers: {
                  "Content-Type": "application/json",
                  "Cache-Control": "no-store",
                },
              },
            );
          }

          // -----------------------------------------------------------------
          // LIST_AUTHORS
          // -----------------------------------------------------------------
          if (action === "list_authors") {
            const { data, error } = await supabaseAdmin
              .from("blog_authors")
              .select(AUTHOR_SELECT)
              .order("name", { ascending: true });

            if (error) throw error;

            return new Response(
              JSON.stringify({ authors: data ?? [] }),
              {
                headers: {
                  "Content-Type": "application/json",
                  "Cache-Control": "no-store",
                },
              },
            );
          }

          // -----------------------------------------------------------------
          // UNKNOWN ACTION
          // -----------------------------------------------------------------
          return new Response(
            JSON.stringify({ error: `Unknown action: ${action}` }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store",
              },
            },
          );
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Internal server error";
          console.error(`[blog-admin-api] ${action} error:`, err);
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
            },
          });
        }
      },
    },
  },
});