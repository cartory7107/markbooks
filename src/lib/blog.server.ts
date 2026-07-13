import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BlogCategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  intro: string | null;
  meta_title: string | null;
  meta_description: string | null;
  emoji: string | null;
  faq: Array<{ q: string; a: string }> | null;
  sort_order: number;
}

export interface BlogAuthorRow {
  id: string;
  slug: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  role_title: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  email: string | null;
}

export interface BlogPostRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content_md: string;
  content_html: string | null;
  toc: Array<{ id: string; text: string; level: number }> | null;
  faq: Array<{ q: string; a: string }> | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  category_id: string | null;
  author_id: string | null;
  tags: string[];
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  keywords: string[];
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  twitter_card: string;
  related_tool_slugs: string[];
  related_post_slugs: string[];
  status: string;
  is_featured: boolean;
  is_trending: boolean;
  reading_minutes: number;
  word_count: number;
  view_count: number;
  ai_generated: boolean;
  ai_model: string | null;
  published_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  category?: BlogCategoryRow | null;
  author?: BlogAuthorRow | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Base select list for blog_posts (without the heavy content_html / content_md when not needed). */
const POST_LIST_SELECT = [
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
  // joined
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

/** Build the published-only filter chain (status + published_at). */
function publishedFilter(query: ReturnType<typeof supabaseAdmin.from>) {
  return query
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .not("published_at", "is", null);
}

/** Normalise the Supabase join shape into flat BlogPostRow objects. */
function normalisePosts(rows: Record<string, unknown>[]): BlogPostRow[] {
  return rows.map((row) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { blog_categories, blog_authors, ...rest } = row as Record<string, unknown>;
    return {
      ...(rest as Omit<BlogPostRow, "category" | "author">),
      category: (blog_categories as BlogCategoryRow) ?? null,
      author: (blog_authors as BlogAuthorRow) ?? null,
    };
  }) as BlogPostRow[];
}

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

/**
 * Fetch paginated published posts with optional filters.
 */
export async function getPublishedPosts(opts?: {
  limit?: number;
  offset?: number;
  category_slug?: string;
  tag?: string;
  featured?: boolean;
  trending?: boolean;
}): Promise<{ posts: BlogPostRow[]; total: number }> {
  try {
    const limit = opts?.limit ?? 20;
    const offset = opts?.offset ?? 0;

    let query = supabaseAdmin
      .from("blog_posts")
      .select(POST_LIST_SELECT, { count: "exact" });

    query = publishedFilter(query as ReturnType<typeof supabaseAdmin.from>);

    if (opts?.category_slug) {
      query = query.eq("blog_categories.slug", opts.category_slug) as ReturnType<typeof supabaseAdmin.from>;
    }
    if (opts?.tag) {
      query = query.contains("tags", [opts.tag]) as ReturnType<typeof supabaseAdmin.from>;
    }
    if (opts?.featured === true) {
      query = query.eq("is_featured", true) as ReturnType<typeof supabaseAdmin.from>;
    }
    if (opts?.trending === true) {
      query = query.eq("is_trending", true) as ReturnType<typeof supabaseAdmin.from>;
    }

    const { data, error, count } = await (query as ReturnType<typeof supabaseAdmin.from>)
      .order("published_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[blog.server] getPublishedPosts error:", error);
      return { posts: [], total: 0 };
    }

    return { posts: normalisePosts(data ?? []), total: count ?? 0 };
  } catch (err) {
    console.error("[blog.server] getPublishedPosts exception:", err);
    return { posts: [], total: 0 };
  }
}

/**
 * Fetch a single published post by slug.
 */
export async function getPublishedPostBySlug(slug: string): Promise<BlogPostRow | null> {
  try {
    let query = supabaseAdmin
      .from("blog_posts")
      .select(POST_LIST_SELECT)
      .eq("slug", slug);

    query = publishedFilter(query as ReturnType<typeof supabaseAdmin.from>);

    const { data, error } = await (query as ReturnType<typeof supabaseAdmin.from>)
      .order("published_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("[blog.server] getPublishedPostBySlug error:", error);
      return null;
    }

    const normalised = normalisePosts([data]);
    return normalised[0] ?? null;
  } catch (err) {
    console.error("[blog.server] getPublishedPostBySlug exception:", err);
    return null;
  }
}

