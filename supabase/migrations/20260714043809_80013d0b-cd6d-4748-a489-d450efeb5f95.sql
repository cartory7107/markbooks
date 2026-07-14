DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'admin_tool_edits'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_tool_edits;
  END IF;
END $$;