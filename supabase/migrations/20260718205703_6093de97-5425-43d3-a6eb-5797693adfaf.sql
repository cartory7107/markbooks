
-- Rebrand text in blog_posts. Preserve markbook.top URLs by swapping to a placeholder,
-- performing case-variant replacements, then restoring the domain.
UPDATE public.blog_posts SET
  title = regexp_replace(regexp_replace(regexp_replace(regexp_replace(replace(replace(title,'markbook.top','__D__'),'MarkBook','TavBook'),'Markbook','TavBook','g'),'MARKBOOK','TAVBOOK','g'),'markbook','tavbook','g'),'__D__','markbook.top','g'),
  excerpt = CASE WHEN excerpt IS NULL THEN NULL ELSE regexp_replace(regexp_replace(regexp_replace(regexp_replace(replace(replace(excerpt,'markbook.top','__D__'),'MarkBook','TavBook'),'Markbook','TavBook','g'),'MARKBOOK','TAVBOOK','g'),'markbook','tavbook','g'),'__D__','markbook.top','g') END,
  content_md = CASE WHEN content_md IS NULL THEN NULL ELSE regexp_replace(regexp_replace(regexp_replace(regexp_replace(replace(replace(content_md,'markbook.top','__D__'),'MarkBook','TavBook'),'Markbook','TavBook','g'),'MARKBOOK','TAVBOOK','g'),'markbook','tavbook','g'),'__D__','markbook.top','g') END,
  meta_title = CASE WHEN meta_title IS NULL THEN NULL ELSE regexp_replace(regexp_replace(regexp_replace(regexp_replace(replace(replace(meta_title,'markbook.top','__D__'),'MarkBook','TavBook'),'Markbook','TavBook','g'),'MARKBOOK','TAVBOOK','g'),'markbook','tavbook','g'),'__D__','markbook.top','g') END,
  meta_description = CASE WHEN meta_description IS NULL THEN NULL ELSE regexp_replace(regexp_replace(regexp_replace(regexp_replace(replace(replace(meta_description,'markbook.top','__D__'),'MarkBook','TavBook'),'Markbook','TavBook','g'),'MARKBOOK','TAVBOOK','g'),'markbook','tavbook','g'),'__D__','markbook.top','g') END
WHERE
  title ILIKE '%markbook%' OR excerpt ILIKE '%markbook%' OR content_md ILIKE '%markbook%'
  OR meta_title ILIKE '%markbook%' OR meta_description ILIKE '%markbook%';

-- Also update blog authors / categories if brand string present
UPDATE public.blog_categories
SET name = replace(replace(name,'MarkBook','TavBook'),'Markbook','TavBook'),
    description = CASE WHEN description IS NULL THEN NULL ELSE replace(replace(description,'MarkBook','TavBook'),'Markbook','TavBook') END
WHERE name ILIKE '%markbook%' OR description ILIKE '%markbook%';
