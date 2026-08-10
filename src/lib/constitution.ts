import { supabase } from "@/integrations/supabase/client";

/**
 * Constitution knowledge base access layer.
 * The Supabase constitution_* tables are the SINGLE SOURCE OF TRUTH.
 * Nothing in this file invents official constitutional text.
 */

export interface CPart {
  id: string;
  part_code: string;
  name_mr: string;
  name_en: string | null;
  display_order: number;
}

export interface CCategory {
  id: string;
  slug: string;
  name_mr: string;
  name_en: string | null;
  kind: string;
  display_order: number;
}

export interface CArticle {
  id: string;
  article_number: string;
  title_mr: string;
  title_en: string | null;
  official_text_en: string | null;
  official_text_mr: string | null;
  simple_explanation_mr: string | null;
  real_life_example_mr: string | null;
  keywords: string[] | null;
  part_id: string | null;
  sort_key: number;
}

export interface MatchReason {
  kind: "article_number" | "title" | "keyword" | "category" | "explanation" | "official_text" | "part";
  label: string;
  value: string;
}

export interface ArticleMatch {
  article: CArticle;
  reasons: MatchReason[];
  categories: CCategory[];
}

export const ARTICLE_FIELDS =
  "id, article_number, title_mr, title_en, official_text_en, official_text_mr, simple_explanation_mr, real_life_example_mr, keywords, part_id, sort_key";

const esc = (s: string) => s.replace(/[,()%]/g, " ").trim();

/* ------------------------------------------------------------------ */
/* Basic lookups                                                       */
/* ------------------------------------------------------------------ */

export async function fetchParts(): Promise<CPart[]> {
  const { data } = await supabase
    .from("constitution_parts")
    .select("id, part_code, name_mr, name_en, display_order")
    .eq("is_active", true)
    .order("display_order");
  return (data as CPart[]) || [];
}

export async function fetchCategories(): Promise<CCategory[]> {
  const { data } = await supabase
    .from("constitution_categories")
    .select("id, slug, name_mr, name_en, kind, display_order")
    .eq("is_active", true)
    .order("display_order");
  return (data as CCategory[]) || [];
}

export async function fetchArticlesByPart(partId: string, from = 0, to = 29): Promise<CArticle[]> {
  const { data } = await supabase
    .from("constitution_articles")
    .select(ARTICLE_FIELDS)
    .eq("is_active", true)
    .eq("part_id", partId)
    .order("sort_key")
    .range(from, to);
  return (data as CArticle[]) || [];
}

export async function fetchArticleIdsForCategory(categoryId: string): Promise<string[]> {
  const { data } = await supabase
    .from("constitution_article_categories")
    .select("article_id")
    .eq("category_id", categoryId);
  return (data || []).map((r: { article_id: string }) => r.article_id);
}

export async function fetchArticlesByIds(ids: string[]): Promise<CArticle[]> {
  if (!ids.length) return [];
  const { data } = await supabase
    .from("constitution_articles")
    .select(ARTICLE_FIELDS)
    .in("id", ids.slice(0, 200))
    .order("sort_key");
  return (data as CArticle[]) || [];
}

export async function fetchArticlesByCategory(categoryId: string): Promise<CArticle[]> {
  return fetchArticlesByIds(await fetchArticleIdsForCategory(categoryId));
}

export async function fetchArticleByNumber(articleNumber: string): Promise<CArticle | null> {
  const { data } = await supabase
    .from("constitution_articles")
    .select(ARTICLE_FIELDS)
    .eq("article_number", articleNumber)
    .maybeSingle();
  return (data as CArticle) || null;
}

