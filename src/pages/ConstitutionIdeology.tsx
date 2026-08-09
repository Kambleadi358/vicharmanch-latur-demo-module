import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, BookOpen, Scale, Sparkles, GraduationCap } from "lucide-react";
import preambleImg from "@/assets/preamble.jpg";

interface Part { id: string; part_code: string; name_mr: string; display_order: number }
interface Category { id: string; slug: string; name_mr: string; kind: string; display_order: number }
interface Article {
  id: string;
  article_number: string;
  title_mr: string;
  title_en: string | null;
  official_text_en: string | null;
  simple_explanation_mr: string | null;
  real_life_example_mr: string | null;
  keywords: string[] | null;
  part_id: string | null;
  sort_key: number;
}
interface Lesson { id: string; slug: string; title_mr: string; body_mr: string; display_order: number }

const timeline = [
  { year: "१९४६", text: "संविधान सभेची स्थापना" },
  { year: "१९४७", text: "मसुदा समितीचे अध्यक्ष म्हणून डॉ. बाबासाहेब आंबेडकर यांची निवड" },
  { year: "२६ नोव्हेंबर १९४९", text: "संविधान स्वीकृत" },
  { year: "२६ जानेवारी १९५०", text: "संविधान अंमलात — भारत गणराज्य" },
];

