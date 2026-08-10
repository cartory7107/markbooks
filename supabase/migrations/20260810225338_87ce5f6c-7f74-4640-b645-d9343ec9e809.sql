UPDATE public.blog_posts SET
  title = replace(replace(replace(title,'MarkBook','TavBook'),'markbook','tavbook'),'Markbook','TavBook'),
  excerpt = replace(replace(replace(coalesce(excerpt,''),'MarkBook','TavBook'),'markbook','tavbook'),'Markbook','TavBook'),
  content_md = replace(replace(replace(content_md,'MarkBook','TavBook'),'markbook','tavbook'),'Markbook','TavBook'),
  content_html = replace(replace(replace(coalesce(content_html,''),'MarkBook','TavBook'),'markbook','tavbook'),'Markbook','TavBook'),
  meta_title = replace(replace(replace(coalesce(meta_title,''),'MarkBook','TavBook'),'markbook','tavbook'),'Markbook','TavBook'),
  meta_description = replace(replace(replace(coalesce(meta_description,''),'MarkBook','TavBook'),'markbook','tavbook'),'Markbook','TavBook'),
  og_title = replace(replace(replace(coalesce(og_title,''),'MarkBook','TavBook'),'markbook','tavbook'),'Markbook','TavBook'),
  og_description = replace(replace(replace(coalesce(og_description,''),'MarkBook','TavBook'),'markbook','tavbook'),'Markbook','TavBook'),
  og_image_url = replace(coalesce(og_image_url,''),'markbook.top','tavbook.top'),
  featured_image_url = replace(coalesce(featured_image_url,''),'markbook.top','tavbook.top'),
  featured_image_alt = replace(replace(coalesce(featured_image_alt,''),'MarkBook','TavBook'),'markbook','tavbook'),
  canonical_url = NULL,
  slug = replace(slug,'markbook','tavbook'),
  toc = replace(toc::text,'markbook','tavbook')::jsonb,
  faq = replace(replace(faq::text,'MarkBook','TavBook'),'markbook','tavbook')::jsonb,
  keywords = coalesce((SELECT array_agg(replace(replace(k,'MarkBook','TavBook'),'markbook','tavbook')) FROM unnest(keywords) k), '{}'),
  tags = coalesce((SELECT array_agg(replace(replace(t,'MarkBook','TavBook'),'markbook','tavbook')) FROM unnest(tags) t), '{}'),
  related_post_slugs = coalesce((SELECT array_agg(replace(s,'markbook','tavbook')) FROM unnest(related_post_slugs) s), '{}')
WHERE (title || coalesce(excerpt,'') || content_md || coalesce(content_html,'') || coalesce(meta_title,'') || coalesce(meta_description,'') || coalesce(og_title,'') || coalesce(og_description,'') || coalesce(og_image_url,'') || coalesce(canonical_url,'') || slug || toc::text || faq::text) ILIKE '%markbook%'
   OR coalesce(canonical_url,'') <> '';

UPDATE public.blog_categories SET
  name = replace(replace(name,'MarkBook','TavBook'),'markbook','tavbook'),
  description = replace(replace(coalesce(description,''),'MarkBook','TavBook'),'markbook','tavbook'),
  intro = replace(replace(coalesce(intro,''),'MarkBook','TavBook'),'markbook','tavbook'),
  meta_title = replace(replace(coalesce(meta_title,''),'MarkBook','TavBook'),'markbook','tavbook'),
  meta_description = replace(replace(coalesce(meta_description,''),'MarkBook','TavBook'),'markbook','tavbook'),
  faq = replace(replace(faq::text,'MarkBook','TavBook'),'markbook','tavbook')::jsonb
WHERE (name || coalesce(description,'') || coalesce(intro,'') || coalesce(meta_title,'') || coalesce(meta_description,'') || faq::text) ILIKE '%markbook%';

UPDATE public.blog_authors SET
  name = replace(replace(name,'MarkBook','TavBook'),'markbook','tavbook'),
  bio = replace(replace(coalesce(bio,''),'MarkBook','TavBook'),'markbook','tavbook'),
  role_title = replace(replace(coalesce(role_title,''),'MarkBook','TavBook'),'markbook','tavbook'),
  website_url = replace(coalesce(website_url,''),'markbook.top','tavbook.top'),
  email = replace(coalesce(email,''),'markbook','tavbook')
WHERE (name || coalesce(bio,'') || coalesce(role_title,'') || coalesce(website_url,'') || coalesce(email,'')) ILIKE '%markbook%';