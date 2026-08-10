/**
 * Background logo worker: /api/public/logo-worker
 * Processes queued domains (discover → download → validate → store).
 * Called by the scheduled job every minute and by the admin panel.
 * Auth: `apikey` header must match the project publishable/anon key.
 */
import { createFileRoute } from "@tanstack/react-router";

const MAX_PER_RUN = 12;
const STALE_PROCESSING_MS = 5 * 60 * 1000;

async function run(request: Request) {
  const key = process.env["SUPABASE_ANON_KEY"] || process.env["SUPABASE_PUBLISHABLE_KEY"];
  const provided = request.headers.get("apikey") || "";
  if (!key || provided !== key) {
    return new Response("Unauthorized", { status: 401 });
  }

  const limit = Math.min(
    Number(new URL(request.url).searchParams.get("limit")) || MAX_PER_RUN,
    25,
  );

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { processDomainLogo } = await import("@/lib/logo-pipeline.server");

  // Recover rows abandoned mid-flight (worker restart, timeout).
  await supabaseAdmin
    .from("tool_logos")
    .update({ status: "pending" })
    .eq("status", "processing")
    .lt("updated_at", new Date(Date.now() - STALE_PROCESSING_MS).toISOString());

  const { data: queue } = await supabaseAdmin
    .from("tool_logos")
    .select("domain")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(limit);

  let ready = 0;
  let failed = 0;
  for (const row of queue ?? []) {
    const result = await processDomainLogo(row.domain);
    if (result.status === "ready") ready += 1;
    else failed += 1;
  }

  return Response.json({ processed: ready + failed, ready, failed });
}

export const Route = createFileRoute("/api/public/logo-worker")({
  server: {
    handlers: {
      GET: async ({ request }) => run(request),
      POST: async ({ request }) => run(request),
    },
  },
});
