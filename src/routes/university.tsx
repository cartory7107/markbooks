import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * /university has been replaced by /blog.
 * This route permanently redirects to /blog for SEO and backwards compatibility.
 */
export const Route = createFileRoute("/university")({
  beforeLoad: () => {
    throw redirect({ to: "/blog", replace: true });
  },
});