export async function fetchCategoriesForArticles(
  articleIds: string[]
): Promise<Map<string, CCategory[]>> {
  const map = new Map<string, CCategory[]>();
  if (!articleIds.length) return map;
  const [{ data: links }, cats] = await Promise.all([
    supabase
      .from("constitution_article_categories")
      .select("article_id, category_id")
      .in("article_id", articleIds.slice(0, 200)),
    fetchCategories(),
  ]);
  const byId = new Map(cats.map((c) => [c.id, c]));
  for (const l of (links || []) as { article_id: string; category_id: string }[]) {
    const cat = byId.get(l.category_id);
    if (!cat) continue;
    map.set(l.article_id, [...(map.get(l.article_id) || []), cat]);
  }
  return map;
}

/** Related articles, both directions, from constitution_related_articles. */
export async function fetchRelatedArticles(articleId: string): Promise<CArticle[]> {
  const [a, b] = await Promise.all([
    supabase.from("constitution_related_articles").select("related_article_id").eq("article_id", articleId),
    supabase.from("constitution_related_articles").select("article_id").eq("related_article_id", articleId),
  ]);
  const ids = new Set<string>();
  for (const r of (a.data || []) as { related_article_id: string }[]) ids.add(r.related_article_id);
  for (const r of (b.data || []) as { article_id: string }[]) ids.add(r.article_id);
  ids.delete(articleId);
  return fetchArticlesByIds([...ids]);
}

/** Sibling articles sharing at least one category (soft graph edge). */
export async function fetchCategorySiblings(articleId: string, limit = 8): Promise<CArticle[]> {
  const { data: myCats } = await supabase
    .from("constitution_article_categories")
    .select("category_id")
    .eq("article_id", articleId);
  const catIds = (myCats || []).map((c: { category_id: string }) => c.category_id);
  if (!catIds.length) return [];
  const { data: links } = await supabase
    .from("constitution_article_categories")
    .select("article_id")
    .in("category_id", catIds)
    .limit(120);
  const ids = [...new Set((links || []).map((l: { article_id: string }) => l.article_id))].filter(
    (id) => id !== articleId
  );
  const arts = await fetchArticlesByIds(ids);
  return arts.slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Search engine                                                       */
/* ------------------------------------------------------------------ */

function reasonsFor(a: CArticle, q: string, catNames: string[]): MatchReason[] {
  const lq = q.toLowerCase();
  const r: MatchReason[] = [];
  if (a.article_number.toLowerCase().includes(lq))
    r.push({ kind: "article_number", label: "कलम क्रमांक", value: a.article_number });
  if (a.title_mr?.toLowerCase().includes(lq)) r.push({ kind: "title", label: "मराठी शीर्षक", value: a.title_mr });
  if (a.title_en?.toLowerCase().includes(lq))
    r.push({ kind: "title", label: "इंग्रजी शीर्षक", value: a.title_en });
  for (const k of a.keywords || []) {
    if (k.toLowerCase().includes(lq)) {
      r.push({ kind: "keyword", label: "कीवर्ड", value: k });
      break;
    }
  }
  for (const c of catNames) {
    if (c.toLowerCase().includes(lq)) {
      r.push({ kind: "category", label: "वर्ग", value: c });
      break;
    }
  }
  if (a.simple_explanation_mr?.toLowerCase().includes(lq))
    r.push({ kind: "explanation", label: "सोप्या भाषेतील स्पष्टीकरण", value: "स्पष्टीकरणात हा शब्द आढळला" });
  if (a.official_text_en?.toLowerCase().includes(lq))
    r.push({ kind: "official_text", label: "अधिकृत मजकूर", value: "अधिकृत मजकुरात हा शब्द आढळला" });
  return r;
}

/**
 * Database-driven search. No hardcoded results.
 * Matches article number, Marathi/English title, keywords, official text,
 * simplified explanation and category names.
 */
export async function searchConstitution(rawQuery: string, limit = 40): Promise<ArticleMatch[]> {
  const q = esc(rawQuery);
  if (q.length < 1) return [];

  const like = `%${q}%`;
  const orExpr = [
    `article_number.ilike.${like}`,
    `title_mr.ilike.${like}`,
    `title_en.ilike.${like}`,
    `simple_explanation_mr.ilike.${like}`,
    `real_life_example_mr.ilike.${like}`,
    `official_text_en.ilike.${like}`,
  ].join(",");

  const [textRes, catRes] = await Promise.all([
    supabase
      .from("constitution_articles")
      .select(ARTICLE_FIELDS)
      .eq("is_active", true)
      .or(orExpr)
      .order("sort_key")
      .limit(limit),
    supabase
      .from("constitution_categories")
      .select("id, slug, name_mr, name_en, kind, display_order")
      .eq("is_active", true)
      .or(`name_mr.ilike.${like},slug.ilike.${like},name_en.ilike.${like}`),
  ]);

  const byId = new Map<string, CArticle>();
  for (const a of (textRes.data as CArticle[]) || []) byId.set(a.id, a);

  const matchedCats = (catRes.data as CCategory[]) || [];
  if (matchedCats.length) {
    const ids: string[] = [];
    for (const c of matchedCats) ids.push(...(await fetchArticleIdsForCategory(c.id)));
    for (const a of await fetchArticlesByIds([...new Set(ids)])) byId.set(a.id, a);
  }

  // keyword array matches (partial Marathi handled client-side over a keyword scan)
  const { data: kwRows } = await supabase
    .from("constitution_articles")
    .select(ARTICLE_FIELDS)
    .eq("is_active", true)
    .contains("keywords", [rawQuery.trim()]);
  for (const a of (kwRows as CArticle[]) || []) byId.set(a.id, a);

  const list = [...byId.values()].sort((x, y) => x.sort_key - y.sort_key).slice(0, limit);
  const catMap = await fetchCategoriesForArticles(list.map((a) => a.id));

  return list.map((a) => {
    const cats = catMap.get(a.id) || [];
    const reasons = reasonsFor(a, q, cats.map((c) => c.name_mr));
    if (!reasons.length && cats.length)
      reasons.push({ kind: "category", label: "वर्ग", value: cats[0].name_mr });
    return { article: a, reasons, categories: cats };
  });
}

/* ------------------------------------------------------------------ */
/* Daily constitution engine (deterministic by date)                   */
/* ------------------------------------------------------------------ */

export interface DailyTrio {
  yesterday: CArticle | null;
  today: CArticle | null;
  tomorrow: CArticle | null;
  poolSize: number;
  cycleDay: number;
}

export function dayIndex(d = new Date()): number {
  return Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 86400000);
}

