
-- Guarantee owner is admin
DO $$
DECLARE
  owner_id uuid;
BEGIN
  SELECT id INTO owner_id FROM auth.users WHERE email = 'cartory7107@gmail.com' LIMIT 1;
  IF owner_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (owner_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- Ensure trigger exists for future signups with that email
DROP TRIGGER IF EXISTS on_auth_user_created_grant_owner ON auth.users;
CREATE TRIGGER on_auth_user_created_grant_owner
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_admin_to_owner();

-- Allow public (anonymous) read of admin_tool_edits so the live site reflects edits instantly
GRANT SELECT ON public.admin_tool_edits TO anon;

DROP POLICY IF EXISTS "Public can view admin edits" ON public.admin_tool_edits;
CREATE POLICY "Public can view admin edits"
ON public.admin_tool_edits
FOR SELECT
TO anon, authenticated
USING (true);
