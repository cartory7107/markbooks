/**
 * TavBook automated link audit & security engine (server only).
 *
 * Walks the catalog in rotating batches, actually requests every official
 * URL, records the real result in `link_audit_results`, and updates
 * `tool_verifications` with genuine link health, security verdicts,
 * quarantine flags and check timestamps. `last_checked_at` is only ever
 * written when a real network check happened.
 */

import { getCatalog, slugify } from "./catalog-server";
import { assessSecurity, hostOf, shouldQuarantine, type SecurityVerdict } from "./link-security.server";

export type LinkHealth = "unknown" | "working" | "redirected" | "broken" | "insecure";

/** Cooldowns (days) before a URL is checked again. */
const COOLDOWN_OK_DAYS = 30;
const COOLDOWN_REDIRECT_DAYS = 30;
const COOLDOWN_FAIL_DAYS = 3;
const COOLDOWN_QUARANTINE_DAYS = 30;

const REQUEST_TIMEOUT_MS = 9000;
const MAX_REDIRECTS = 3;
const CONCURRENCY = 10;
const BODY_SNIFF_BYTES = 20000;

export interface AuditCandidate {
  slug: string;
  name: string;
  url: string;
  domain: string;
}

export interface CheckOutcome {
  candidate: AuditCandidate;
  statusCode: number | null;
  finalUrl: string | null;
  redirectDetected: boolean;
  domainChanged: boolean;
  httpsValid: boolean | null;
  health: LinkHealth;
  security: SecurityVerdict;
  responseMs: number;
  errorType: string | null;
}

/** Deduplicated audit universe: one entry per canonical tool slug. */
function auditUniverse(): AuditCandidate[] {
  const seen = new Set<string>();
  const out: AuditCandidate[] = [];
  for (const t of getCatalog().tools) {
    const domain = hostOf(t.u);
    if (!domain || !t.n) continue;
    const slug = slugify(t.n);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    out.push({ slug, name: t.n, url: t.u, domain });
  }
  return out;
}

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 86400_000).toISOString();
}

/** Perform one real HTTP check, following redirects manually. */
async function checkUrl(candidate: AuditCandidate): Promise<CheckOutcome> {
  const started = Date.now();
  const originHost = candidate.domain;
  let current = candidate.url;
  let redirects = 0;
  let statusCode: number | null = null;
  let errorType: string | null = null;
  let httpsValid: boolean | null = candidate.url.startsWith("https://") ? null : false;
  let body = "";

  const base = {
    candidate,
    redirectDetected: false,
    domainChanged: false,
  };

  while (redirects <= MAX_REDIRECTS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(current, {
        method: redirects === 0 ? "GET" : "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; TavBookLinkAuditor/1.0; +https://tavbook.top)",
          Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.8",
        },
      });
      clearTimeout(timer);
      statusCode = res.status;
      if (current.startsWith("https://")) httpsValid = true;

      const location = res.headers.get("location");
      if ([301, 302, 303, 307, 308].includes(res.status) && location) {
        redirects += 1;
        current = new URL(location, current).toString();
        continue;
      }

      try {
        const text = await res.text();
        body = text.slice(0, BODY_SNIFF_BYTES);
      } catch {
        body = "";
      }
      break;
    } catch (err) {
      clearTimeout(timer);
      const msg = String((err as Error)?.message || err).toLowerCase();
      if (msg.includes("abort") || msg.includes("timeout")) errorType = "timeout";
      else if (msg.includes("certificate") || msg.includes("ssl") || msg.includes("tls")) {
        errorType = "ssl_error";
        httpsValid = false;
      } else if (msg.includes("enotfound") || msg.includes("dns") || msg.includes("getaddrinfo")) {
        errorType = "dns_failure";
      } else if (msg.includes("econnrefused") || msg.includes("connect")) {
        errorType = "connection_refused";
      } else {
        errorType = "network_error";
      }
      break;
    }
  }

  if (redirects > MAX_REDIRECTS && !errorType) errorType = "too_many_redirects";

  const finalUrl = current === candidate.url ? null : current;
  const finalHost = hostOf(current);
  const redirectDetected = redirects > 0;
  const domainChanged = redirectDetected && !!finalHost && finalHost !== originHost;

  let health: LinkHealth;
  if (errorType) {
    health = errorType === "ssl_error" ? "insecure" : "broken";
  } else if (statusCode !== null && (statusCode >= 500 || statusCode === 404 || statusCode === 410)) {
    health = "broken";
  } else if (!candidate.url.startsWith("https://")) {
    health = "insecure";
  } else if (domainChanged) {
    health = "redirected";
  } else if (statusCode !== null && statusCode < 400) {
    health = "working";
  } else if (statusCode === 401 || statusCode === 403 || statusCode === 429) {
    health = "working"; // bot-blocked but alive
  } else {
    health = "broken";
  }

  const security = assessSecurity({
    url: candidate.url,
    finalUrl: current,
    body,
    httpsValid,
    statusCode,
  });

  return {
    ...base,
    statusCode,
    finalUrl,
    redirectDetected,
    domainChanged,
    httpsValid,
    health,
    security,
    responseMs: Date.now() - started,
    errorType,
  };
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      try {
        out[index] = await fn(items[index]!);
      } catch {
        // never let one URL kill the run
      }
    }
  });
  await Promise.all(workers);
  return out.filter(Boolean) as R[];
}