const ConstitutionIdeology = () => {
  const [parts, setParts] = useState<Part[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [links, setLinks] = useState<{ article_id: string; category_id: string }[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [query, setQuery] = useState("");
  const [activePart, setActivePart] = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [p, c, a, l, ls] = await Promise.all([
        supabase.from("constitution_parts").select("*").order("display_order"),
        supabase.from("constitution_categories").select("*").order("display_order"),
        supabase.from("constitution_articles").select("*").order("sort_key"),
        supabase.from("constitution_article_categories").select("article_id, category_id"),
        supabase.from("constitution_learning_content").select("*").order("display_order"),
      ]);
      setParts((p.data as Part[]) || []);
      setCategories((c.data as Category[]) || []);
      setArticles((a.data as Article[]) || []);
      setLinks((l.data as { article_id: string; category_id: string }[]) || []);
      setLessons((ls.data as Lesson[]) || []);
      setLoading(false);
    })();
  }, []);

  const dailyArticle = useMemo(() => {
    if (!articles.length) return null;
    const day = Math.floor(Date.now() / 86400000);
    return articles[day % articles.length];
  }, [articles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const catNamesByArticle = new Map<string, string>();
    if (q) {
      for (const l of links) {
        const cat = categories.find((c) => c.id === l.category_id);
        if (!cat) continue;
        catNamesByArticle.set(
          l.article_id,
          `${catNamesByArticle.get(l.article_id) || ""} ${cat.name_mr} ${cat.slug}`.toLowerCase()
        );
      }
    }
    return articles.filter((a) => {
      if (activePart && a.part_id !== activePart) return false;
      if (activeCat && !links.some((l) => l.article_id === a.id && l.category_id === activeCat)) return false;
      if (!q) return true;
      return (
        a.article_number.toLowerCase().includes(q) ||
        a.title_mr.toLowerCase().includes(q) ||
        (a.title_en || "").toLowerCase().includes(q) ||
        (a.simple_explanation_mr || "").toLowerCase().includes(q) ||
        (a.official_text_en || "").toLowerCase().includes(q) ||
        (a.keywords || []).some((k) => k.toLowerCase().includes(q)) ||
        (catNamesByArticle.get(a.id) || "").includes(q)
      );
    });
  }, [articles, links, categories, query, activePart, activeCat]);

  const visible = useMemo(() => filtered.slice(0, limit), [filtered, limit]);


  const topics = categories.filter((c) => c.kind === "topic");
  const rights = categories.filter((c) => c.kind === "fundamental_right");

  return (
    <Layout>
      <section className="hero-gradient py-20 md:py-28 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-4">संविधान साक्षरता</h1>
            <p className="text-primary-foreground/75 max-w-2xl mx-auto">
              भारतीय संविधान सोप्या मराठी भाषेत — कलमे, अधिकार, कर्तव्ये आणि दैनंदिन जीवनातील उदाहरणे
            </p>
            <Link to="/ideology" className="inline-block mt-6 text-accent underline underline-offset-4">
              ← विचारधारा
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Preamble */}
      <section className="py-14 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">संविधानाची उद्देशिका</h2>
          <div className="decorative-line mb-8" />
          <motion.img
            src={preambleImg}
            alt="भारतीय संविधानाची उद्देशिका (प्रस्तावना)"
            loading="lazy"
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="w-full max-w-3xl mx-auto rounded-xl border border-border shadow-lg"
          />
        </div>
      </section>

      {/* Daily article */}
      {dailyArticle && (
        <section className="py-12 bg-secondary">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="p-6 md:p-8 border-accent/40">
              <div className="flex items-center gap-2 text-accent text-sm font-medium mb-3">
                <Sparkles size={16} /> आजचे कलम
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-foreground">
                कलम {dailyArticle.article_number} — {dailyArticle.title_mr}
              </h3>
              <p className="text-muted-foreground mt-3 leading-relaxed">{dailyArticle.simple_explanation_mr}</p>
              {dailyArticle.real_life_example_mr && (
                <p className="mt-4 text-sm bg-background rounded-lg p-4 border border-border">
                  {dailyArticle.real_life_example_mr}
                </p>
              )}
            </Card>
          </div>
        </section>
      )}

      {/* Explorer */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">कलमे शोधा</h2>
            <div className="decorative-line mt-3" />
          </div>

          <div className="relative max-w-xl mx-auto mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="कलम क्रमांक, विषय किंवा शब्द शोधा (उदा. समानता, 21A)"
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <Button size="sm" variant={activePart ? "outline" : "default"} onClick={() => setActivePart(null)}>
              सर्व भाग
            </Button>
            {parts.map((p) => (
              <Button
                key={p.id}
                size="sm"
                variant={activePart === p.id ? "default" : "outline"}
                onClick={() => setActivePart(activePart === p.id ? null : p.id)}
              >
                भाग {p.part_code} · {p.name_mr}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {topics.map((c) => (
              <Badge
                key={c.id}
                variant={activeCat === c.id ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => setActiveCat(activeCat === c.id ? null : c.id)}
              >
                {c.name_mr}
              </Badge>
            ))}
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground">माहिती लोड होत आहे…</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground">कोणतेही कलम सापडले नाही.</p>
          ) : (
            <Accordion type="single" collapsible className="max-w-4xl mx-auto">
              {filtered.map((a) => (
                <AccordionItem key={a.id} value={a.id}>
                  <AccordionTrigger className="text-left">
                    <span className="font-semibold">कलम {a.article_number}</span>
                    <span className="text-muted-foreground ml-3 font-normal">{a.title_mr}</span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    {a.official_text_en && (
                      <p className="text-sm italic text-muted-foreground border-l-2 border-accent pl-3">
                        {a.official_text_en}
                      </p>
                    )}
                    <p className="text-foreground leading-relaxed">{a.simple_explanation_mr}</p>
                    {a.real_life_example_mr && (
                      <div className="bg-secondary rounded-lg p-4 text-sm">{a.real_life_example_mr}</div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </section>

      {/* Fundamental rights */}
      <section className="py-16 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">सहा मूलभूत अधिकार</h2>
            <div className="decorative-line mt-3" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rights.map((r, i) => {
              const list = articles.filter((a) => links.some((l) => l.article_id === a.id && l.category_id === r.id));
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="p-6 h-full">
                    <Scale className="text-accent mb-3" size={24} />
                    <h3 className="font-semibold text-foreground mb-2">{r.name_mr}</h3>
                    <p className="text-sm text-muted-foreground">
                      कलमे: {list.map((a) => a.article_number).join(", ") || "—"}
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Lessons */}
      <section className="py-16 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">शिकण्यासाठी</h2>
            <div className="decorative-line mt-3" />
          </div>
          <Accordion type="single" collapsible>
            {lessons.map((l) => (
              <AccordionItem key={l.id} value={l.id}>
                <AccordionTrigger className="text-left">
                  <span className="flex items-center gap-2">
                    <BookOpen size={16} className="text-accent" /> {l.title_mr}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">{l.body_mr}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-secondary">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">ऐतिहासिक प्रवास</h2>
            <div className="decorative-line mt-3" />
          </div>
          <div className="space-y-4">
            {timeline.map((t, i) => (
              <motion.div
                key={t.year}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex gap-4 items-start bg-card border border-border rounded-xl p-4"
              >
                <span className="text-accent font-semibold whitespace-nowrap">{t.year}</span>
                <span className="text-foreground">{t.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quiz CTA */}
      <section className="py-16 bg-background text-center">
        <div className="max-w-3xl mx-auto px-4">
          <GraduationCap className="mx-auto text-accent mb-4" size={32} />
          <h2 className="text-2xl font-bold text-foreground mb-3">तुमचे संविधान ज्ञान तपासा</h2>
          <p className="text-muted-foreground mb-6">प्रश्नमंजुषेत सहभागी व्हा आणि शिकलेले तपासून पहा.</p>
          <Button asChild size="lg">
            <Link to="/quiz">प्रश्नमंजुषा</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default ConstitutionIdeology;
