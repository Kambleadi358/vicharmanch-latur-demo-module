import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, Scale, GraduationCap } from "lucide-react";
import preambleImg from "@/assets/preamble.jpg";
import DailyConstitution from "@/components/constitution/DailyConstitution";
import ConstitutionSearch from "@/components/constitution/ConstitutionSearch";
import ConstitutionExplorer from "@/components/constitution/ConstitutionExplorer";
import RightsFinder from "@/components/constitution/RightsFinder";
import LiteracyProgressPanel from "@/components/constitution/LiteracyProgressPanel";
import {
  fetchCategories,
  fetchArticlesByCategory,
  type CCategory,
  type CArticle,
} from "@/lib/constitution";
import { readProgress, toggleLessonCompleted } from "@/lib/constitutionProgress";

interface Lesson { id: string; slug: string; title_mr: string; body_mr: string; display_order: number }

const timeline = [
  { year: "१९४६", text: "संविधान सभेची स्थापना" },
  { year: "१९४७", text: "मसुदा समितीचे अध्यक्ष म्हणून डॉ. बाबासाहेब आंबेडकर यांची निवड" },
  { year: "२६ नोव्हेंबर १९४९", text: "संविधान स्वीकृत" },
  { year: "२६ जानेवारी १९५०", text: "संविधान अंमलात — भारत गणराज्य" },
];

const quickNav = [
  { q: "आज काय शिकू?", href: "#daily" },
  { q: "माझा हक्क कुठे आहे?", href: "#rights" },
  { q: "मला एखादे कलम शोधायचे आहे", href: "#search" },
  { q: "मला संविधान समजून घ्यायचे आहे", href: "#lessons" },
  { q: "मला माझे ज्ञान तपासायचे आहे", href: "#quiz" },
  { q: "माझी प्रगती काय आहे?", href: "#progress" },
];

const ConstitutionIdeology = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [rights, setRights] = useState<{ cat: CCategory; articles: CArticle[] }[]>([]);
  const [totals, setTotals] = useState({ articles: 0, lessons: 0, topics: 0 });
  const [done, setDone] = useState<string[]>(readProgress().lessonsCompleted);

  useEffect(() => {
    const h = () => setDone(readProgress().lessonsCompleted);
    window.addEventListener("vm-constitution-progress", h);
    return () => window.removeEventListener("vm-constitution-progress", h);
  }, []);

  useEffect(() => {
    (async () => {
      const [{ data: ls }, cats, { count }] = await Promise.all([
        supabase.from("constitution_learning_content").select("*").eq("is_active", true).order("display_order"),
        fetchCategories(),
        supabase.from("constitution_articles").select("id", { count: "exact", head: true }).eq("is_active", true),
      ]);
      const lessonList = (ls as Lesson[]) || [];
      setLessons(lessonList);
      setTotals({
        articles: count || 0,
        lessons: lessonList.length,
        topics: cats.filter((c) => c.kind === "topic").length,
      });
      const fr = cats.filter((c) => c.kind === "fundamental_right");
      const withArts = await Promise.all(
        fr.map(async (cat) => ({ cat, articles: await fetchArticlesByCategory(cat.id) }))
      );
      setRights(withArts);
    })();
  }, []);

  return (
    <Layout>
      <section className="hero-gradient py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-4">संविधान साक्षरता</h1>
            <p className="text-primary-foreground/75 max-w-2xl mx-auto">
              भारतीय संविधान सोप्या मराठी भाषेत — कलमे, अधिकार, कर्तव्ये आणि दैनंदिन जीवनातील उदाहरणे
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {quickNav.map((n) => (
                <a
                  key={n.href}
                  href={n.href}
                  className="text-xs md:text-sm px-3 py-2 rounded-full bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 transition-colors"
                >
                  {n.q}
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Daily */}
      <section id="daily" className="py-12 bg-secondary scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <DailyConstitution />
        </div>
      </section>

      {/* Search */}
      <section id="search" className="py-14 bg-background scroll-mt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">कलमे शोधा</h2>
            <div className="decorative-line mt-3" />
          </div>
          <ConstitutionSearch />
        </div>
      </section>

      {/* Explorer */}
      <section id="explorer" className="py-14 bg-secondary scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">संविधान अन्वेषक</h2>
            <div className="decorative-line mt-3" />
          </div>
          <ConstitutionExplorer />
        </div>
      </section>

      {/* Rights finder + situation mapping */}
      <section id="rights" className="py-14 bg-background scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <RightsFinder />
        </div>
      </section>

      {/* Preamble */}
      <section className="py-14 bg-secondary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">संविधानाची उद्देशिका</h2>
          <div className="decorative-line mb-8" />
          <img
            src={preambleImg}
            alt="भारतीय संविधानाची उद्देशिका (प्रस्तावना)"
            loading="lazy"
            className="w-full max-w-3xl mx-auto rounded-xl border border-border shadow-lg"
          />
        </div>
      </section>

      {/* Fundamental rights */}
      <section className="py-14 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">मूलभूत अधिकार</h2>
            <div className="decorative-line mt-3" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rights.map((r, i) => (
              <motion.div
                key={r.cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-6 h-full">
                  <Scale className="text-accent mb-3" size={24} />
                  <h3 className="font-semibold text-foreground mb-3">{r.cat.name_mr}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {r.articles.length ? (
                      r.articles.map((a) => (
                        <Button key={a.id} asChild size="sm" variant="outline" className="h-7 text-xs px-2">
                          <Link to={`/ideology/constitution/kalam/${encodeURIComponent(a.article_number)}`}>
                            {a.article_number}
                          </Link>
                        </Button>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Lessons */}
      <section id="lessons" className="py-14 bg-secondary scroll-mt-20">
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
                <AccordionContent className="text-muted-foreground leading-relaxed space-y-4">
                  <p>{l.body_mr}</p>
                  <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <Checkbox
                      checked={done.includes(l.id)}
                      onCheckedChange={() => toggleLessonCompleted(l.id)}
                    />
                    हा धडा वाचून पूर्ण झाला
                  </label>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Progress */}
      <section id="progress" className="py-14 bg-background scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <LiteracyProgressPanel totals={totals} />
        </div>
      </section>

      {/* Timeline */}
      <section className="py-14 bg-secondary">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
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
      <section id="quiz" className="py-14 bg-background text-center scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4">
          <GraduationCap className="mx-auto text-accent mb-4" size={32} />
          <h2 className="text-2xl font-bold text-foreground mb-3">तुमचे संविधान ज्ञान तपासा</h2>
          <p className="text-muted-foreground mb-6">
            विचारमंचच्या प्रश्नमंजुषेत सहभागी व्हा — निकालात विषयनिहाय कामगिरी व शिफारशी मिळतील.
          </p>
          <Button asChild size="lg">
            <Link to="/quiz">प्रश्नमंजुषा</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default ConstitutionIdeology;
