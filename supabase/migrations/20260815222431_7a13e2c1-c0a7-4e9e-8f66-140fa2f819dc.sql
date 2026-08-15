CREATE TABLE public.link_audit_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  trigger_source text NOT NULL DEFAULT 'cron',
  status text NOT NULL DEFAULT 'running',
  checked integer NOT NULL DEFAULT 0,
  working integer NOT NULL DEFAULT 0,
  redirected integer NOT NULL DEFAULT 0,
  broken integer NOT NULL DEFAULT 0,
  insecure integer NOT NULL DEFAULT 0,
  quarantined integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.link_audit_runs TO anon;
GRANT SELECT ON public.link_audit_runs TO authenticated;
GRANT ALL ON public.link_audit_runs TO service_role;
ALTER TABLE public.link_audit_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view audit runs" ON public.link_audit_runs FOR SELECT USING (true);
CREATE POLICY "Admins manage audit runs" ON public.link_audit_runs FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.link_audit_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES public.link_audit_runs(id) ON DELETE CASCADE,
  tool_slug text NOT NULL,
  tool_name text NOT NULL DEFAULT '',
  url text NOT NULL,
  domain text,
  status_code integer,
  final_url text,
  redirect_detected boolean NOT NULL DEFAULT false,
  domain_changed boolean NOT NULL DEFAULT false,
  https_valid boolean,
  link_health link_health NOT NULL DEFAULT 'unknown',
  security_status text NOT NULL DEFAULT 'clean',
  security_reasons text[] NOT NULL DEFAULT '{}',
  response_ms integer,
  error_type text,
  checked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX link_audit_results_slug_idx ON public.link_audit_results (tool_slug, checked_at DESC);
CREATE INDEX link_audit_results_run_idx ON public.link_audit_results (run_id);
CREATE INDEX link_audit_results_health_idx ON public.link_audit_results (link_health);

GRANT SELECT ON public.link_audit_results TO anon;
GRANT SELECT ON public.link_audit_results TO authenticated;
GRANT ALL ON public.link_audit_results TO service_role;
ALTER TABLE public.link_audit_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view audit results" ON public.link_audit_results FOR SELECT USING (true);
CREATE POLICY "Admins manage audit results" ON public.link_audit_results FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.tool_verifications
  ADD COLUMN IF NOT EXISTS security_status text NOT NULL DEFAULT 'clean',
  ADD COLUMN IF NOT EXISTS security_reasons text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS quarantined boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS next_check_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS final_url text,
  ADD COLUMN IF NOT EXISTS response_ms integer;

CREATE UNIQUE INDEX IF NOT EXISTS tool_verifications_slug_key ON public.tool_verifications (tool_slug);
CREATE INDEX IF NOT EXISTS tool_verifications_next_check_idx ON public.tool_verifications (next_check_at);
CREATE INDEX IF NOT EXISTS tool_verifications_quarantined_idx ON public.tool_verifications (quarantined) WHERE quarantined;