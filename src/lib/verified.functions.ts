import { createServerFn } from "@tanstack/react-start";
import { getCatalog, type Tool } from "./catalog-server";
import { getAdminOverlay } from "./admin-overlay.server";

/**
 * Return every tool that carries the admin "verified" badge,
 * sorted by admin-assigned position (lower = higher) then alphabetically.
 */
export const getVerifiedTools = createServerFn({ method: "GET" }).handler(async () => {
  const overlay = await getAdminOverlay();
  const catalog = getCatalog();
  let tools = overlay ? applyOverlay(catalog.tools, overlay) : catalog.tools;

  tools = tools.filter((t) => (t.badges || []).some((b) => b.toLowerCase() === "verified"));

  tools.sort((a, b) => {
    const pa = typeof a.posa === "number" && Number.isFinite(a.posa) ? a.posa : 999_999;
    const pb = typeof b.posa === "number" && Number.isFinite(b.posa) ? b.posa : 999_999;
    if (pa !== pb) return pa - pb;
    return a.n.localeCompare(b.n);
  });

  return { tools, total: tools.length };
});

function applyOverlay(tools: Tool[], overlay: Awaited<ReturnType<typeof getAdminOverlay>>): Tool[] {
  if (!overlay) return tools;
  const deletes = new Set(overlay.filter((e) => e.action === "delete").map((e) => e.original_name));
  const edits = new Map(overlay.filter((e) => e.action === "edit").map((e) => [e.original_name, e.tool_data as Tool]));
  const adds = overlay.filter((e) => e.action === "add").map((e) => e.tool_data as Tool);

  return [
    ...adds,
    ...tools
      .filter((t) => !deletes.has(t.n))
      .map((t) => (edits.has(t.n) ? { ...t, ...edits.get(t.n) } : t)),
  ];
}
