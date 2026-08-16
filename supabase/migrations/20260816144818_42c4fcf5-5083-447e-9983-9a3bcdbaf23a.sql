CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS private.audit_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON private.audit_config FROM anon, authenticated;
GRANT ALL ON private.audit_config TO service_role;
ALTER TABLE private.audit_config ENABLE ROW LEVEL SECURITY;

INSERT INTO private.audit_config (key, value)
VALUES ('link_audit_token', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION private.trigger_link_audit(_limit integer DEFAULT 150, _source text DEFAULT 'cron')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, extensions, public
AS $$
DECLARE
  _token text;
BEGIN
  SELECT value INTO _token FROM private.audit_config WHERE key = 'link_audit_token';
  IF _token IS NULL THEN
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := 'https://tavbook.top/api/public/link-audit',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _token
    ),
    body := jsonb_build_object('limit', _limit, 'source', _source),
    timeout_milliseconds := 60000
  );
END;
$$;

REVOKE ALL ON FUNCTION private.trigger_link_audit(integer, text) FROM anon, authenticated;

SELECT cron.unschedule('tavbook-link-audit-monthly') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'tavbook-link-audit-monthly'
);
SELECT cron.unschedule('tavbook-link-audit-daily') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'tavbook-link-audit-daily'
);

SELECT cron.schedule(
  'tavbook-link-audit-monthly',
  '0 3 1 * *',
  $$SELECT private.trigger_link_audit(300, 'cron_monthly');$$
);

SELECT cron.schedule(
  'tavbook-link-audit-daily',
  '0 4 * * *',
  $$SELECT private.trigger_link_audit(150, 'cron_daily');$$
);