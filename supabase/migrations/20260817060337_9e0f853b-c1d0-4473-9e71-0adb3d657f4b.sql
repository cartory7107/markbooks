CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE TABLE public.tool_engagements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tool_slug text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('like','save')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tool_slug, kind)
);
CREATE INDEX tool_engagements_slug_kind_idx ON public.tool_engagements (tool_slug, kind);

GRANT SELECT, INSERT, DELETE ON public.tool_engagements TO authenticated;
GRANT ALL ON public.tool_engagements TO service_role;
ALTER TABLE public.tool_engagements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own engagements readable" ON public.tool_engagements
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own engagements insertable" ON public.tool_engagements
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own engagements deletable" ON public.tool_engagements
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.tool_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_slug text NOT NULL,
  user_id uuid NOT NULL,
  author_name text NOT NULL,
  author_avatar_url text,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'visible' CHECK (status IN ('visible','hidden')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tool_comments_slug_idx ON public.tool_comments (tool_slug, created_at DESC);

GRANT SELECT ON public.tool_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tool_comments TO authenticated;
GRANT ALL ON public.tool_comments TO service_role;
ALTER TABLE public.tool_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "visible comments are public" ON public.tool_comments
  FOR SELECT TO anon, authenticated USING (status = 'visible');
CREATE POLICY "users insert own comments" ON public.tool_comments
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "users update own comments" ON public.tool_comments
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "users delete own comments" ON public.tool_comments
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins moderate comments" ON public.tool_comments
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_tool_comments_updated_at BEFORE UPDATE ON public.tool_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.tool_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_slug text NOT NULL,
  tool_name text NOT NULL,
  reason text NOT NULL,
  details text,
  reported_by uuid,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','resolved','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tool_reports_status_idx ON public.tool_reports (status, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.tool_reports TO authenticated;
GRANT ALL ON public.tool_reports TO service_role;
ALTER TABLE public.tool_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users file reports" ON public.tool_reports
  FOR INSERT TO authenticated WITH CHECK (reported_by = auth.uid());
CREATE POLICY "users read own reports" ON public.tool_reports
  FOR SELECT TO authenticated USING (reported_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update reports" ON public.tool_reports
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_tool_reports_updated_at BEFORE UPDATE ON public.tool_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.tool_engagement_counts(_slugs text[])
RETURNS TABLE (tool_slug text, likes bigint, saves bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.tool_slug,
         count(*) FILTER (WHERE e.kind = 'like') AS likes,
         count(*) FILTER (WHERE e.kind = 'save') AS saves
  FROM public.tool_engagements e
  WHERE e.tool_slug = ANY(_slugs)
  GROUP BY e.tool_slug
$$;

GRANT EXECUTE ON FUNCTION public.tool_engagement_counts(text[]) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.tool_comment_counts(_slugs text[])
RETURNS TABLE (tool_slug text, comments bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.tool_slug, count(*) AS comments
  FROM public.tool_comments c
  WHERE c.tool_slug = ANY(_slugs) AND c.status = 'visible'
  GROUP BY c.tool_slug
$$;

GRANT EXECUTE ON FUNCTION public.tool_comment_counts(text[]) TO anon, authenticated, service_role;