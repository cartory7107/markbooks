CREATE TABLE public.tool_logos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  storage_path text,
  public_url text,
  source text,
  content_hash text,
  byte_size integer,
  content_type text,
  error text,
  attempts integer NOT NULL DEFAULT 0,
  logo_updated_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX tool_logos_status_idx ON public.tool_logos (status);
CREATE INDEX tool_logos_hash_idx ON public.tool_logos (content_hash);

GRANT SELECT ON public.tool_logos TO anon;
GRANT SELECT ON public.tool_logos TO authenticated;
GRANT ALL ON public.tool_logos TO service_role;

ALTER TABLE public.tool_logos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view logo records"
  ON public.tool_logos FOR SELECT USING (true);

CREATE POLICY "Admins manage logo records"
  ON public.tool_logos FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_tool_logos_updated_at
  BEFORE UPDATE ON public.tool_logos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();