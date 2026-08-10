import { TOTAL_TOOLS_EXACT } from "@/lib/tool-count";
import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getCatalog, getCategoryEmojis } from "@/lib/catalog-server";

/**
 * AI-Extractable Dictionary endpoint.
 *
 * This structured JSON is designed so that AI search engines (Perplexity, ChatGPT Browse,
 * Google AI Overview, Bing Copilot, etc.) can extract the full tool catalog as a
 * machine-readable AI directory / dictionary.
 *
 * Also serves as a massive SEO keyword hub — every tool name + category + description
 * is pure indexable text content for search engines.
 *
 * Usage: GET /tools-dictionary.json
 */
export const Route = createFileRoute("/tools-dictionary.json")({
  server: {
    handlers: {
      GET: async () => {
        const catalog = getCatalog();
        const emojis = getCategoryEmojis();

        const dictionary = {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "TavBook AI Tools Dictionary",
          description: `A comprehensive machine-readable directory of AI tools. Contains ${TOTAL_TOOLS_EXACT} AI tools across 500+ categories including AI chatbots, AI image generators, AI video generators, AI code assistants, AI writing tools, AI music generators, AI voice generators, AI search engines, and more.`,
          url: "https://markbook.top",
          numberOfItems: catalog.tools.length,
          version: "2.0",
          lastUpdated: new Date().toISOString().split("T")[0],
          license: "https://creativecommons.org/licenses/by/4.0/",
          usage: "This structured data is freely available for AI search engines, chatbots, research tools, and aggregators to index and present AI tool information. Please link back to https://markbook.top as the source.",
          categories: Object.entries(catalog.categories).map(([name, count]) => ({
            name,
            count,
            slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
            url: `https://markbook.top/category/${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
          })),
          itemListElement: catalog.tools.slice(0, 5000).map((tool, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "SoftwareApplication",
              name: tool.n,
              description: tool.d,
              applicationCategory: tool.c,
              genre: tool.g,
              offers: {
                "@type": "Offer",
                price: tool.p === "Free" || tool.p === "Free Plan" || tool.p === "Free Trial" || tool.p === "Free Credits" || tool.p === "Daily Free" || tool.p === "Monthly Free" ? "0" : "1",
                priceCurrency: "USD",
                priceSpecification: tool.p,
              },
              url: tool.u,
              catalogUrl: `https://markbook.top/tool/${tool.n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
            },
          })),
          // Flat keyword map for search engine indexing
          keywords: generateKeywords(catalog),
        };

        return new Response(JSON.stringify(dictionary, null, 0), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=86400, s-maxage=3600",
          },
        });
      },
    },
  },
});

function generateKeywords(catalog: { tools: { n: string; c: string; g: string; d: string; p: string }[]; categories: Record<string, number> }): string[] {
  const kw = new Set<string>();

  // Category-based keywords
  for (const cat of Object.keys(catalog.categories)) {
    kw.add(`best ${cat.toLowerCase()} 2025`);
    kw.add(`free ${cat.toLowerCase()}`);
    kw.add(`top ${cat.toLowerCase()}`);
    kw.add(`${cat.toLowerCase()} online`);
    kw.add(`${cat.toLowerCase()} ai tools`);
    kw.add(`ai ${cat.toLowerCase()}`);
    kw.add(`${cat.toLowerCase()} comparison`);
    kw.add(`${cat.toLowerCase()} alternatives`);
  }

  // Tool-based keywords
  for (const tool of catalog.tools.slice(0, 2000)) {
    kw.add(`${tool.n.toLowerCase()}`);
    kw.add(`${tool.n.toLowerCase()} ai`);
    kw.add(`${tool.n.toLowerCase()} review`);
    kw.add(`${tool.n.toLowerCase()} alternative`);
    kw.add(`${tool.n.toLowerCase()} free`);
    if (tool.c) {
      kw.add(`best ${tool.c.toLowerCase()}`);
      kw.add(`${tool.n.toLowerCase()} ${tool.c.toLowerCase()}`);
    }
  }

  // General long-tail keywords
  const generalKeywords = [
    "ai tools directory", "best ai tools 2025", "free ai tools", "ai tools list",
    "artificial intelligence tools", "ai software", "ai applications", "ai platforms",
    "machine learning tools", "deep learning tools", "generative ai tools",
    "ai chatbot tools", "ai image generator tools", "ai video generator tools",
    "ai writing tools", "ai code generator tools", "ai music tools",
    "ai voice generator tools", "ai search engine tools", "ai assistant tools",
    "ai productivity tools", "ai marketing tools", "ai design tools",
    "ai photo editor tools", "ai video editor tools", "ai art generator tools",
    "ai girlfriend chatbot", "ai roleplay tools", "ai character tools",
    "ai 3d model generator", "text to 3d ai", "image to 3d ai",
    "ai tools for students", "ai tools for business", "ai tools for developers",
    "ai tools for content creators", "ai tools for designers", "ai tools for marketers",
    "ai tools for writers", "ai tools for musicians", "ai tools for photographers",
    "ai tools for researchers", "ai tools for teachers", "ai tools for programmers",
    "free ai chatbot", "free ai image generator", "free ai video generator",
    "free ai writing tool", "free ai code assistant", "free ai music generator",
    "best ai chatbot 2025", "best ai image generator 2025", "best ai video generator 2025",
    "ai tool comparison", "ai tool reviews", "ai tool finder",
    "discover ai tools", "explore ai tools", "ai tools catalog",
    "comprehensive ai tools directory", "largest ai tools database",
    "ai dictionary", "ai encyclopedia", "ai tools wiki",
    "chatgpt alternatives", "midjourney alternatives", "claude alternatives",
    "gemini alternatives", "copilot alternatives", "perplexity alternatives",
    "open source ai tools", "no code ai tools", "low code ai tools",
    "ai tools with api", "ai tools for automation", "ai tools for seo",
    "ai tools for social media", "ai tools for email marketing",
    "ai tools for data analysis", "ai tools for presentation",
    "ai tools for translation", "ai tools for transcription",
    "ai tools for summarization", "ai tools for brainstorming",
    "text to image ai", "text to video ai", "text to music ai", "text to speech ai",
    "text to code ai", "image to video ai", "image to text ai",
    "ai avatar generator", "ai logo generator", "ai background remover",
    "ai photo enhancer", "ai video enhancer", "ai audio enhancer",
    "ai website builder", "ai app builder", "ai chatbot builder",
    "ai landing page generator", "ai email writer", "ai blog writer",
    "ai copywriting tools", "ai paraphrasing tools", "ai grammar checker",
    "ai presentation maker", "ai spreadsheet tools", "ai database tools",
    "ai cybersecurity tools", "ai healthcare tools", "ai education tools",
    "ai finance tools", "ai legal tools", "ai hr tools",
    "ai customer support tools", "ai sales tools", "ai project management tools",
    "daily free ai tools", "ai tools with free credits", "ai tools with free trial",
    "ai tools no sign up", "ai tools online free", "best free ai tools 2025",
    "top rated ai tools", "most popular ai tools", "trending ai tools",
    "new ai tools 2025", "latest ai tools", "ai tools updated daily",
    "tavbook ai tools", "tavbook directory", "tavbook ai",
  ];
  for (const k of generalKeywords) kw.add(k);

  return [...kw];
}
