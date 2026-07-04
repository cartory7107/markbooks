/**
 * Server-only helper that fetches admin tool edits from Supabase and returns
 * a fast in-memory overlay applied on top of the static catalog. This makes
 * admin panel edits appear on the live site (nearly) instantly — no rebuild.
 *
 * Uses a short in-memory cache (5s) to avoid hammering Supabase per request.
 */
import type { Tool } from "./catalog-server";

export type AdminOverlay = {
  deletes: Set<string>; // normalized (lowercased) original names
  edits: Map<string, Partial<Tool>>; // key: normalized original name
  adds: Tool[];
};

const EMPTY: AdminOverlay = { deletes: new Set(), edits: new Map(), adds: [] };
const TTL_MS = 5_000;

let cache: { at: number; data: AdminOverlay } | null = null;
let inflight: Promise<AdminOverlay> | null = null;

const norm = (s: string) => (s || "").trim().toLowerCase();

async function fetchOverlay(): Promise<AdminOverlay> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return EMPTY;

  try {
    const res = await fetch(
      `${url}/rest/v1/admin_tool_edits?select=original_name,tool_data,action&order=created_at.asc`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Accept: "application/json",
        },
      },
    );
    if (!res.ok) return EMPTY;
    const rows = (await res.json()) as Array<{
      original_name: string | null;
      tool_data: Partial<Tool>;
      action: "add" | "edit" | "delete";
    }>;

    const deletes = new Set<string>();
    const edits = new Map<string, Partial<Tool>>();
    const adds: Tool[] = [];

    for (const r of rows) {
      if (r.action === "delete" && r.original_name) {
        deletes.add(norm(r.original_name));
      } else if (r.action === "edit" && r.original_name) {
        // Later edits win — merge with prior edit for same tool
        const key = norm(r.original_name);
        edits.set(key, { ...(edits.get(key) || {}), ...r.tool_data });
      } else if (r.action === "add" && r.tool_data && (r.tool_data as Tool).n) {
        adds.push(r.tool_data as Tool);
      }
    }
    return { deletes, edits, adds };
  } catch {
    return EMPTY;
  }
}

export async function getAdminOverlay(): Promise<AdminOverlay> {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return cache.data;
  if (inflight) return inflight;
  inflight = fetchOverlay().then((data) => {
    cache = { at: Date.now(), data };
    inflight = null;
    return data;
  });
  return inflight;
}

/** Apply overlay to a tools array (immutable). */
export function applyOverlay(tools: Tool[], overlay: AdminOverlay): Tool[] {
  if (!overlay.deletes.size && !overlay.edits.size && !overlay.adds.length) return tools;
  const out: Tool[] = [];
  const seen = new Set<string>();
  for (const t of tools) {
    const k = norm(t.n);
    if (overlay.deletes.has(k)) continue;
    if (overlay.edits.has(k)) {
      out.push({ ...t, ...overlay.edits.get(k)! });
    } else {
      out.push(t);
    }
    seen.add(k);
  }
  // Prepend admin-added tools that aren't already present
  for (const add of overlay.adds) {
    const k = norm(add.n);
    if (!seen.has(k) && !overlay.deletes.has(k)) {
      out.unshift(add);
      seen.add(k);
    }
  }
  return out;
}

/** Find one tool by name, applying overlay. Returns null if deleted. */
export function findToolWithOverlay(
  tools: Tool[],
  name: string,
  overlay: AdminOverlay,
): Tool | null {
  const k = norm(name);
  if (overlay.deletes.has(k)) return null;
  const add = overlay.adds.find((a) => norm(a.n) === k);
  if (add) return { ...add, ...(overlay.edits.get(k) || {}) };
  const base = tools.find((t) => norm(t.n) === k);
  if (!base) return null;
  return overlay.edits.has(k) ? { ...base, ...overlay.edits.get(k)! } : base;
}
