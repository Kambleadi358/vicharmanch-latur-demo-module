import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, BookOpen, Scale } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Article {
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

interface DailyArticleProps {
  variant?: "compact" | "featured";
}

const DailyArticle = ({ variant = "compact" }: DailyArticleProps) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      const { data, error } = await supabase
        .from("constitution_articles")
        .select(
          "id, article_number, title_mr, title_en, official_text_en, official_text_mr, simple_explanation_mr, real_life_example_mr, keywords, part_id, sort_key"
        )
        .eq("is_active", true)
        .order("sort_key", { ascending: true });

      if (!error && data) {
        setArticles(data as Article[]);
      }
      setLoading(false);
    };

    fetchArticles();
  }, []);

  const dailyArticle = useMemo(() => {
    const pool = articles.filter((a) => (a.simple_explanation_mr || "").trim().length > 0);
    if (!pool.length) return null;
    const day = Math.floor(Date.now() / 86400000);
    return pool[day % pool.length];
  }, [articles]);

  if (loading) {
    return (
      <section className="py-10 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse h-40 bg-muted rounded-xl" />
        </div>
      </section>
    );
  }

  if (!dailyArticle) return null;

  return (
    <section className="py-10 md:py-14 bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {variant === "compact" ? (
            <Card className="overflow-hidden border-2 border-accent/30 bg-card">
              <div className="flex flex-col md:flex-row">
                <div className="bg-accent/10 px-6 py-4 md:w-64 flex flex-col justify-center items-start md:items-center gap-2">
                  <div className="flex items-center gap-2 text-accent">
                    <Sparkles size={18} className="animate-pulse" />
                    <span className="text-sm font-semibold uppercase tracking-wider">आजचे कलम</span>
                  </div>
                  <span className="text-3xl md:text-4xl font-bold text-foreground">
                    {dailyArticle.article_number}
                  </span>
                  <span className="text-xs text-muted-foreground">भारतीय संविधान</span>
                </div>
                <div className="flex-1 p-6 md:p-8">
                  <div className="flex items-start gap-3 mb-3">
                    <Scale className="text-accent mt-1 shrink-0" size={20} />
                    <h3 className="text-lg md:text-xl font-bold text-foreground">
                      {dailyArticle.title_mr}
                    </h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-5 md:pl-8">
                    {dailyArticle.simple_explanation_mr}
                  </p>
                  {dailyArticle.real_life_example_mr && (
                    <p className="text-sm text-muted-foreground bg-background rounded-lg p-4 border border-border mb-5 md:ml-8">
                      <span className="font-medium text-foreground">उदाहरण:</span>{" "}
                      {dailyArticle.real_life_example_mr}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 md:pl-8">
                    <Button asChild variant="default" size="sm">
                      <Link to="/ideology/constitution">
                        <BookOpen size={16} className="mr-2" />
                        संविधान साक्षरता पहा
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/ideology/constitution#article-${dailyArticle.id}`}>
                        अधिक वाचा
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6 md:p-10 border-2 border-accent/40 bg-card text-center">
              <div className="flex items-center justify-center gap-2 text-accent text-sm font-semibold uppercase tracking-wider mb-3">
                <Sparkles size={16} className="animate-pulse" /> आजचे कलम
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                कलम {dailyArticle.article_number} — {dailyArticle.title_mr}
              </h3>
              <p className="text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-4">
                {dailyArticle.simple_explanation_mr}
              </p>
              {dailyArticle.real_life_example_mr && (
                <p className="text-sm text-muted-foreground bg-background rounded-lg p-4 border border-border max-w-3xl mx-auto mb-6">
                  {dailyArticle.real_life_example_mr}
                </p>
              )}
              <Button asChild variant="default">
                <Link to="/ideology/constitution">संविधान साक्षरता पहा</Link>
              </Button>
            </Card>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default DailyArticle;