/** Pool = articles that carry a verified Marathi explanation. */
export async function fetchDailyTrio(): Promise<DailyTrio> {
  const { data } = await supabase
    .from("constitution_articles")
    .select(ARTICLE_FIELDS)
    .eq("is_active", true)
    .not("simple_explanation_mr", "is", null)
    .order("sort_key");
  const pool = ((data as CArticle[]) || []).filter(
    (a) => (a.simple_explanation_mr || "").trim().length > 0
  );
  if (!pool.length)
    return { yesterday: null, today: null, tomorrow: null, poolSize: 0, cycleDay: 0 };
  const n = pool.length;
  const i = ((dayIndex() % n) + n) % n;
  return {
    yesterday: pool[(i - 1 + n) % n],
    today: pool[i],
    tomorrow: pool[(i + 1) % n],
    poolSize: n,
    cycleDay: i + 1,
  };
}

/* ------------------------------------------------------------------ */
/* Situation mapping (deterministic keyword -> category -> articles)   */
/* ------------------------------------------------------------------ */

export interface SituationResult {
  matchedCategories: CCategory[];
  matchedTerms: string[];
  results: ArticleMatch[];
}

const STOP = new Set([
  "मला","माझ्या","माझा","माझी","मी","आहे","आहेत","झाला","झाली","झाले","बद्दल","हवी","हवे","हवा",
  "काय","कुठे","कसे","आणि","व","चा","ची","चे","ला","ना","तर","हे","हा","ही","एक","माहिती","विषयी",
  "about","the","is","are","my","me","i","want","need","to","of","in","on","for","and","a","an",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOP.has(t));
}

