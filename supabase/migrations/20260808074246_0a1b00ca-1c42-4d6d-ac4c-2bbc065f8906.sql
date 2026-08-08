
CREATE TABLE public.constitution_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_code text NOT NULL UNIQUE,
  name_mr text NOT NULL,
  name_en text,
  description_mr text,
  description_en text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.constitution_parts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.constitution_parts TO authenticated;
GRANT ALL ON public.constitution_parts TO service_role;
ALTER TABLE public.constitution_parts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parts public read" ON public.constitution_parts FOR SELECT USING (is_active = true);
CREATE POLICY "parts admin manage" ON public.constitution_parts FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.constitution_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_number text NOT NULL UNIQUE,
  sort_key numeric NOT NULL DEFAULT 0,
  part_id uuid REFERENCES public.constitution_parts(id) ON DELETE SET NULL,
  title_mr text NOT NULL,
  title_en text,
  official_text_mr text,
  official_text_en text,
  simple_explanation_mr text,
  simple_explanation_en text,
  real_life_example_mr text,
  real_life_example_en text,
  keywords text[] NOT NULL DEFAULT '{}',
  difficulty text NOT NULL DEFAULT 'basic',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_constitution_articles_part ON public.constitution_articles(part_id);
CREATE INDEX idx_constitution_articles_sort ON public.constitution_articles(sort_key);
GRANT SELECT ON public.constitution_articles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.constitution_articles TO authenticated;
GRANT ALL ON public.constitution_articles TO service_role;
ALTER TABLE public.constitution_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "articles public read" ON public.constitution_articles FOR SELECT USING (is_active = true);
CREATE POLICY "articles admin manage" ON public.constitution_articles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.constitution_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_mr text NOT NULL,
  name_en text,
  icon text,
  kind text NOT NULL DEFAULT 'topic',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.constitution_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.constitution_categories TO authenticated;
GRANT ALL ON public.constitution_categories TO service_role;
ALTER TABLE public.constitution_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cats public read" ON public.constitution_categories FOR SELECT USING (is_active = true);
CREATE POLICY "cats admin manage" ON public.constitution_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.constitution_article_categories (
  article_id uuid NOT NULL REFERENCES public.constitution_articles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.constitution_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, category_id)
);
CREATE INDEX idx_cac_category ON public.constitution_article_categories(category_id);
GRANT SELECT ON public.constitution_article_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.constitution_article_categories TO authenticated;
GRANT ALL ON public.constitution_article_categories TO service_role;
ALTER TABLE public.constitution_article_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cac public read" ON public.constitution_article_categories FOR SELECT USING (true);
CREATE POLICY "cac admin manage" ON public.constitution_article_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.constitution_related_articles (
  article_id uuid NOT NULL REFERENCES public.constitution_articles(id) ON DELETE CASCADE,
  related_article_id uuid NOT NULL REFERENCES public.constitution_articles(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, related_article_id)
);
CREATE INDEX idx_cra_related ON public.constitution_related_articles(related_article_id);
GRANT SELECT ON public.constitution_related_articles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.constitution_related_articles TO authenticated;
GRANT ALL ON public.constitution_related_articles TO service_role;
ALTER TABLE public.constitution_related_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cra public read" ON public.constitution_related_articles FOR SELECT USING (true);
CREATE POLICY "cra admin manage" ON public.constitution_related_articles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.constitution_learning_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title_mr text NOT NULL,
  title_en text,
  body_mr text NOT NULL,
  body_en text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.constitution_learning_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.constitution_learning_content TO authenticated;
GRANT ALL ON public.constitution_learning_content TO service_role;
ALTER TABLE public.constitution_learning_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "learn public read" ON public.constitution_learning_content FOR SELECT USING (is_active = true);
CREATE POLICY "learn admin manage" ON public.constitution_learning_content FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_cparts_updated BEFORE UPDATE ON public.constitution_parts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_carticles_updated BEFORE UPDATE ON public.constitution_articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_clearning_updated BEFORE UPDATE ON public.constitution_learning_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
