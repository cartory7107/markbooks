/**
 * TavBook verification & link-health layer (server only).
 *
 * Reads the `tool_verifications` table with the publishable key (public,
 * read-only RLS policy) and renders a fully crawlable "Verification & Link
 * Status" block for tool pages. All output is static server HTML — no
 * client-side interaction is required to read the trust information.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type VerificationLevel = "unverified" | "auto_checked" | "human_verified" | "flagged";
export type LinkHealth = "unknown" | "working" | "redirected" | "broken" | "insecure";
export type SecurityStatus = "clean" | "suspicious" | "parked" | "malicious";

export interface VerificationRecord {
  level: VerificationLevel;
  verified_at: string | null;
  link_health: LinkHealth;
  http_status: number | null;
  https_valid: boolean | null;
  redirect_target: string | null;
  last_checked_at: string | null;
  consecutive_failures: number;
  public_notes: string | null;
  security_status: SecurityStatus;
  security_reasons: string[];
  quarantined: boolean;
}

const EMPTY: VerificationRecord = {
  level: "unverified",
  verified_at: null,
  link_health: "unknown",
  http_status: null,
  https_valid: null,
  redirect_target: null,
  last_checked_at: null,
  consecutive_failures: 0,
  public_notes: null,
  security_status: "clean",
  security_reasons: [],
  quarantined: false,
};

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/** Fetch the stored verification record for a tool slug (never throws). */
export async function getVerification(slug: string): Promise<VerificationRecord> {
  try {
    const supabase = publicClient();
    const { data } = await supabase
      .from("tool_verifications")
      .select(
        "level, verified_at, link_health, http_status, https_valid, redirect_target, last_checked_at, consecutive_failures, public_notes, security_status, security_reasons, quarantined",
      )
      .eq("tool_slug", slug)
      .maybeSingle();
    if (!data) return EMPTY;
    return { ...EMPTY, ...(data as Partial<VerificationRecord>) };
  } catch {
    return EMPTY;
  }
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function fmtDate(iso: string | null): string {
  if (!iso) return "Not yet recorded";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Not yet recorded";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const LEVEL_COPY: Record<VerificationLevel, { label: string; tone: string; blurb: string }> = {
  human_verified: {
    label: "Human verified",
    tone: "ok",
    blurb: "A TavBook editor manually opened the official website and confirmed the tool name, description and destination link.",
  },
  auto_checked: {
    label: "Automatically checked",
    tone: "info",
    blurb: "This listing passed TavBook's automated checks (reachable official link, valid HTTPS certificate, no suspicious redirect) but has not yet had a manual editorial review.",
  },
  unverified: {
    label: "Not verified yet",
    tone: "warn",
    blurb: "This listing is queued for review. Details come from the submitted or crawled source and have not been confirmed by a TavBook editor.",
  },
  flagged: {
    label: "Flagged for review",
    tone: "bad",
    blurb: "This listing has been flagged. The official link or the listing details may be inaccurate — please treat it with caution until the review is complete.",
  },
};

const HEALTH_COPY: Record<LinkHealth, { label: string; tone: string }> = {
  working: { label: "Link working", tone: "ok" },
  redirected: { label: "Link redirects", tone: "info" },
  broken: { label: "Link broken", tone: "bad" },
  insecure: { label: "Insecure connection", tone: "bad" },
  unknown: { label: "Link not checked yet", tone: "warn" },
};

const SECURITY_COPY: Record<SecurityStatus, { label: string; tone: string; blurb: string }> = {
  clean: {
    label: "Security check passed",
    tone: "ok",
    blurb: "TavBook's automated security scan found no signs of phishing, brand impersonation or a parked domain on the destination site.",
  },
  suspicious: {
    label: "Security review pending",
    tone: "warn",
    blurb: "TavBook's automated scan raised one or more low-confidence signals on this destination. A human editor is reviewing it.",
  },
  parked: {
    label: "Domain appears parked",
    tone: "bad",
    blurb: "The official link now lands on a parked, expired or for-sale domain rather than a working AI product. The listing has been removed from search indexing until it is fixed.",
  },
  malicious: {
    label: "Security risk detected",
    tone: "bad",
    blurb: "TavBook's automated scan detected serious risk signals (brand impersonation, credential or wallet harvesting). Do not enter personal data on this destination. The listing is quarantined and excluded from search indexing.",
  },
};

/** CSS for the verification block — append inside the page's <style>. */
export const VERIFICATION_CSS = `
.vb{margin:0 0 28px;padding:22px;border:1px solid #e5e7eb;border-radius:16px;background:rgba(255,255,255,.9);position:relative;z-index:1}
.vb h2{font-size:18px;font-weight:800;letter-spacing:-.01em;color:#111827}
.vb .vb-sub{margin-top:4px;font-size:13px;color:#6b7280}
.vb-badges{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.vb-badge{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;border-radius:999px;padding:6px 13px;border:1px solid}
.vb-ok{color:#047857;background:rgba(16,185,129,.10);border-color:rgba(16,185,129,.28)}
.vb-info{color:#1d4ed8;background:rgba(59,130,246,.10);border-color:rgba(59,130,246,.28)}
.vb-warn{color:#b45309;background:rgba(245,158,11,.10);border-color:rgba(245,158,11,.28)}
.vb-bad{color:#b91c1c;background:rgba(239,68,68,.10);border-color:rgba(239,68,68,.28)}
.vb-note{margin-top:14px;font-size:13.5px;color:#4b5563;line-height:1.75}
.vb-grid{margin-top:16px;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}
.vb-cell{border:1px solid #eef0f3;border-radius:12px;padding:10px 12px;background:#fafafa}
.vb-cell dt{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#9ca3af;font-weight:700}
.vb-cell dd{margin-top:3px;font-size:13px;color:#111827;font-weight:600;word-break:break-word}
.vb-foot{margin-top:14px;font-size:12px;color:#6b7280}
.vb-foot a{font-weight:600}
.vb-reasons{margin:10px 0 0 18px;font-size:13px;color:#4b5563;line-height:1.7}
.vb-reasons li{margin-bottom:4px}
`;

/**
 * Render the crawlable verification block for a tool page.
 * `hasVerifiedBadge` comes from the admin overlay badges and upgrades the
 * displayed level when no database record exists yet.
 */
export function renderVerificationBlock(opts: {
  toolName: string;
  domain: string;
  record: VerificationRecord;
  hasVerifiedBadge: boolean;
}): string {
  const { toolName, domain, hasVerifiedBadge } = opts;
  const rec = opts.record;
  const level: VerificationLevel =
    rec.level === "unverified" && hasVerifiedBadge ? "human_verified" : rec.level;
  const lc = LEVEL_COPY[level];
  const hc = HEALTH_COPY[rec.link_health];

  const cells: Array<[string, string]> = [
    ["Official domain", domain || "Not provided"],
    ["Last link check", fmtDate(rec.last_checked_at)],
    ["Response code", rec.http_status ? String(rec.http_status) : "Not checked"],
    ["HTTPS certificate", rec.https_valid === null ? "Not checked" : rec.https_valid ? "Valid" : "Invalid"],
    ["Editorial review", level === "human_verified" ? fmtDate(rec.verified_at) || "Verified" : "Pending"],
  ];
  if (rec.redirect_target) cells.push(["Redirects to", rec.redirect_target]);
  if (rec.consecutive_failures > 0) cells.push(["Failed checks in a row", String(rec.consecutive_failures)]);

  const cellsHtml = cells
    .map(([k, v]) => `<div class="vb-cell"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`)
    .join("");

  const sc = SECURITY_COPY[rec.security_status] ?? SECURITY_COPY.clean;
  const notes = rec.public_notes ? `<p class="vb-note">${esc(rec.public_notes)}</p>` : "";
  const securityReasons = rec.security_reasons?.length
    ? `<ul class="vb-reasons">${rec.security_reasons.slice(0, 6).map((r) => `<li>${esc(r)}</li>`).join("")}</ul>`
    : "";
  const quarantineNote = rec.quarantined
    ? `<p class="vb-note"><strong>Quarantined:</strong> this listing is hidden from TavBook's sitemap and search indexing until the link and destination pass a fresh check.</p>`
    : "";

  return `
  <section class="vb" id="verification">
    <h2>TavBook Verification &amp; Link Status</h2>
    <p class="vb-sub">How this ${esc(toolName)} listing was checked before it was published.</p>
    <div class="vb-badges">
      <span class="vb-badge vb-${lc.tone}">${esc(lc.label)}</span>
      <span class="vb-badge vb-${hc.tone}">${esc(hc.label)}</span>
      <span class="vb-badge vb-${sc.tone}">${esc(sc.label)}</span>
    </div>
    <p class="vb-note">${esc(lc.blurb)}</p>
    <p class="vb-note">${esc(sc.blurb)}</p>
    ${securityReasons}
    ${quarantineNote}
    ${notes}
    <dl class="vb-grid">${cellsHtml}</dl>
    <p class="vb-foot">Something wrong with this listing? <a href="/contact">Report it to the TavBook team</a> and we will re-check the link and details.</p>
  </section>`;
}


let _quarantineCache: { at: number; slugs: Set<string> } | null = null;

/**
 * Slugs currently quarantined by the automated audit. Cached for 60s so
 * sitemap and tool-page renders stay fast.
 */
export async function getQuarantinedSlugs(): Promise<Set<string>> {
  if (_quarantineCache && Date.now() - _quarantineCache.at < 60_000) return _quarantineCache.slugs;
  try {
    const supabase = publicClient();
    const { data } = await supabase
      .from("tool_verifications")
      .select("tool_slug")
      .eq("quarantined", true)
      .limit(50_000);
    const slugs = new Set((data ?? []).map((r) => r.tool_slug as string));
    _quarantineCache = { at: Date.now(), slugs };
    return slugs;
  } catch {
    return _quarantineCache?.slugs ?? new Set<string>();
  }
}
