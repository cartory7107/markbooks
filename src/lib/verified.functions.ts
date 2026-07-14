import { createServerFn } from "@tanstack/react-start";
import { getCatalog, type Tool } from "./catalog-server";
import { getAdminOverlay, applyOverlay } from "./admin-overlay.server";

/**
 * Return every tool that carries the admin "verified" badge,
 * sorted by admin-assigned position (lower = higher) then alphabetically.
 */
export const getVerifiedTools = createServerFn({ method: "GET" }).handler(async () => {
  const overlay = await getAdminOverlay();
  const catalog = getCatalog();
  let tools = applyOverlay(catalog.tools, overlay);

  tools = tools.filter((t) => (t.badges || []).some((b) => b.toLowerCase() === "verified"));

  tools.sort((a, b) => {
    const pa = typeof a.posa === "number" && Number.isFinite(a.posa) ? a.posa : 999_999;
    const pb = typeof b.posa === "number" && Number.isFinite(b.posa) ? b.posa : 999_999;
    if (pa !== pb) return pa - pb;
    return a.n.localeCompare(b.n);
  });

  return { tools, total: tools.length };
});
