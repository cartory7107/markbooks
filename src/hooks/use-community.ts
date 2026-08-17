import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchCommentCounts,
  fetchEngagementCounts,
  fetchMyEngagements,
  toggleEngagement,
  toolSlugOf,
  type EngagementKind,
} from "@/lib/community";
import { supabase } from "@/integrations/supabase/client";

/**
 * Real like / save state for a batch of tool names.
 *
 * Counts are public (anyone sees the same totals); the "mine" sets only exist
 * for the signed-in user. Anonymous visitors get `needsAuth` when they try to
 * react, so the UI can send them to sign-in instead of faking a state change.
 */
export function useCommunity(names: string[]) {
  const [counts, setCounts] = useState<Record<string, { likes: number; saves: number }>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [signedIn, setSignedIn] = useState(false);
  const fetchedRef = useRef<Set<string>>(new Set());

  const slugs = useMemo(() => names.map(toolSlugOf), [names.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSignedIn(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Load public counts + the viewer's own reactions for slugs we haven't seen.
  useEffect(() => {
    const pending = slugs.filter((s) => s && !fetchedRef.current.has(s)).slice(0, 400);
    if (pending.length === 0) return;
    for (const s of pending) fetchedRef.current.add(s);

    let mounted = true;
    (async () => {
      const [engagement, comments] = await Promise.all([
        fetchEngagementCounts(pending),
        fetchCommentCounts(pending),
      ]);
      if (!mounted) return;
      setCounts((prev) => ({ ...prev, ...engagement }));
      setCommentCounts((prev) => ({ ...prev, ...comments }));

      if (signedIn) {
        const mine = await fetchMyEngagements(pending);
        if (!mounted) return;
        setLiked((prev) => new Set([...prev, ...mine.likes]));
        setSaved((prev) => new Set([...prev, ...mine.saves]));
      }
    })();
    return () => {
      mounted = false;
    };
  }, [slugs, signedIn]);

  // When the viewer signs in, re-read their own reactions for everything loaded.
  useEffect(() => {
    if (!signedIn) {
      setLiked(new Set());
      setSaved(new Set());
      return;
    }
    const all = Array.from(fetchedRef.current).slice(0, 400);
    if (all.length === 0) return;
    let mounted = true;
    fetchMyEngagements(all).then((mine) => {
      if (!mounted) return;
      setLiked(mine.likes);
      setSaved(mine.saves);
    });
    return () => {
      mounted = false;
    };
  }, [signedIn]);

  const toggle = useCallback(
    async (name: string, kind: EngagementKind): Promise<"ok" | "auth"> => {
      const slug = toolSlugOf(name);
      const set = kind === "like" ? liked : saved;
      const active = set.has(slug);

      // Optimistic update, rolled back if the write fails.
      const apply = (on: boolean) => {
        const setter = kind === "like" ? setLiked : setSaved;
        setter((prev) => {
          const next = new Set(prev);
          if (on) next.add(slug);
          else next.delete(slug);
          return next;
        });
        setCounts((prev) => {
          const curr = prev[slug] ?? { likes: 0, saves: 0 };
          const key = kind === "like" ? "likes" : "saves";
          return {
            ...prev,
            [slug]: { ...curr, [key]: Math.max(0, curr[key] + (on ? 1 : -1)) },
          };
        });
      };

      apply(!active);
      const result = await toggleEngagement(slug, kind, active);
      if (result === null) {
        apply(active);
        return "auth";
      }
      return "ok";
    },
    [liked, saved],
  );

  return {
    signedIn,
    counts,
    commentCounts,
    liked,
    saved,
    likesOf: (name: string) => counts[toolSlugOf(name)]?.likes ?? 0,
    savesOf: (name: string) => counts[toolSlugOf(name)]?.saves ?? 0,
    commentsOf: (name: string) => commentCounts[toolSlugOf(name)] ?? 0,
    isLiked: (name: string) => liked.has(toolSlugOf(name)),
    isSaved: (name: string) => saved.has(toolSlugOf(name)),
    toggle,
  };
}
