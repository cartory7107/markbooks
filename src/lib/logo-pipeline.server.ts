/**
 * Server-only logo pipeline: discover → download → validate → store in Supabase Storage.
 * Runs once per domain; results are recorded in public.tool_logos and reused forever.
 * NOTE: image raster resizing is not available in the edge runtime (no sharp/canvas),
 * so we prefer already-small icon sources and enforce a hard byte cap instead.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const LOGO_BUCKET = "tool-logos";
const MAX_BYTES = 300 * 1024; // 300 KB hard cap
const HTML_BYTES = 180 * 1024; // only read the head-ish part of the page
const FETCH_TIMEOUT = 8000;
const UA =
  "Mozilla/5.0 (compatible; TavBookLogoBot/1.0; +https://tavbook.top/about)";

export type LogoStatus = "pending" | "processing" | "ready" | "failed";

export interface LogoRow {
  domain: string;
  status: LogoStatus;
  storage_path: string | null;
  content_type: string | null;
  source: string | null;
  attempts: number;
  updated_at: string;
}

/** Normalize any user/catalog value to a bare, safe hostname. */
export function normalizeDomain(input: string): string | null {
  if (!input) return null;
  let raw = input.trim().toLowerCase();
  if (!raw) return null;
  if (!raw.includes("://")) raw = `https://${raw}`;
  let host: string;
  try {
    host = new URL(raw).hostname;
  } catch {
    return null;
  }
  host = host.replace(/^www\./, "");
  // reject internal / non-public targets (SSRF hardening)
  if (
    !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host) ||
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^\d+\.\d+\.\d+\.\d+$/.test(host)
  ) {
    return null;
  }
  return host;
}

function withTimeout(ms: number) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, done: () => clearTimeout(timer) };
}

async function safeFetch(url: string, accept: string): Promise<Response | null> {
  const t = withTimeout(FETCH_TIMEOUT);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: t.signal,
      headers: { "user-agent": UA, accept },
    });
    return res.ok ? res : null;
  } catch {
    return null;
  } finally {
    t.done();
  }
}