/**
 * Fetch all blog categories sorted by sort_order.
 */
export async function getAllCategories(): Promise<BlogCategoryRow[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("blog_categories")
      .select(CATEGORY_SELECT)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[blog.server] getAllCategories error:", error);
      return [];
    }

    return (data ?? []) as unknown as BlogCategoryRow[];
  } catch (err) {
    console.error("[blog.server] getAllCategories exception:", err);
    return [];
  }
}

/**
 * Fetch a single category by slug.
 */
export async function getCategoryBySlug(slug: string): Promise<BlogCategoryRow | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("blog_categories")
      .select(CATEGORY_SELECT)
      .eq("slug", slug)
      .single();

    if (error) {
      console.error("[blog.server] getCategoryBySlug error:", error);
      return null;
    }

    return data as unknown as BlogCategoryRow;
  } catch (err) {
    console.error("[blog.server] getCategoryBySlug exception:", err);
    return null;
  }
}

/**
 * Fetch paginated published posts for a specific category slug.
 */
export async function getPostsByCategory(
  categorySlug: string,
  opts?: { limit?: number; offset?: number },
): Promise<{ posts: BlogPostRow[]; total: number }> {
  try {
    const limit = opts?.limit ?? 20;
    const offset = opts?.offset ?? 0;

    let query = supabaseAdmin
      .from("blog_posts")
      .select(POST_LIST_SELECT, { count: "exact" })
      .eq("blog_categories.slug", categorySlug);

    query = publishedFilter(query as ReturnType<typeof supabaseAdmin.from>);

    const { data, error, count } = await (query as ReturnType<typeof supabaseAdmin.from>)
      .order("published_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[blog.server] getPostsByCategory error:", error);
      return { posts: [], total: 0 };
    }

    return { posts: normalisePosts(data ?? []), total: count ?? 0 };
  } catch (err) {
    console.error("[blog.server] getPostsByCategory exception:", err);
    return { posts: [], total: 0 };
  }
}

/**
 * Return all published post slugs — useful for sitemap / route generation.
 */
export async function getAllPublishedSlugs(): Promise<string[]> {
  try {
    let query = supabaseAdmin
      .from("blog_posts")
      .select("slug");

    query = publishedFilter(query as ReturnType<typeof supabaseAdmin.from>);

    const { data, error } = await (query as ReturnType<typeof supabaseAdmin.from>).order("published_at", { ascending: false });

    if (error) {
      console.error("[blog.server] getAllPublishedSlugs error:", error);
      return [];
    }

    return (data ?? []).map((row: { slug: string }) => row.slug);
  } catch (err) {
    console.error("[blog.server] getAllPublishedSlugs exception:", err);
    return [];
  }
}

/**
 * Return all category slugs — useful for sitemap / route generation.
 */
export async function getAllCategorySlugs(): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("blog_categories")
      .select("slug")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[blog.server] getAllCategorySlugs error:", error);
      return [];
    }

    return (data ?? []).map((row: { slug: string }) => row.slug);
  } catch (err) {
    console.error("[blog.server] getAllCategorySlugs exception:", err);
    return [];
  }
}

/**
 * Return a map of { category_slug: published_post_count } for every category
 * that has at least one published post.
 */
export async function getPostCountByCategory(): Promise<Record<string, number>> {
  try {
    // We query blog_posts joined with blog_categories, then aggregate in JS.
    // Supabase JS v2 doesn't have a clean group-by API, so we fetch slugs
    // and count in application code.
    let query = supabaseAdmin
      .from("blog_posts")
      .select("blog_categories!inner(slug)")
      .order("published_at", { ascending: false });

    query = publishedFilter(query as ReturnType<typeof supabaseAdmin.from>);

    const { data, error } = await query;

    if (error) {
      console.error("[blog.server] getPostCountByCategory error:", error);
      return {};
    }

    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      const cat = (row as Record<string, unknown>).blog_categories as
        | { slug: string }
        | undefined;
      if (cat?.slug) {
        counts[cat.slug] = (counts[cat.slug] ?? 0) + 1;
      }
    }

    return counts;
  } catch (err) {
    console.error("[blog.server] getPostCountByCategory exception:", err);
    return {};
  }
}