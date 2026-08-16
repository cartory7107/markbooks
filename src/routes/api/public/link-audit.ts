import { createFileRoute } from "@tanstack/react-router";

/**
 * Automated link-audit endpoint.
 *
 * Called on a monthly schedule (pg_cron) and optionally on demand by an
 * admin. Requires the shared LINK_AUDIT_SECRET, so it is safe to live under
 * /api/public (which bypasses site auth for external callers).
 *
 *   POST /api/public/link-audit
 *   Authorization: Bearer <LINK_AUDIT_SECRET>
 *   { "limit": 150 }
 */
export const Route = createFileRoute("/api/public/link-audit")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const header = request.headers.get("authorization") || "";
        const provided =
          header.replace(/^Bearer\s+/i, "").trim() || request.headers.get("x-audit-secret") || "";
        if (!provided || provided.length < 16) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const envSecret = process.env["LINK_AUDIT_SECRET"] || "";
        let authorized = envSecret.length > 0 && provided === envSecret;

        if (!authorized) {
          // The scheduled database job authenticates with its own rotating token.
          try {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const db = supabaseAdmin as unknown as {
              schema: (s: string) => {
                from: (t: string) => {
                  select: (c: string) => {
                    eq: (
                      c: string,
                      v: string,
                    ) => { maybeSingle: () => Promise<{ data: { value?: string } | null }> };
                  };
                };
              };
            };
            const { data } = await db
              .schema("private")
              .from("audit_config")
              .select("value")
              .eq("key", "link_audit_token")
              .maybeSingle();
            const token = data?.value || "";
            authorized = token.length > 0 && provided === token;
          } catch {
            authorized = false;
          }
        }

        if (!authorized) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        let body: { limit?: number; cursor?: number; source?: string } = {};
        try {
          body = (await request.json()) as typeof body;
        } catch {
          body = {};
        }

        try {
          const { runLinkAudit } = await import("@/lib/link-audit.server");
          const summary = await runLinkAudit({
            limit: typeof body.limit === "number" ? body.limit : 150,
            cursor: typeof body.cursor === "number" ? body.cursor : undefined,
            source: typeof body.source === "string" ? body.source.slice(0, 40) : "cron",
          });
          return Response.json({ ok: true, ...summary }, { headers: { "Cache-Control": "no-store" } });
        } catch (err) {
          console.error("[link-audit] run failed:", err);
          return Response.json({ ok: false, error: "Audit run failed" }, { status: 500 });
        }
      },
    },
  },
});
