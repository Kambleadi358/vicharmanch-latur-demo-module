-- 1) topic tag for quiz questions (reuse existing quiz engine)
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS category_slug text;

-- 2) anonymous constitution learning analytics (no PII)
CREATE TABLE IF NOT EXISTS public.constitution_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('search','article_view','topic_lookup','situation_lookup','lesson_view')),
  query_text text,
  category_slug text,
  article_id uuid REFERENCES public.constitution_articles(id) ON DELETE SET NULL,
  matched_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.constitution_events TO anon, authenticated;
GRANT SELECT ON public.constitution_events TO authenticated;
GRANT ALL ON public.constitution_events TO service_role;

ALTER TABLE public.constitution_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log a constitution learning event"
ON public.constitution_events FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(coalesce(query_text, '')) <= 200
  AND char_length(coalesce(category_slug, '')) <= 60
  AND matched_count >= 0
);

CREATE POLICY "Admins can read constitution learning events"
ON public.constitution_events FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_constitution_events_type_created
  ON public.constitution_events (event_type, created_at DESC);

-- 3) retrieval indexes
CREATE INDEX IF NOT EXISTS idx_carticles_sort_key ON public.constitution_articles (sort_key);
CREATE INDEX IF NOT EXISTS idx_carticles_part ON public.constitution_articles (part_id);
CREATE INDEX IF NOT EXISTS idx_carticles_number ON public.constitution_articles (article_number);
CREATE INDEX IF NOT EXISTS idx_carticles_keywords ON public.constitution_articles USING gin (keywords);
CREATE INDEX IF NOT EXISTS idx_cartcat_category ON public.constitution_article_categories (category_id);
CREATE INDEX IF NOT EXISTS idx_cartcat_article ON public.constitution_article_categories (article_id);
CREATE INDEX IF NOT EXISTS idx_crelated_article ON public.constitution_related_articles (article_id);
CREATE INDEX IF NOT EXISTS idx_crelated_related ON public.constitution_related_articles (related_article_id);