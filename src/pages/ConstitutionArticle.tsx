import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ScrollText, Brain, Home, ArrowLeft } from "lucide-react";
import {
  fetchArticleByNumber,
  fetchRelatedArticles,
  fetchCategoriesForArticles,
  fetchCategorySiblings,
  logConstitutionEvent,
  type CArticle,
  type CCategory,
} from "@/lib/constitution";
import { markArticleViewed } from "@/lib/constitutionProgress";

const ConstitutionArticle = () => {
  const { articleNumber } = useParams<{ articleNumber: string }>();
  const [article, setArticle] = useState<CArticle | null>(null);
  const [cats, setCats] = useState<CCategory[]>([]);
  const [related, setRelated] = useState<CArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!articleNumber) return;
    setLoading(true);
    (async () => {
      const a = await fetchArticleByNumber(decodeURIComponent(articleNumber));
      setArticle(a);
      if (a) {
        markArticleViewed(a.article_number);
        logConstitutionEvent({ event_type: "article_view", article_id: a.id });
        const [catMap, rel] = await Promise.all([
          fetchCategoriesForArticles([a.id]),
          fetchRelatedArticles(a.id),
        ]);
        setCats(catMap.get(a.id) || []);
        setRelated(rel.length ? rel : await fetchCategorySiblings(a.id));
      }
      setLoading(false);
      window.scrollTo({ top: 0 });
    })();
  }, [articleNumber]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="animate-spin text-accent h-8 w-8" />
        </div>
      </Layout>
    );
  }

  if (!article) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="text-muted-foreground">हे कलम आमच्या पडताळलेल्या माहितीसंचात सापडले नाही.</p>
          <Button asChild>
            <Link to="/ideology/constitution">संविधान साक्षरता</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="hero-gradient py-14 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/ideology/constitution"
            className="inline-flex items-center gap-1 text-accent text-sm mb-4"
          >
            <ArrowLeft size={14} /> संविधान साक्षरता
          </Link>
          <h1 className="text-2xl md:text-4xl font-bold text-primary-foreground">
            कलम {article.article_number}
          </h1>
          <p className="text-primary-foreground/80 mt-2">{article.title_mr}</p>
          {article.title_en && (
            <p className="text-primary-foreground/60 text-sm mt-1">{article.title_en}</p>
          )}
        </div>
      </section>

      <section className="py-10 md:py-14 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {cats.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {cats.map((c) => (
                <Badge key={c.id} variant="secondary">
                  {c.name_mr}
                </Badge>
              ))}
            </div>
          )}

          {/* Layer 1 — official text */}
          <Card className="p-5 md:p-6">
            <p className="flex items-center gap-2 font-semibold text-foreground mb-3">
              <ScrollText size={18} className="text-accent" /> 📜 घटनात्मक तरतूद (अधिकृत मजकूर)
            </p>
            {article.official_text_mr || article.official_text_en ? (
              <p className="text-sm md:text-base text-muted-foreground whitespace-pre-line leading-relaxed border-l-2 border-accent pl-4">
                {article.official_text_mr || article.official_text_en}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">अधिकृत मजकूर उपलब्ध नाही.</p>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              हा अधिकृत घटनात्मक मजकूर पडताळलेल्या स्रोतातून घेतला आहे.
            </p>
          </Card>

          {/* Layer 2 — simplified */}
          <Card className="p-5 md:p-6">
            <p className="flex items-center gap-2 font-semibold text-foreground mb-3">
              <Brain size={18} className="text-accent" /> 🧠 सोप्या भाषेत (विचारमंच शैक्षणिक स्पष्टीकरण)
            </p>
            <p className="text-foreground leading-relaxed">
              {article.simple_explanation_mr || "या कलमाचे सोप्या भाषेतील स्पष्टीकरण अद्याप तयार झालेले नाही."}
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              हे स्पष्टीकरण शैक्षणिक स्वरूपाचे आहे — अधिकृत घटनात्मक मजकूर नाही.
            </p>
          </Card>

          {/* Layer 3 — example */}
          {article.real_life_example_mr && (
            <Card className="p-5 md:p-6 bg-secondary">
              <p className="flex items-center gap-2 font-semibold text-foreground mb-3">
                <Home size={18} className="text-accent" /> 🏠 दैनंदिन जीवनातील उदाहरण
              </p>
              <p className="text-foreground leading-relaxed">{article.real_life_example_mr}</p>
            </Card>
          )}

          {/* Related graph */}
          {related.length > 0 && (
            <Card className="p-5 md:p-6">
              <p className="font-semibold text-foreground mb-3">संबंधित कलमे</p>
              <div className="flex flex-wrap gap-2">
                {related.map((r) => (
                  <Button key={r.id} asChild size="sm" variant="outline">
                    <Link to={`/ideology/constitution/kalam/${encodeURIComponent(r.article_number)}`}>
                      कलम {r.article_number}
                    </Link>
                  </Button>
                ))}
              </div>
            </Card>
          )}

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/ideology/constitution">आणखी कलमे शोधा</Link>
            </Button>
            <Button asChild>
              <Link to="/quiz">ज्ञान तपासा</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ConstitutionArticle;