/**
 * Maps a free-text everyday situation to constitutional provisions using only
 * stored relationships: category names/slugs and article keywords/titles.
 */
export async function mapSituation(text: string): Promise<SituationResult> {
  const tokens = tokenize(text);
  if (!tokens.length) return { matchedCategories: [], matchedTerms: [], results: [] };

  const cats = await fetchCategories();
  const matchedCategories = cats.filter((c) =>
    tokens.some(
      (t) =>
        c.name_mr.toLowerCase().includes(t) ||
        t.includes(c.name_mr.toLowerCase()) ||
        c.slug.toLowerCase().includes(t) ||
        (c.name_en || "").toLowerCase().includes(t)
    )
  );

  const scored = new Map<string, { a: CArticle; reasons: MatchReason[] }>();

  for (const c of matchedCategories) {
    const arts = await fetchArticlesByCategory(c.id);
    for (const a of arts) {
      const entry = scored.get(a.id) || { a, reasons: [] };
      entry.reasons.push({ kind: "category", label: "वर्ग", value: c.name_mr });
      scored.set(a.id, entry);
    }
  }

  // keyword / title matching over verified articles that have Marathi content
  const { data: kwData } = await supabase
    .from("constitution_articles")
    .select(ARTICLE_FIELDS)
    .eq("is_active", true)
    .not("simple_explanation_mr", "is", null)
    .order("sort_key");
  for (const a of ((kwData as CArticle[]) || []).filter(
    (x) => (x.simple_explanation_mr || "").trim().length > 0
  )) {
    for (const t of tokens) {
      const kw = (a.keywords || []).find((k) => k.toLowerCase().includes(t) || t.includes(k.toLowerCase()));
      const inTitle = a.title_mr.toLowerCase().includes(t);
      if (!kw && !inTitle) continue;
      const entry = scored.get(a.id) || { a, reasons: [] };
      if (kw && !entry.reasons.some((r) => r.kind === "keyword" && r.value === kw))
        entry.reasons.push({ kind: "keyword", label: "संबंधित कीवर्ड", value: kw });
      if (inTitle && !entry.reasons.some((r) => r.kind === "title"))
        entry.reasons.push({ kind: "title", label: "कलमाचे शीर्षक", value: a.title_mr });
      scored.set(a.id, entry);
      break;
    }
  }

  const list = [...scored.values()].sort(
    (x, y) => y.reasons.length - x.reasons.length || x.a.sort_key - y.a.sort_key
  );
  const catMap = await fetchCategoriesForArticles(list.map((e) => e.a.id));

  return {
    matchedCategories,
    matchedTerms: tokens,
    results: list.slice(0, 12).map((e) => ({
      article: e.a,
      reasons: e.reasons,
      categories: catMap.get(e.a.id) || [],
    })),
  };
}

/* ------------------------------------------------------------------ */
/* Anonymous learning analytics (no PII)                               */
/* ------------------------------------------------------------------ */

export type ConstitutionEventType =
  | "search"
  | "article_view"
  | "topic_lookup"
  | "situation_lookup"
  | "lesson_view";

export async function logConstitutionEvent(payload: {
  event_type: ConstitutionEventType;
  query_text?: string | null;
  category_slug?: string | null;
  article_id?: string | null;
  matched_count?: number;
}) {
  try {
    await supabase.from("constitution_events").insert({
      event_type: payload.event_type,
      query_text: (payload.query_text || "").slice(0, 200) || null,
      category_slug: payload.category_slug || null,
      article_id: payload.article_id || null,
      matched_count: payload.matched_count ?? 0,
    });
  } catch {
    /* analytics must never break the UI */
  }
}
