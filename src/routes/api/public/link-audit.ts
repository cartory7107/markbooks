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
        const secret = process.env["LINK_AUDIT_SECRET"];
        if (!secret) {
          return Response.json({ error: "Auditor is not configured." }, { status: 503 });
        }

        const header = request.headers.get("authorization") || "";
        const provided = header.replace(/^Bearer\s+/i, "").trim() || request.headers.get("x-audit-secret") || "";
        if (provided.length !== secret.length || provided !== secret) {
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
