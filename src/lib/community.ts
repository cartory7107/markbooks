/**
 * Real community layer (Chapter 05).
 *
 * Likes, saves, comments and reports are stored in the database and scoped to
 * the signed-in user through RLS. Public counts come from security-definer
 * aggregate functions so visitors can read totals without seeing who did what.
 */

import { supabase } from "@/integrations/supabase/client";

export type EngagementKind = "like" | "save";

export interface EngagementCounts {
  likes: number;
  saves: number;
}

export interface ToolComment {
  id: string;
  tool_slug: string;
  user_id: string;
  author_name: string;
  author_avatar_url: string | null;
  body: string;
  created_at: string;
}

export function toolSlugOf(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Public like/save totals for a batch of tool slugs. */
export async function fetchEngagementCounts(
  slugs: string[],
): Promise<Record<string, EngagementCounts>> {
  if (slugs.length === 0) return {};
  const { data, error } = await supabase.rpc("tool_engagement_counts", { _slugs: slugs });
  if (error || !data) return {};
  const out: Record<string, EngagementCounts> = {};
  for (const row of data as Array<{ tool_slug: string; likes: number; saves: number }>) {
    out[row.tool_slug] = { likes: Number(row.likes) || 0, saves: Number(row.saves) || 0 };
  }
  return out;
}

/** Public comment totals for a batch of tool slugs. */
export async function fetchCommentCounts(slugs: string[]): Promise<Record<string, number>> {
  if (slugs.length === 0) return {};
  const { data, error } = await supabase.rpc("tool_comment_counts", { _slugs: slugs });
  if (error || !data) return {};
  const out: Record<string, number> = {};
  for (const row of data as Array<{ tool_slug: string; comments: number }>) {
    out[row.tool_slug] = Number(row.comments) || 0;
  }
  return out;
}

/** Which of these tools the current user has liked / saved. */
export async function fetchMyEngagements(
  slugs: string[],
): Promise<{ likes: Set<string>; saves: Set<string> }> {
  const likes = new Set<string>();
  const saves = new Set<string>();
  if (slugs.length === 0) return { likes, saves };
  const { data, error } = await supabase
    .from("tool_engagements")
    .select("tool_slug, kind")
    .in("tool_slug", slugs);
  if (error || !data) return { likes, saves };
  for (const row of data) {
    if (row.kind === "like") likes.add(row.tool_slug);
    else if (row.kind === "save") saves.add(row.tool_slug);
  }
  return { likes, saves };
}

/** Toggle a like/save. Returns the new state, or null when not signed in. */
export async function toggleEngagement(
  slug: string,
  kind: EngagementKind,
  active: boolean,
): Promise<boolean | null> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return null;

  if (active) {
    const { error } = await supabase
      .from("tool_engagements")
      .delete()
      .eq("tool_slug", slug)
      .eq("kind", kind)
      .eq("user_id", userId);
    if (error) return null;
    return false;
  }

  const { error } = await supabase
    .from("tool_engagements")
    .insert({ tool_slug: slug, kind, user_id: userId });
  if (error && error.code !== "23505") return null;
  return true;
}

/** Visible comments for one tool, newest first. */
export async function fetchComments(slug: string): Promise<ToolComment[]> {
  const { data, error } = await supabase
    .from("tool_comments")
    .select("id, tool_slug, user_id, author_name, author_avatar_url, body, created_at")
    .eq("tool_slug", slug)
    .eq("status", "visible")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error || !data) return [];
  return data as ToolComment[];
}

export async function addComment(
  slug: string,
  body: string,
): Promise<{ ok: boolean; comment?: ToolComment; error?: string }> {
  const trimmed = body.trim();
  if (trimmed.length < 3) return { ok: false, error: "Please write a little more." };
  if (trimmed.length > 2000) return { ok: false, error: "Comment is too long (2000 characters max)." };

  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return { ok: false, error: "signed-out" };

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    (typeof meta["full_name"] === "string" && meta["full_name"]) ||
    (typeof meta["name"] === "string" && meta["name"]) ||
    user.email?.split("@")[0] ||
    "TavBook member";
  const avatar =
    (typeof meta["avatar_url"] === "string" && meta["avatar_url"]) ||
    (typeof meta["picture"] === "string" && meta["picture"]) ||
    null;

  const { data, error } = await supabase
    .from("tool_comments")
    .insert({
      tool_slug: slug,
      user_id: user.id,
      author_name: String(name),
      author_avatar_url: avatar,
      body: trimmed,
    })
    .select("id, tool_slug, user_id, author_name, author_avatar_url, body, created_at")
    .single();

  if (error || !data) return { ok: false, error: "Could not post your comment. Please try again." };
  return { ok: true, comment: data as ToolComment };
}

export async function deleteComment(id: string): Promise<boolean> {
  const { error } = await supabase.from("tool_comments").delete().eq("id", id);
  return !error;
}

export async function submitReport(input: {
  slug: string;
  name: string;
  reason: string;
  details?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return { ok: false, error: "signed-out" };

  const { error } = await supabase.from("tool_reports").insert({
    tool_slug: input.slug,
    tool_name: input.name,
    reason: input.reason,
    details: input.details?.trim() || null,
    reported_by: user.id,
  });
  if (error) return { ok: false, error: "Could not submit your report. Please try again." };
  return { ok: true };
}

/** Human relative time for comment timestamps. */
export function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime()) / 60000;
  if (diff < 1) return "just now";
  if (diff < 60) return `${Math.floor(diff)}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  if (diff < 10080) return `${Math.floor(diff / 1440)}d ago`;
  return new Date(iso).toLocaleDateString();
}