/** Minimal HTML metadata scan — never crawls beyond the submitted page. */
async function discoverCandidates(domain: string): Promise<string[]> {
  const candidates: string[] = [];
  const base = `https://${domain}/`;
  const res = await safeFetch(base, "text/html,application/xhtml+xml");
  if (res) {
    const reader = res.body?.getReader();
    let html = "";
    if (reader) {
      const decoder = new TextDecoder();
      let received = 0;
      while (received < HTML_BYTES) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value?.byteLength ?? 0;
        html += decoder.decode(value ?? new Uint8Array(), { stream: true });
        if (/<\/head>/i.test(html)) break;
      }
      try {
        await reader.cancel();
      } catch {
        /* ignore */
      }
    }

    const linkTags = html.match(/<link[^>]+>/gi) ?? [];
    const byRel = (test: RegExp) =>
      linkTags
        .filter((tag) => test.test(tag))
        .map((tag) => tag.match(/href\s*=\s*["']([^"']+)["']/i)?.[1])
        .filter((href): href is string => Boolean(href));

    const ordered = [
      ...byRel(/rel\s*=\s*["'][^"']*apple-touch-icon[^"']*["']/i),
      ...byRel(/rel\s*=\s*["'][^"']*\bicon\b[^"']*["']/i),
      ...byRel(/rel\s*=\s*["'][^"']*mask-icon[^"']*["']/i),
    ];

    const ogLogo = html.match(
      /<meta[^>]+property\s*=\s*["']og:logo["'][^>]+content\s*=\s*["']([^"']+)["']/i,
    )?.[1];
    if (ogLogo) ordered.unshift(ogLogo);

    for (const href of ordered) {
      try {
        candidates.push(new URL(href, res.url || base).toString());
      } catch {
        /* skip bad href */
      }
    }
  }

  candidates.push(`https://${domain}/apple-touch-icon.png`);
  candidates.push(`https://${domain}/favicon.ico`);
  return [...new Set(candidates)].slice(0, 6);
}

/** Sniff real image type from magic bytes; never trust extension or header alone. */
function sniffImage(bytes: Uint8Array): string | null {
  const b = bytes;
  if (b.length < 8) return null;
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "image/gif";
  if (
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) {
    return "image/webp";
  }
  if (b[0] === 0x00 && b[1] === 0x00 && b[2] === 0x01 && b[3] === 0x00) return "image/x-icon";
  if (b[0] === 0x42 && b[1] === 0x4d) return "image/bmp";
  return null; // SVG and anything else is rejected on purpose
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes as unknown as ArrayBuffer);
  return [...new Uint8Array(digest)].map((n) => n.toString(16).padStart(2, "0")).join("");
}

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/x-icon": "ico",
  "image/bmp": "bmp",
};

async function download(url: string): Promise<{ bytes: Uint8Array; type: string } | null> {
  const res = await safeFetch(url, "image/*");
  if (!res) return null;
  const declared = Number(res.headers.get("content-length") ?? "0");
  if (declared > MAX_BYTES) return null;
  const buf = await res.arrayBuffer();
  if (buf.byteLength === 0 || buf.byteLength > MAX_BYTES) return null;
  const bytes = new Uint8Array(buf);
  const type = sniffImage(bytes);
  if (!type) return null;
  return { bytes, type };
}

/**
 * Full pipeline for one domain. Idempotent, never throws.
 * Returns the resulting row-ish info so callers can serve immediately.
 */
export async function processDomainLogo(
  domain: string,
): Promise<{ status: LogoStatus; storage_path: string | null; content_type: string | null }> {
  const failed = { status: "failed" as LogoStatus, storage_path: null, content_type: null };
  try {
    await supabaseAdmin
      .from("tool_logos")
      .upsert({ domain, status: "processing" }, { onConflict: "domain" });

    const candidates = await discoverCandidates(domain);
    for (const candidate of candidates) {
      const file = await download(candidate);
      if (!file) continue;

      const hash = await sha256Hex(file.bytes);
      const ext = EXT[file.type] ?? "png";

      // Content-hash dedupe: reuse an already-stored identical image.
      const { data: twin } = await supabaseAdmin
        .from("tool_logos")
        .select("storage_path, content_type")
        .eq("content_hash", hash)
        .eq("status", "ready")
        .not("storage_path", "is", null)
        .limit(1)
        .maybeSingle();

      let path = twin?.storage_path ?? null;
      if (!path) {
        path = `${domain}/${hash.slice(0, 16)}.${ext}`;
        const { error: upErr } = await supabaseAdmin.storage
          .from(LOGO_BUCKET)
          .upload(path, file.bytes as unknown as ArrayBuffer, {
            contentType: file.type,
            cacheControl: "31536000",
            upsert: true,
          });
        if (upErr) {
          await supabaseAdmin
            .from("tool_logos")
            .update({ status: "failed", error: `upload: ${upErr.message}` })
            .eq("domain", domain);
          return failed;
        }
      }

      const contentType = twin?.content_type ?? file.type;
      await supabaseAdmin
        .from("tool_logos")
        .update({
          status: "ready",
          storage_path: path,
          public_url: `/api/public/logo/${domain}`,
          source: candidate,
          content_hash: hash,
          content_type: contentType,
          byte_size: file.bytes.byteLength,
          error: null,
          logo_updated_at: new Date().toISOString(),
        })
        .eq("domain", domain);

      return { status: "ready", storage_path: path, content_type: contentType };
    }

    await supabaseAdmin
      .from("tool_logos")
      .update({ status: "failed", error: "no valid icon found" })
      .eq("domain", domain);
    return failed;
  } catch (err) {
    await supabaseAdmin
      .from("tool_logos")
      .update({ status: "failed", error: String(err).slice(0, 300) })
      .eq("domain", domain)
      .then(() => undefined, () => undefined);
    return failed;
  }
}

/** Lightweight, deterministic initials placeholder — never hits an external server. */
export function placeholderSvg(seed: string): string {
  const letters = (seed.replace(/[^a-z0-9 ]/gi, "").trim() || "AI")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % 360;
  const hue = hash;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" role="img"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},68%,52%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360},68%,38%)"/></linearGradient></defs><rect width="128" height="128" rx="26" fill="url(#g)"/><text x="64" y="64" text-anchor="middle" dominant-baseline="central" font-family="Inter,system-ui,sans-serif" font-size="52" font-weight="700" fill="#fff">${letters || "AI"}</text></svg>`;
}