export interface AuditRunSummary {
  runId: string | null;
  cursorFrom: number;
  cursorTo: number;
  universe: number;
  checked: number;
  working: number;
  redirected: number;
  broken: number;
  insecure: number;
  quarantined: number;
  skippedInCooldown: number;
  durationMs: number;
}

/**
 * Run one audit batch. Picks up to `limit` listings that are due for a check
 * (never checked, or past their cooldown), starting from a rotating cursor
 * that is persisted on the previous run.
 */
export async function runLinkAudit(opts: {
  limit?: number;
  source?: string;
  cursor?: number;
}): Promise<AuditRunSummary> {
  const started = Date.now();
  const limit = Math.max(1, Math.min(500, opts.limit ?? 150));
  const source = opts.source || "cron";

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const universe = auditUniverse();
  const nowIso = new Date().toISOString();

  // Rotating cursor: continue where the previous run stopped.
  let cursorFrom = opts.cursor ?? 0;
  if (opts.cursor === undefined) {
    const { data: lastRun } = await supabaseAdmin
      .from("link_audit_runs")
      .select("notes")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const parsed = (() => {
      try {
        return JSON.parse(lastRun?.notes || "{}") as { next_cursor?: number };
      } catch {
        return {};
      }
    })();
    cursorFrom = Number.isFinite(parsed.next_cursor) ? Number(parsed.next_cursor) : 0;
  }
  if (cursorFrom < 0 || cursorFrom >= universe.length) cursorFrom = 0;

  // Collect the due candidates in a forward scan window.
  const scanWindow = Math.min(universe.length, limit * 8);
  const window: AuditCandidate[] = [];
  for (let i = 0; i < scanWindow; i++) {
    window.push(universe[(cursorFrom + i) % universe.length]!);
  }

  const { data: existing } = await supabaseAdmin
    .from("tool_verifications")
    .select("tool_slug, next_check_at, consecutive_failures, level")
    .in(
      "tool_slug",
      window.map((c) => c.slug),
    );

  const state = new Map(
    (existing ?? []).map((r) => [
      r.tool_slug,
      {
        nextCheckAt: r.next_check_at as string | null,
        failures: r.consecutive_failures ?? 0,
        level: r.level as string,
      },
    ]),
  );

  const due: AuditCandidate[] = [];
  let skippedInCooldown = 0;
  let cursorTo = cursorFrom;
  for (let i = 0; i < window.length && due.length < limit; i++) {
    const candidate = window[i]!;
    cursorTo = (cursorFrom + i + 1) % universe.length;
    const st = state.get(candidate.slug);
    if (st?.nextCheckAt && st.nextCheckAt > nowIso) {
      skippedInCooldown += 1;
      continue;
    }
    due.push(candidate);
  }

  const { data: runRow } = await supabaseAdmin
    .from("link_audit_runs")
    .insert({ trigger_source: source, status: "running" })
    .select("id")
    .maybeSingle();
  const runId = runRow?.id ?? null;

  const outcomes = await mapLimit(due, CONCURRENCY, checkUrl);

  const counts = { working: 0, redirected: 0, broken: 0, insecure: 0, quarantined: 0 };
  const resultRows: Array<Record<string, unknown>> = [];
  const verificationRows: Array<Record<string, unknown>> = [];

  for (const o of outcomes) {
    counts[o.health === "unknown" ? "broken" : o.health] += 1;
    const prevFailures = state.get(o.candidate.slug)?.failures ?? 0;
    const failed = o.health === "broken" || o.health === "insecure";
    const failures = failed ? prevFailures + 1 : 0;
    const quarantined = shouldQuarantine(o.security, failures);
    if (quarantined) counts.quarantined += 1;

    const prevLevel = state.get(o.candidate.slug)?.level;
    const level =
      quarantined || o.security.status === "malicious"
        ? "flagged"
        : prevLevel === "human_verified"
          ? "human_verified"
          : o.health === "working" && o.security.status === "clean"
            ? "auto_checked"
            : prevLevel === "flagged"
              ? "unverified"
              : (prevLevel ?? "unverified");

    const cooldown = quarantined
      ? COOLDOWN_QUARANTINE_DAYS
      : failed
        ? COOLDOWN_FAIL_DAYS
        : o.health === "redirected"
          ? COOLDOWN_REDIRECT_DAYS
          : COOLDOWN_OK_DAYS;

    resultRows.push({
      run_id: runId,
      tool_slug: o.candidate.slug,
      tool_name: o.candidate.name,
      url: o.candidate.url,
      domain: o.candidate.domain,
      status_code: o.statusCode,
      final_url: o.finalUrl,
      redirect_detected: o.redirectDetected,
      domain_changed: o.domainChanged,
      https_valid: o.httpsValid,
      link_health: o.health,
      security_status: o.security.status,
      security_reasons: o.security.reasons,
      response_ms: o.responseMs,
      error_type: o.errorType,
      checked_at: new Date().toISOString(),
    });

    verificationRows.push({
      tool_slug: o.candidate.slug,
      tool_name: o.candidate.name,
      domain: o.candidate.domain,
      level,
      link_health: o.health,
      http_status: o.statusCode,
      https_valid: o.httpsValid,
      redirect_target: o.domainChanged ? o.finalUrl : null,
      final_url: o.finalUrl,
      response_ms: o.responseMs,
      last_checked_at: new Date().toISOString(),
      consecutive_failures: failures,
      security_status: o.security.status,
      security_reasons: o.security.reasons,
      quarantined,
      next_check_at: daysFromNow(cooldown),
      last_error: o.errorType,
    });
  }

  // Persist in chunks so a large batch never exceeds a single statement limit.
  for (let i = 0; i < resultRows.length; i += 200) {
    await supabaseAdmin.from("link_audit_results").insert(resultRows.slice(i, i + 200) as never);
  }
  for (let i = 0; i < verificationRows.length; i += 200) {
    await supabaseAdmin
      .from("tool_verifications")
      .upsert(verificationRows.slice(i, i + 200) as never, { onConflict: "tool_slug" });
  }

  if (runId) {
    await supabaseAdmin
      .from("link_audit_runs")
      .update({
        finished_at: new Date().toISOString(),
        status: "completed",
        checked: outcomes.length,
        working: counts.working,
        redirected: counts.redirected,
        broken: counts.broken,
        insecure: counts.insecure,
        quarantined: counts.quarantined,
        notes: JSON.stringify({ next_cursor: cursorTo, universe: universe.length, source }),
      })
      .eq("id", runId);
  }

  return {
    runId,
    cursorFrom,
    cursorTo,
    universe: universe.length,
    checked: outcomes.length,
    working: counts.working,
    redirected: counts.redirected,
    broken: counts.broken,
    insecure: counts.insecure,
    quarantined: counts.quarantined,
    skippedInCooldown,
    durationMs: Date.now() - started,
  };
}
