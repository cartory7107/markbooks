/**
 * Server-only helpers that resolve a blog post's related AI tools and
 * related articles. Kept out of the route module so the catalog and the
 * Supabase admin client never enter the client bundle.
 */
import { getCatalog, normalizeCategory, slugify, type Tool } from "@/lib/catalog-server";
import { getPublishedPosts, getPostsBySlugs, type BlogPostRow } from "@/lib/blog.server";

export interface RelatedTool {
  slug: string;
  name: string;
  description: string;
  category: string;
  categorySlug: string;
  pricing: string;
  favicon: string;
}

function toRelated(t: Tool): RelatedTool {
  const cat = normalizeCategory(t.c);
  return {
    slug: slugify(t.n),
    name: t.n,
    description: t.d || "",
    category: cat,
    categorySlug: slugify(cat),
    pricing: t.p || "",
    favicon: t.fl || "",
  };
}

/**
 * Resolve related AI tools for a post.
 * 1. explicit `related_tool_slugs` set by the editor
 * 2. otherwise tools matching the post's tags / category names
 */
export function getRelatedTools(post: BlogPostRow, limit = 6): RelatedTool[] {
  const tools = getCatalog().tools;
  const out: RelatedTool[] = [];
  const used = new Set<string>();

  const wanted = new Set(
    (post.related_tool_slugs ?? []).map((s) => s.toLowerCase().trim()).filter(Boolean),
  );

  if (wanted.size > 0) {
    for (const t of tools) {
      const s = slugify(t.n);
      if (!wanted.has(s) || used.has(s)) continue;
      used.add(s);
      out.push(toRelated(t));
      if (out.length >= limit) return out;
    }
  }

  if (out.length < limit) {
    const terms = [...(post.tags ?? []), post.category?.name ?? ""]
      .map((t) => t.toLowerCase().trim())
      .filter((t) => t.length > 2);

    if (terms.length > 0) {
      for (const t of tools) {
        const s = slugify(t.n);
        if (used.has(s)) continue;
        const hay = `${t.n} ${t.c}`.toLowerCase();
        if (!terms.some((term) => hay.includes(term))) continue;
        used.add(s);
        out.push(toRelated(t));
        if (out.length >= limit) break;
      }
    }
  }

  return out;
}

/**
 * Resolve related articles for a post.
 * 1. explicit `related_post_slugs`
 * 2. same category
 * 3. latest published
 */
export async function getRelatedPosts(post: BlogPostRow, limit = 3): Promise<BlogPostRow[]> {
  const picked: BlogPostRow[] = [];
  const seen = new Set<string>([post.id]);

  const push = (rows: BlogPostRow[]) => {
    for (const r of rows) {
      if (picked.length >= limit) return;
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      picked.push(r);
    }
  };

  if (post.related_post_slugs?.length) {
    push(await getPostsBySlugs(post.related_post_slugs));
  }

  if (picked.length < limit && post.category?.slug) {
    const res = await getPublishedPosts({
      category_slug: post.category.slug,
      limit: limit + 3,
    });
    push(res.posts);
  }

  if (picked.length < limit) {
    const res = await getPublishedPosts({ limit: limit + 3 });
    push(res.posts);
  }

  return picked;
}
