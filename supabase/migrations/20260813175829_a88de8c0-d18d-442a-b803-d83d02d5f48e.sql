CREATE TYPE public.verification_level AS ENUM ('unverified', 'auto_checked', 'human_verified', 'flagged');
CREATE TYPE public.link_health AS ENUM ('unknown', 'working', 'redirected', 'broken', 'insecure');

CREATE TABLE public.tool_verifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_slug text NOT NULL UNIQUE,
  tool_name text NOT NULL DEFAULT '',
  domain text,
  level public.verification_level NOT NULL DEFAULT 'unverified',
  verified_at timestamp with time zone,
  verified_by uuid,
  link_health public.link_health NOT NULL DEFAULT 'unknown',
  http_status integer,
  https_valid boolean,
  redirect_target text,
  last_checked_at timestamp with time zone,
  consecutive_failures integer NOT NULL DEFAULT 0,
  public_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX tool_verifications_domain_idx ON public.tool_verifications (domain);
CREATE INDEX tool_verifications_level_idx ON public.tool_verifications (level);

GRANT SELECT ON public.tool_verifications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tool_verifications TO authenticated;
GRANT ALL ON public.tool_verifications TO service_role;

ALTER TABLE public.tool_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view verification records"
  ON public.tool_verifications FOR SELECT
  USING (true);

CREATE POLICY "Admins manage verification records"
  ON public.tool_verifications FOR ALL
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_tool_verifications_updated_at
  BEFORE UPDATE ON public.tool_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();