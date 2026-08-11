import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

/**
 * Server-side AI news endpoint.
 * Fetches from Hacker News API (no API key, no CORS issues on server).
 * Filters for AI-related stories and returns JSON array.
 *
 * Usage: GET /ai-news-api.json
 */

const FALLBACK_NEWS = [
  { title: "Frontier labs push agentic AI into everyday productivity apps", time: "2h ago", url: "https://openai.com/news", source: "AI News" },
  { title: "Open-weight models keep closing the gap with closed frontier systems", time: "4h ago", url: "https://huggingface.co/blog", source: "AI News" },
  { title: "AI coding assistants become the default developer workflow", time: "6h ago", url: "https://github.blog", source: "AI News" },
  { title: "Real-time video generation moves from demo to production tooling", time: "8h ago", url: "https://stability.ai/news", source: "AI News" },
  { title: "On-device AI assistants expand to more languages and regions", time: "10h ago", url: "https://blog.google/technology/ai/", source: "AI News" },
  { title: "Enterprises shift budgets from pilots to deployed AI agents", time: "12h ago", url: "https://www.microsoft.com/en-us/ai", source: "AI News" },
  { title: "AI data-centre demand reshapes chip roadmaps", time: "15h ago", url: "https://blogs.nvidia.com", source: "AI News" },
  { title: "Regulators sharpen transparency rules for general-purpose AI", time: "18h ago", url: "https://digital-strategy.ec.europa.eu", source: "AI News" },
  { title: "Voice AI quality improves as latency drops below human response time", time: "20h ago", url: "https://elevenlabs.io/blog", source: "AI News" },
  { title: "AI research agents start co-authoring published papers", time: "1d ago", url: "https://www.anthropic.com/news", source: "AI News" },
];


const AI_KEYWORDS = [
  "ai", "artificial intelligence", "llm", "gpt", "model", "machine learning",
  "openai", "google", "anthropic", "meta", "nvidia", "neural", "deep learning",
  "robot", "chatbot", "transformer", "diffusion", "stable diffusion", "midjourney",
  "claude", "gemini", "copilot", "llama", "mistral", "perplexity",
];

function isAIRelated(title: string): boolean {
  const lower = title.toLowerCase();
  return AI_KEYWORDS.some((kw) => lower.includes(kw));
}

function getRelativeTime(unixTimestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - unixTimestamp;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 604800)}w ago`;
}

interface HNItem {
  title?: string;
  url?: string;
  time?: number;
  id?: number;
}

export const Route = createFileRoute("/ai-news-api.json")({
  server: {
    handlers: {
      GET: async () => {
        let news = FALLBACK_NEWS;

        try {
          const resp = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json", {
            signal: AbortSignal.timeout(5000),
          });
          const ids = (await resp.json()) as number[];
          const top20 = ids.slice(0, 20);

          const stories = await Promise.all(
            top20.map((id) =>
              fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
                signal: AbortSignal.timeout(3000),
              })
                .then((r) => r.json() as Promise<HNItem>)
                .then((item) => ({
                  title: item.title || "Untitled",
                  url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
                  source: "Hacker News",
                  time: item.time ? getRelativeTime(item.time) : "recently",
                }))
                .catch(() => null)
            )
          );

          const valid = stories.filter((s): s is NonNullable<typeof s> => s !== null);

          // Prefer AI-related stories first, then fill with general tech
          const aiStories = valid.filter((s) => isAIRelated(s.title));
          const otherStories = valid.filter((s) => !isAIRelated(s.title));
          news = [...aiStories, ...otherStories].slice(0, 10);
        } catch {
          // Use fallback
        }

        return new Response(JSON.stringify(news), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=300, s-maxage=600",
          },
        });
      },
    },
  },
});