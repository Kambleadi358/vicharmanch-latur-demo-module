import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Award, CheckCircle2, XCircle, Loader2, Clock, BookOpen, Home, BarChart3, Lightbulb } from "lucide-react";
import { fetchCategories, fetchArticlesByCategory, type CArticle, type CCategory } from "@/lib/constitution";
import { recordQuizAttempt } from "@/lib/constitutionProgress";
import { Link } from "react-router-dom";

type Result = {
  participant_name: string;
  dob: string;
  score: number;
  total_marks: number;
  total_questions: number;
  time_taken: number | null;
  percentage: number;
  status: string;
  quiz_status: string;
  show_answer_key: boolean;
  topics?: {
    slug: string;
    total: number;
    attempted: number;
    correct: number;
    incorrect: number;
    percentage: number;
  }[];
  breakdown: {
    question: string;
    options: Record<string, string>;
    correct: string;
    your_answer: string | null;
    is_correct: boolean;
    marks: number;
  }[];
};

const QuizResult = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string>("");
  const [categories, setCategories] = useState<CCategory[]>([]);
  const [recommended, setRecommended] = useState<{ category: CCategory; articles: CArticle[] } | null>(null);

  useEffect(() => {
    const sid = params.get("session_id") || sessionStorage.getItem("quiz_session_id");
    const name = params.get("name");
    const dob = params.get("dob");

    (async () => {
      const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/quiz-result`);
      if (sid) url.searchParams.set("session_id", sid);
      else if (name && dob) {
        url.searchParams.set("name", name);
        url.searchParams.set("dob", dob);
      } else {
        setError("निकाल शोधण्यासाठी माहिती नाही");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(url.toString(), {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "" },
        });
        if (!res.ok && res.status === 0) {
          throw new Error("निकाल सेवा उपलब्ध नाही");
        }
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 404) {
            setError("या नाव व जन्मतारखेसाठी निकाल सापडला नाही. कृपया प्रश्नमंजुषा देताना वापरलेले अचूक नाव व जन्मतारीख टाका.");
          } else {
            setError(data.error || "निकाल मिळाला नाही");
          }
        } else {
          setResult(data);
        }
      } catch (e: any) {
        setError(e?.message || "त्रुटी आली");
      } finally {
        setLoading(false);
      }
    })();
  }, [params]);

  useEffect(() => {
    const topics = result?.topics ?? [];
    if (!topics.length) return;
    recordQuizAttempt(
      result!.percentage,
      Object.fromEntries(topics.map((t) => [t.slug, t.percentage]))
    );
    (async () => {
      const cats = await fetchCategories();
      setCategories(cats);
      const weakest = topics[0];
      if (!weakest || weakest.percentage >= 60) return;
      const cat = cats.find((c) => c.slug === weakest.slug);
      if (!cat) return;
      const articles = await fetchArticlesByCategory(cat.id);
      setRecommended({ category: cat, articles: articles.slice(0, 5) });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const catName = (slug: string) =>
    categories.find((c) => c.slug === slug)?.name_mr ?? slug;

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
        </div>
      </Layout>
    );
  }

  if (error || !result) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
          <p className="text-destructive mb-4">{error || "निकाल नाही"}</p>
          <Button onClick={() => navigate("/quiz")}>परत प्रश्नमंजुषा वर जा</Button>
        </div>
      </Layout>
    );
  }

  const minutes = result.time_taken ? Math.floor(result.time_taken / 60) : 0;
  const seconds = result.time_taken ? result.time_taken % 60 : 0;

  return (
    <Layout>
      <section className="hero-gradient py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Award className="mx-auto text-accent mb-4" size={64} />
            <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
              {result.participant_name} यांचा निकाल
            </h1>
            <p className="text-primary-foreground/80">विचारमंच प्रश्नमंजुषा</p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
          {/* Score cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-5 text-center">
              <p className="text-xs text-muted-foreground">एकूण गुण</p>
              <p className="text-3xl font-bold text-accent mt-1">{result.score}<span className="text-base text-muted-foreground">/{result.total_marks}</span></p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 text-center">
              <p className="text-xs text-muted-foreground">टक्केवारी</p>
              <p className="text-3xl font-bold mt-1">{result.percentage}%</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 text-center">
              <p className="text-xs text-muted-foreground">प्रश्न</p>
              <p className="text-3xl font-bold mt-1">{result.total_questions}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 text-center">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Clock size={12} /> वेळ</p>
              <p className="text-3xl font-bold mt-1">{minutes}:{seconds.toString().padStart(2, "0")}</p>
            </div>
          </div>

          {/* Topic-wise performance */}
          {(result.topics?.length ?? 0) > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="text-accent" />
                <h2 className="text-xl font-semibold">विषयनिहाय कामगिरी</h2>
              </div>
              <div className="space-y-4">
                {result.topics!.map((t) => (
                  <div key={t.slug}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{catName(t.slug)}</span>
                      <span className="text-muted-foreground">
                        {t.correct}/{t.total} · {t.percentage}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${t.percentage >= 60 ? "bg-accent" : "bg-destructive"}`}
                        style={{ width: `${Math.max(2, t.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explainable learning recommendations */}
          {recommended && recommended.articles.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="text-accent" />
                <h2 className="text-xl font-semibold">शिफारस केलेले वाचन</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                तुमची <strong>{recommended.category.name_mr}</strong> विषयातील कामगिरी तुलनेने कमी आहे.
                ही कलमे त्या विषयाशी संबंधित आहेत.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {recommended.articles.map((a) => (
                  <Link
                    key={a.id}
                    to={`/ideology/constitution/kalam/${a.article_number}`}
                    className="border border-border rounded-lg p-3 hover:border-accent transition-colors"
                  >
                    <p className="text-sm font-semibold text-accent">कलम {a.article_number}</p>
                    <p className="text-sm text-foreground">{a.title_mr || a.title_en}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Answer key */}
          {result.show_answer_key && result.breakdown.length > 0 ? (
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="text-accent" />
                <h2 className="text-xl font-bold">उत्तर तपासणी</h2>
              </div>
              <div className="space-y-4">
                {result.breakdown.map((b, i) => (
                  <div key={i} className="border border-border rounded-lg p-4">
                    <p className="font-semibold mb-3">{i + 1}. {b.question}</p>
                    <div className="grid sm:grid-cols-2 gap-2 text-sm">
                      {(["A", "B", "C", "D"] as const).map((k) => {
                        const isCorrect = b.correct === k;
                        const isYours = b.your_answer === k;
                        return (
                          <div
                            key={k}
                            className={`p-2 rounded border ${
                              isCorrect ? "border-green-500 bg-green-500/10"
                              : isYours ? "border-destructive bg-destructive/10"
                              : "border-border"
                            }`}
                          >
                            <span className="font-bold mr-2">{k}.</span>{b.options[k]}
                            {isCorrect && <CheckCircle2 className="inline ml-2 h-4 w-4 text-green-600" />}
                            {isYours && !isCorrect && <XCircle className="inline ml-2 h-4 w-4 text-destructive" />}
                          </div>
                        );
                      })}
                    </div>
                    {!b.your_answer && <p className="text-xs text-muted-foreground mt-2">उत्तर दिले नव्हते</p>}
                  </div>
                ))}
              </div>
            </div>
          ) : result.quiz_status !== "COMPLETED" ? (
            <div className="bg-muted rounded-xl p-6 text-center text-muted-foreground">
              प्रश्नमंजुषा संपल्यानंतर प्रशासकांनी उत्तरतालिका जाहीर केल्यावर येथे दिसेल.
            </div>
          ) : null}

          <div className="text-center">
            <Button onClick={() => navigate("/")} variant="outline" className="gap-2">
              <Home size={16} /> मुख्यपृष्ठ
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default QuizResult;
