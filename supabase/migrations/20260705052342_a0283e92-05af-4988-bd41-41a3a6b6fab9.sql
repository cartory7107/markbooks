
CREATE TYPE public.blog_post_status AS ENUM (
  'draft', 'pending_review', 'scheduled', 'published', 'archived', 'rejected'
);

CREATE TABLE public.blog_authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  bio text,
  avatar_url text,
  role_title text,
  twitter_url text,
  linkedin_url text,
  website_url text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_authors TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blog_authors TO authenticated;
GRANT ALL ON public.blog_authors TO service_role;
ALTER TABLE public.blog_authors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view authors" ON public.blog_authors FOR SELECT USING (true);
CREATE POLICY "Admins manage authors" ON public.blog_authors FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  intro text,
  meta_title text,
  meta_description text,
  emoji text,
  faq jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blog_categories TO authenticated;
GRANT ALL ON public.blog_categories TO service_role;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view categories" ON public.blog_categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.blog_categories FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  content_md text NOT NULL DEFAULT '',
  content_html text,
  toc jsonb NOT NULL DEFAULT '[]'::jsonb,
  faq jsonb NOT NULL DEFAULT '[]'::jsonb,
  featured_image_url text,
  featured_image_alt text,
  category_id uuid REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  author_id uuid REFERENCES public.blog_authors(id) ON DELETE SET NULL,
  tags text[] NOT NULL DEFAULT '{}'::text[],
  meta_title text,
  meta_description text,
  canonical_url text,
  keywords text[] NOT NULL DEFAULT '{}'::text[],
  og_title text,
  og_description text,
  og_image_url text,
  twitter_card text NOT NULL DEFAULT 'summary_large_image',
  related_tool_slugs text[] NOT NULL DEFAULT '{}'::text[],
  related_post_slugs text[] NOT NULL DEFAULT '{}'::text[],
  status public.blog_post_status NOT NULL DEFAULT 'draft',
  is_featured boolean NOT NULL DEFAULT false,
  is_trending boolean NOT NULL DEFAULT false,
  reading_minutes integer NOT NULL DEFAULT 5,
  word_count integer NOT NULL DEFAULT 0,
  view_count integer NOT NULL DEFAULT 0,
  ai_generated boolean NOT NULL DEFAULT false,
  ai_model text,
  published_at timestamptz,
  scheduled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rejection_reason text
);
CREATE INDEX blog_posts_status_idx ON public.blog_posts(status);
CREATE INDEX blog_posts_published_at_idx ON public.blog_posts(published_at DESC);
CREATE INDEX blog_posts_category_idx ON public.blog_posts(category_id);
CREATE INDEX blog_posts_featured_idx ON public.blog_posts(is_featured) WHERE is_featured;
CREATE INDEX blog_posts_trending_idx ON public.blog_posts(is_trending) WHERE is_trending;

GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published posts" ON public.blog_posts FOR SELECT
  USING (status = 'published' AND published_at IS NOT NULL AND published_at <= now());
CREATE POLICY "Admins can view all posts" ON public.blog_posts FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins manage posts" ON public.blog_posts FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE public.blog_post_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  snapshot jsonb NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX blog_post_revisions_post_idx ON public.blog_post_revisions(post_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.blog_post_revisions TO authenticated;
GRANT ALL ON public.blog_post_revisions TO service_role;
ALTER TABLE public.blog_post_revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage revisions" ON public.blog_post_revisions FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER blog_authors_updated_at BEFORE UPDATE ON public.blog_authors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER blog_categories_updated_at BEFORE UPDATE ON public.blog_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER blog_posts_updated_at BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.blog_authors (slug, name, bio, role_title, avatar_url, website_url)
VALUES (
  'markbook-editorial',
  'MarkBook Editorial Team',
  'The MarkBook editorial team researches, tests, and reviews AI tools across our 116,000+ verified directory. We publish deep guides, honest comparisons, and practical tutorials to help you find and use AI effectively.',
  'Editorial Team',
  'https://markbook.top/favicon.png',
  'https://markbook.top'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.blog_categories (slug, name, description, emoji, sort_order) VALUES
  ('ai-news', 'AI News', 'Latest AI industry news, launches, and research breakthroughs.', '📰', 1),
  ('best-ai-tools', 'Best AI Tools', 'Curated lists of the best AI tools for every use case.', '⭐', 2),
  ('tutorials', 'AI Tutorials', 'Step-by-step guides to learn and use AI tools effectively.', '📚', 3),
  ('comparisons', 'AI Comparisons', 'Side-by-side comparisons of the top AI tools and platforms.', '⚖️', 4),
  ('reviews', 'AI Reviews', 'In-depth hands-on reviews of individual AI tools.', '🔍', 5),
  ('prompt-engineering', 'Prompt Engineering', 'Master prompt engineering with proven techniques and templates.', '🧠', 6),
  ('ai-for-students', 'AI for Students', 'AI tools and workflows that help students study, write, and research.', '🎓', 7),
  ('ai-for-business', 'AI for Business', 'How businesses use AI to grow, automate, and gain competitive edge.', '💼', 8),
  ('ai-productivity', 'AI Productivity', 'AI tools that save time and boost daily productivity.', '⚡', 9),
  ('ai-marketing', 'AI Marketing', 'AI for marketing, SEO, content, ads, and growth.', '📈', 10),
  ('ai-coding', 'AI Coding', 'AI coding assistants and developer workflows.', '💻', 11),
  ('ai-writing', 'AI Writing', 'AI writing tools for content, copy, and long-form.', '✍️', 12),
  ('ai-image', 'AI Image Generation', 'AI image generators, editors, and creative tools.', '🎨', 13),
  ('ai-video', 'AI Video Generation', 'AI video generators, editors, and animation tools.', '🎬', 14),
  ('ai-chatbots', 'AI Chatbots', 'ChatGPT, Gemini, Claude, and every other chatbot.', '💬', 15),
  ('free-ai-tools', 'Free AI Tools', 'The best free AI tools that actually work.', '🆓', 16),
  ('ai-automation', 'AI Automation', 'Automate work with AI agents and workflows.', '🤖', 17),
  ('future-of-ai', 'Future of AI', 'Trends, predictions, and long-view essays on where AI is heading.', '🚀', 18)
ON CONFLICT (slug) DO NOTHING;
