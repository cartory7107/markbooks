CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'tavbook-logo-worker',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://tavbook.top/api/public/logo-worker?limit=12',
    headers := '{"Content-Type": "application/json", "apikey": "sb_publishable_9q_iaaNA_gDQNKIL6IE8Cw_KfuGSkI_"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);