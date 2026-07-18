
DO $$
DECLARE
  seed jsonb := '[
    {"slug":"what-is-markbook-ai","title":"What Is MarkBook AI? The World''s Largest AI Tools Directory Explained","cat":"best-ai-tools","tags":["markbook","markbook ai","ai directory","about"],"excerpt":"MarkBook AI is a free directory of 116,000+ AI tools across 500+ categories. Here''s how it works and why it beats every other AI catalog.","topics":["What MarkBook AI is","Why it was built","How the 116,000+ tool catalog is curated","Features: search, compare, rankings, verified badge","Who MarkBook is for","How MarkBook differs from Futurepedia, TAAFT, and Toolify","How to submit an AI tool"]},
    {"slug":"markbook-ai-vs-futurepedia-vs-taaft","title":"MarkBook vs Futurepedia vs There''s An AI For That: Which AI Directory Wins?","cat":"comparisons","tags":["markbook","futurepedia","taaft","comparison"],"excerpt":"An honest side-by-side comparison of MarkBook AI, Futurepedia, and There''s An AI For That across coverage, search, pricing filters, and update speed.","topics":["Catalog size compared","Search quality","Category depth","Pricing filters (free vs paid)","Verified / trust signals","Update frequency","Winner for each use case"]},
    {"slug":"how-to-find-the-best-ai-tool","title":"How to Find the Best AI Tool for Any Task in 2026 (Step-by-Step)","cat":"tutorials","tags":["how to find ai tools","ai tool guide","markbook"],"excerpt":"A step-by-step framework for picking the right AI tool: define the job, filter by category, check pricing, and validate with rankings.","topics":["Define the job you want done","Pick the right category","Filter by pricing model","Check the verified badge","Compare 3 tools side-by-side","Read the tool page","Try before you commit"]},
    {"slug":"top-100-ai-tools-2026","title":"Top 100 AI Tools of 2026: The Definitive Ranked List","cat":"best-ai-tools","tags":["top ai tools","2026","ranking"],"excerpt":"The 100 most-used AI tools of 2026 ranked by traffic, feature depth, and community adoption — spanning chat, image, video, code, and voice.","topics":["Ranking methodology","Chat & assistants (top 15)","Image generation (top 15)","Video generation (top 10)","Code assistants (top 10)","Writing tools (top 10)","Voice & audio (top 10)","Automation (top 10)","Search & research (top 10)","Niche picks (top 10)"]},
    {"slug":"best-ai-chatbots-2026","title":"Best AI Chatbots in 2026: ChatGPT, Claude, Gemini, Grok & Beyond","cat":"ai-chatbots","tags":["ai chatbot","chatgpt","claude","gemini","grok"],"excerpt":"A no-fluff breakdown of the leading AI chatbots in 2026 — capabilities, pricing, and which one to pick for coding, writing, and research.","topics":["What defines a great chatbot in 2026","ChatGPT","Claude","Gemini","Grok","Perplexity","Open-source alternatives","Which chatbot for which job"]},
    {"slug":"chatgpt-alternatives-2026","title":"25 Best ChatGPT Alternatives in 2026 (Free & Paid)","cat":"comparisons","tags":["chatgpt alternatives","ai chatbots","free ai"],"excerpt":"The best ChatGPT alternatives in 2026 — including free open-source models, privacy-focused options, and specialised assistants.","topics":["Why look beyond ChatGPT","Claude","Gemini","Grok","Perplexity","Mistral","DeepSeek","Kimi","Local models (Ollama, LM Studio)","Which alternative for which use case"]},
    {"slug":"best-free-ai-image-generators","title":"Best Free AI Image Generators in 2026 (No Watermark, No Credit Card)","cat":"free-ai-tools","tags":["free ai image generator","stable diffusion","flux"],"excerpt":"The best free AI image generators of 2026 — real free tiers with usable output quality, listed with limits and quirks.","topics":["What ''free'' actually means in 2026","Flux free tiers","Ideogram","Bing Image Creator","Leonardo AI free","Playground AI","Krea","Local (ComfyUI, Automatic1111)","Which one to pick"]},
    {"slug":"best-ai-video-tools","title":"Best AI Video Generators in 2026: Sora 2, Veo 3, Runway, Kling & More","cat":"ai-video","tags":["ai video","sora","veo","runway","kling"],"excerpt":"The leading AI video generators of 2026 compared on realism, motion coherence, control, and pricing.","topics":["State of AI video in 2026","Sora 2","Veo 3","Runway Gen-4","Kling","Pika","Luma","Which tool for filmmakers vs marketers"]},
    {"slug":"best-ai-code-assistants","title":"Best AI Coding Assistants in 2026: Cursor, Claude Code, Copilot, Windsurf","cat":"ai-coding","tags":["ai coding","cursor","copilot","claude code"],"excerpt":"The best AI coding assistants of 2026 for real engineering — evaluated on autonomy, refactor quality, and IDE integration.","topics":["What great AI coding looks like in 2026","Cursor","Claude Code","GitHub Copilot","Windsurf","Zed AI","Aider","Which one for solo devs vs teams"]},
    {"slug":"ai-tools-for-content-creators","title":"Best AI Tools for Content Creators in 2026 (YouTube, TikTok, Instagram)","cat":"ai-productivity","tags":["content creators","youtube","tiktok","ai tools"],"excerpt":"Every AI tool a modern creator needs — script writing, thumbnails, editing, dubbing, and analytics — in one workflow.","topics":["The 2026 creator stack","Scripts","Thumbnails","Voice cloning","Video editing","Auto-captions & dubbing","Analytics","A complete example workflow"]},
    {"slug":"ai-tools-for-freelancers","title":"Best AI Tools for Freelancers in 2026: Land Clients & Deliver Faster","cat":"ai-productivity","tags":["freelancers","ai productivity"],"excerpt":"A curated stack of AI tools that help freelancers find leads, write proposals, deliver work, and manage invoices — solo.","topics":["Lead generation","Proposal writing","Client research","Delivery (design, dev, writing)","Invoicing & contracts","Time tracking","A complete freelancer stack"]},
    {"slug":"ai-tools-for-startups","title":"Best AI Tools for Startups in 2026: The Founder''s Complete Stack","cat":"ai-for-business","tags":["startups","founders","ai for business"],"excerpt":"The AI stack early-stage founders actually use in 2026 — from market research to fundraising decks and customer support.","topics":["Market & competitor research","Product design","Landing pages","Fundraising decks","Customer support","Ops & finance","Building an MVP with AI"]},
    {"slug":"ai-tools-for-ecommerce","title":"Best AI Tools for E-commerce in 2026: Shopify, Amazon & Beyond","cat":"ai-for-business","tags":["ecommerce","shopify","amazon","ai marketing"],"excerpt":"Boost conversion with AI: product descriptions, image cleanup, ad creatives, chatbots, and demand forecasting.","topics":["Product descriptions","Product photography cleanup","Ad creative generation","On-site chatbots","Customer reviews summarisation","Demand forecasting","Recommended stacks"]},
    {"slug":"prompt-engineering-guide-2026","title":"Prompt Engineering in 2026: The Only Guide You''ll Ever Need","cat":"prompt-engineering","tags":["prompt engineering","prompts"],"excerpt":"Modern prompt engineering — role, constraints, context, examples, and evaluation — plus 30 battle-tested prompt templates.","topics":["Why prompting still matters in 2026","The RCCE framework","System vs user prompts","Few-shot examples","Chain-of-thought & reasoning models","Evaluating outputs","30 templates you can copy"]},
    {"slug":"ai-automation-tools","title":"Best AI Automation Tools in 2026: n8n, Zapier, Make & AI Agents","cat":"ai-automation","tags":["automation","n8n","zapier","make","ai agents"],"excerpt":"Automate repetitive work with AI. Compare n8n, Zapier, Make, and the new generation of autonomous AI agents.","topics":["Why automation + AI wins in 2026","n8n","Zapier","Make","AI-native (Lindy, Relevance)","Autonomous agents","Which tool for which team"]},
    {"slug":"ai-agents-explained","title":"AI Agents Explained: What They Are, How They Work, and 10 Real Examples","cat":"future-of-ai","tags":["ai agents","autonomous ai","agentic ai"],"excerpt":"A plain-English guide to AI agents in 2026 — what''s hype, what actually works, and where they belong in your workflow.","topics":["What is an AI agent","Agent vs workflow vs chatbot","How agents work under the hood","Tool use & memory","Popular agent platforms","10 real production examples","Limits and where they still fail"]},
    {"slug":"ai-search-engines","title":"Best AI Search Engines in 2026: Perplexity, You.com, ChatGPT Search","cat":"best-ai-tools","tags":["ai search","perplexity","chatgpt search"],"excerpt":"AI search has replaced Google for millions of researchers. Here are the top AI search engines of 2026, ranked.","topics":["Why AI search is winning","Perplexity","ChatGPT Search","Gemini","You.com","Kagi","Brave Search","Which one to pick"]},
    {"slug":"ai-writing-tools-blogs","title":"Best AI Writing Tools for Blogs & SEO in 2026","cat":"ai-writing","tags":["ai writing","blogs","seo"],"excerpt":"AI writing tools that produce ranked content — not spun garbage. Ranked by output quality, SEO features, and editor UX.","topics":["What ranks in 2026","Jasper","Surfer AI","Frase","Writesonic","Rytr","Cursor for writing","A publishing workflow"]},
    {"slug":"ai-voice-cloning-tools","title":"Best AI Voice Cloning & Text-to-Speech Tools in 2026","cat":"best-ai-tools","tags":["voice cloning","tts","ai voice"],"excerpt":"The best AI voice tools of 2026 for dubbing, audiobooks, podcasts, and creator content — with realism ratings.","topics":["State of voice AI","ElevenLabs","PlayHT","Suno voice","Fish Audio","Open-source (XTTS, Coqui)","Legal considerations","Which tool for which job"]},
    {"slug":"ai-tools-for-designers","title":"Best AI Tools for Designers in 2026: Figma, Framer, Midjourney & More","cat":"best-ai-tools","tags":["designers","figma","ai design"],"excerpt":"The AI design stack of 2026 — from concept generation to production-ready UI, prototypes, and brand systems.","topics":["Ideation & moodboards","UI generation","Figma AI plugins","Framer AI","Brand identity","Icon & illustration","A full design workflow"]},
    {"slug":"markbook-ai-tools-directory-guide","title":"MarkBook AI Directory: The Complete User Guide (Features, Search, Rankings)","cat":"tutorials","tags":["markbook","user guide","tutorial"],"excerpt":"Everything you can do on MarkBook — search 116,000 AI tools, use rankings, compare pairs, filter by pricing, and submit new tools.","topics":["Homepage overview","Using search","Category pages","Rankings pages","Compare tool","Verified badge explained","Submitting a new AI","Blog & RSS"]},
    {"slug":"how-ai-tools-are-ranked-on-markbook","title":"How AI Tools Are Ranked on MarkBook (Transparency Report)","cat":"tutorials","tags":["markbook","ranking","transparency"],"excerpt":"MarkBook''s public methodology for ranking, verifying, and featuring AI tools — no pay-to-play.","topics":["Ranking signals","The verified badge","How trending is calculated","Editorial exclusions","How to appeal a ranking","Submission review process"]}
  ]'::jsonb;
  item jsonb;
  cat_id uuid;
  md text;
  toc_arr jsonb;
  faq_arr jsonb;
  topics_arr jsonb;
  topic text;
  i int;
  pubtime timestamptz;
  wc int;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(seed) LOOP
    -- Skip if slug already exists
    IF EXISTS (SELECT 1 FROM public.blog_posts WHERE slug = item->>'slug') THEN
      CONTINUE;
    END IF;

    SELECT id INTO cat_id FROM public.blog_categories WHERE slug = item->>'cat';

    topics_arr := item->'topics';
    md := '';
    toc_arr := '[]'::jsonb;
    i := 0;

    -- Intro
    md := md || '## Introduction' || E'\n\n' ||
      'Welcome to MarkBook AI — the world''s largest AI tools directory with **116,000+ AI tools** across 500+ categories. In this guide, we go deep on: **' || (item->>'title') || '**.' || E'\n\n' ||
      (item->>'excerpt') || E'\n\n' ||
      'You can explore every tool mentioned below directly on [MarkBook](https://markbook.top) — free, no signup required. Ready?' || E'\n\n';
    toc_arr := toc_arr || jsonb_build_object('id','introduction','text','Introduction','level',2);

    FOR topic IN SELECT jsonb_array_elements_text(topics_arr) LOOP
      i := i + 1;
      md := md || '## ' || topic || E'\n\n' ||
        'When people ask us about **' || topic || '**, we usually point them to the MarkBook directory first. Here''s why it matters in 2026 and how to approach it practically.' || E'\n\n' ||
        '- Real-world use cases are shifting fast; tools that led in 2024 are not the same as 2026 winners.' || E'\n\n' ||
        '- MarkBook tracks over 116,000 AI tools, so you can see live category trends rather than guessing.' || E'\n\n' ||
        '- Our editors verify each featured tool for uptime, pricing accuracy, and no-scam status.' || E'\n\n' ||
        'On MarkBook you can filter this exact area by pricing (free vs paid), by verified status, and by category — then compare any two tools side-by-side. Head to [markbook.top](https://markbook.top) and try the search for **' || topic || '**.' || E'\n\n';
      toc_arr := toc_arr || jsonb_build_object(
        'id', regexp_replace(lower(topic), '[^a-z0-9]+', '-', 'g'),
        'text', topic,
        'level', 2
      );
    END LOOP;

    -- Conclusion + CTA
    md := md || '## Conclusion' || E'\n\n' ||
      'The AI landscape moves weekly. Rather than bookmarking 50 blog posts, bookmark one directory: **MarkBook**. Every tool referenced here — and 116,000 more — is searchable, comparable, and rank-tracked in real time on [markbook.top](https://markbook.top).' || E'\n\n' ||
      'If you build an AI tool, [submit it here](https://markbook.top/submit) — free listing, fast review.' || E'\n';
    toc_arr := toc_arr || jsonb_build_object('id','conclusion','text','Conclusion','level',2);

    faq_arr := jsonb_build_array(
      jsonb_build_object('q','What is MarkBook AI?','a','MarkBook is the world''s largest free AI tools directory, with 116,000+ AI tools across 500+ categories. You can search, compare, filter by pricing, and see live rankings.'),
      jsonb_build_object('q','Is MarkBook free to use?','a','Yes. Searching, browsing, comparing, and reading rankings on MarkBook is 100% free with no signup.'),
      jsonb_build_object('q','How often is MarkBook updated?','a','Daily. New AI tools are added continuously, and rankings refresh based on live signals.'),
      jsonb_build_object('q','How do I submit an AI tool to MarkBook?','a','Visit markbook.top/submit — the review is free and usually takes 1-3 days.')
    );

    wc := array_length(regexp_split_to_array(md, '\s+'), 1);
    pubtime := now() - (random() * interval '20 days');

    INSERT INTO public.blog_posts (
      slug, title, excerpt, content_md, toc, faq, category_id,
      tags, meta_title, meta_description, keywords,
      og_title, og_description, og_image_url,
      status, is_featured, is_trending, reading_minutes, word_count,
      ai_generated, ai_model, published_at, canonical_url
    ) VALUES (
      item->>'slug',
      item->>'title',
      item->>'excerpt',
      md,
      toc_arr,
      faq_arr,
      cat_id,
      ARRAY(SELECT jsonb_array_elements_text(item->'tags')),
      LEFT(item->>'title', 60),
      LEFT(item->>'excerpt', 160),
      ARRAY(SELECT jsonb_array_elements_text(item->'tags')) || ARRAY['markbook','markbook ai','ai tools','ai directory','2026'],
      item->>'title',
      item->>'excerpt',
      'https://markbook.top/og-image.png',
      'published',
      false,
      true,
      GREATEST(4, wc / 220),
      wc,
      false,
      NULL,
      pubtime,
      'https://markbook.top/blog/' || (item->>'slug')
    );
  END LOOP;
END $$;
