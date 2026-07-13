REVOKE SELECT ON public.admin_tool_edits FROM anon;

DROP POLICY IF EXISTS "Public can view admin edits" ON public.admin_tool_edits;

DROP POLICY IF EXISTS "Authenticated admins can view admin edits" ON public.admin_tool_edits;
CREATE POLICY "Authenticated admins can view admin edits"
ON public.admin_tool_edits
FOR SELECT
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role));