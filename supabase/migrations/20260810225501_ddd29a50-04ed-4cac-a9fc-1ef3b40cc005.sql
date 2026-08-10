UPDATE public.blog_authors SET
  avatar_url = replace(coalesce(avatar_url,''),'markbook.top','tavbook.top'),
  slug = replace(slug,'markbook','tavbook')
WHERE coalesce(avatar_url,'') ILIKE '%markbook%' OR slug ILIKE '%markbook%';