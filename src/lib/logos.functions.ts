import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type AuthedContext = { supabase: { from: (t: "user_roles") => any }; userId: string };

/** Role check through the caller's own RLS-scoped client (users can read their own roles). */
async function assertAdmin(context: AuthedContext) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

/** Aggregate logo-pipeline metrics for the admin panel (admins only). */
export const getLogoStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const counts: Record<string, number> = { pending: 0, processing: 0, ready: 0, failed: 0 };
    for (const status of Object.keys(counts)) {
      const { count } = await supabaseAdmin
        .from("tool_logos")
        .select("id", { count: "exact", head: true })
        .eq("status", status);
      counts[status] = count ?? 0;
    }
    const { data: failures } = await supabaseAdmin
      .from("tool_logos")
      .select("domain, error, attempts, updated_at")
      .eq("status", "failed")
      .order("updated_at", { ascending: false })
      .limit(50);

    return { counts, failures: failures ?? [] };
  });

/** Admin: force re-processing (or clearing) of one domain's logo. */
export const retryLogo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { domain: string; clear?: boolean }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const { normalizeDomain, processDomainLogo } = await import("@/lib/logo-pipeline.server");
    const domain = normalizeDomain(data.domain);
    if (!domain) return { ok: false, status: "failed" as const, error: "invalid domain" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.clear) {
      await supabaseAdmin.from("tool_logos").delete().eq("domain", domain);
      return { ok: true, status: "pending" as const };
    }
    await supabaseAdmin
      .from("tool_logos")
      .upsert(
        { domain, status: "pending", storage_path: null, error: null },
        { onConflict: "domain" },
      );
    const result = await processDomainLogo(domain);
    return { ok: result.status === "ready", status: result.status };
  });

/**
 * Admin: process a controlled batch of domains (existing-catalog migration).
 * Already-ready domains are skipped, failures are recorded and never stop the batch.
 */
export const processLogoBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { domains?: string[]; fromQueue?: boolean; limit?: number }) => ({
    domains: (input.domains ?? []).slice(0, 100),
    fromQueue: input.fromQueue ?? false,
    limit: Math.min(input.limit ?? 25, 100),
  }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const { normalizeDomain, processDomainLogo } = await import("@/lib/logo-pipeline.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let domains = [...new Set(data.domains.map(normalizeDomain).filter((d): d is string => !!d))];

    if (data.fromQueue) {
      const { data: queue } = await supabaseAdmin
        .from("tool_logos")
        .select("domain")
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(data.limit);
      domains = [...new Set([...domains, ...(queue ?? []).map((r) => r.domain)])];
    }

    if (domains.length === 0) return { processed: 0, ready: 0, failed: 0, skipped: 0 };

    const { data: existing } = await supabaseAdmin
      .from("tool_logos")
      .select("domain, status")
      .in("domain", domains);
    const done = new Set(
      (existing ?? []).filter((r) => r.status === "ready" || r.status === "failed").map((r) => r.domain),
    );

    let ready = 0;
    let failed = 0;
    for (const domain of domains) {
      if (done.has(domain)) continue;
      const result = await processDomainLogo(domain);
      if (result.status === "ready") ready += 1;
      else failed += 1;
    }
    return { processed: ready + failed, ready, failed, skipped: done.size };
  });
