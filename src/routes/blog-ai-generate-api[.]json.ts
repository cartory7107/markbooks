import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * AI Blog Post Generation API.
 *
 * POST /blog-ai-generate-api.json
 * Body: { topic, category?, tone?, targetWords? }
 *
 * Uses the Vercel AI SDK with an OpenAI-compatible provider.
 * Configure via env vars:
 *   AI_API_KEY      — API key (required)
 *   AI_BASE_URL     — Base URL (default: https://openrouter.ai/api/v1)
 *   AI_MODEL        — Model ID   (default: google/gemini-2.5-flash)
 */
export const Route = createFileRoute("/blog-ai-generate-api.json")({
  ssr: false,
  server: {
    handlers: {
      POST: async ({ request }) => {
        // ── Auth check (reuse admin middleware) ──
        const { supabaseAdmin: rawSupabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const supabaseAdmin = rawSupabaseAdmin as never as {
          auth: { getUser: (token: string) => Promise<{ data: { user: { id: string } | null }; error: unknown }> };
          from: (table: string) => any;
        };
        const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }
        const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
        const userId = authData.user?.id;
        if (authError || !userId) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }
        const roleQuery = supabaseAdmin.from("user_roles").select("id");
        const { data: roleData, error: roleError } = await roleQuery
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();
        if (roleError || !roleData) {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          });
        }

        // ── Parse body ──
        let body: Record<string, unknown>;
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const topic = (body.topic as string)?.trim();
        if (!topic) {
          return new Response(
            JSON.stringify({ error: "Missing required field: topic" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        const category = (body.category as string) || undefined;
        const tone = (body.tone as string) || "professional";
        const targetWords = Math.min(
          Math.max(Number(body.targetWords) || 1500, 500),
          4000,
        );

        // ── Configure AI provider ──
        const apiKey = process.env.AI_API_KEY;
        if (!apiKey) {
          return new Response(
            JSON.stringify({
              error: "AI_API_KEY environment variable is not configured",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        const baseUrl =
          (process.env.AI_BASE_URL as string) ||
          "https://openrouter.ai/api/v1";
        const modelId =
          (process.env.AI_MODEL as string) || "google/gemini-2.5-flash";

        const provider = createOpenAICompatible({
          name: "blog-ai",
          baseURL: baseUrl,
          apiKey,
        });

        // ── Build prompt ──
        const categoryContext = category
          ? `\nCategory: ${category}\nWrite as an article for the "${category}" section of an AI tools directory website.`
          : "";

        const systemPrompt = `You are an expert SEO content writer for TavBook, the world's largest AI tools directory (116,000+ tools). Write authoritative, engaging blog content about AI tools, trends, and comparisons.

Tone: ${tone}
Target length: ~${targetWords} words of main content (excluding FAQ).

Your output MUST be a single valid JSON object with EXACTLY these keys:
{
  "title": "Compelling SEO title (50-70 chars, include year 2026)",
  "excerpt": "2-3 sentence summary for article cards (120-160 chars)",
  "content_md": "Full article in Markdown format with ## H2 and ### H3 headings, bullet lists, bold emphasis. Include real AI tool names where relevant. Make it comprehensive and actionable.",
  "faq": [
    {"question": "FAQ question 1?", "answer": "Detailed answer (2-3 sentences)"},
    {"question": "FAQ question 2?", "answer": "Detailed answer (2-3 sentences)"},
    {"question": "FAQ question 3?", "answer": "Detailed answer (2-3 sentences)"},
    {"question": "FAQ question 4?", "answer": "Detailed answer (2-3 sentences)"}
  ],
  "meta_title": "SEO meta title (50-60 chars)",
  "meta_description": "SEO meta description (140-160 chars)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4"]
}

CRITICAL RULES:
- Output ONLY the JSON object, no markdown fences, no commentary
- content_md must use ## for main sections, ### for subsections
- Include at least 4-5 ## sections in content_md
- FAQ answers must be substantive (2-3 sentences each)
- All content must be original and accurate
- Reference real AI tools and trends where appropriate${categoryContext}`;

        try {
          const { text } = await generateText({
            model: provider(modelId),
            system: systemPrompt,
            prompt: `Write a comprehensive blog article about: ${topic}`,
            maxOutputTokens: 8000,
            temperature: 0.7,
          });

          // ── Parse AI response ──
          let parsed: Record<string, unknown>;
          try {
            // Strip markdown code fences if present
            let cleaned = text.trim();
            if (cleaned.startsWith("```")) {
              cleaned = cleaned
                .replace(/^```(?:json)?\s*\n?/, "")
                .replace(/\n?```\s*$/, "");
            }
            parsed = JSON.parse(cleaned);
          } catch {
            console.error("[blog-ai-generate] Failed to parse AI response:", text.slice(0, 500));
            return new Response(
              JSON.stringify({ error: "AI returned invalid JSON. Please try again." }),
              { status: 502, headers: { "Content-Type": "application/json" } },
            );
          }

          // ── Validate required fields ──
          const title = (parsed.title as string) || topic;
          const slug = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 120);

          const result = {
            title,
            slug,
            excerpt: (parsed.excerpt as string) || "",
            content_md: (parsed.content_md as string) || "",
            faq: Array.isArray(parsed.faq) ? parsed.faq : [],
            meta_title: (parsed.meta_title as string) || title.slice(0, 60),
            meta_description:
              (parsed.meta_description as string) || (parsed.excerpt as string) || "",
            tags: Array.isArray(parsed.tags) ? parsed.tags : [],
            keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
            ai_generated: true,
            ai_model: modelId,
            status: "draft" as const,
            reading_minutes: Math.max(
              1,
              Math.round(
                ((parsed.content_md as string) || "").split(/\s+/).length / 200,
              ),
            ),
            word_count: ((parsed.content_md as string) || "").split(/\s+/).length,
          };

          return new Response(JSON.stringify({ post: result }), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
            },
          });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "AI generation failed";
          console.error("[blog-ai-generate] Error:", err);
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
            },
          });
        }
      },
    },
  },
});