import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Compass, MessageSquareText } from "lucide-react";
import {
  fetchCategories,
  fetchArticlesByCategory,
  fetchCategoriesForArticles,
  mapSituation,
  logConstitutionEvent,
  type CCategory,
  type ArticleMatch,
} from "@/lib/constitution";
import { markTopicExplored } from "@/lib/constitutionProgress";
import ArticleResultCard from "./ArticleResultCard";

const sampleSituations = [
  "माझ्याशी जातीमुळे भेदभाव झाला",
  "मला शिक्षणाच्या अधिकाराबद्दल माहिती हवी",
  "मला धर्मस्वातंत्र्याबद्दल माहिती हवी",
  "मला समान संधीबद्दल माहिती हवी",
];

const RightsFinder = () => {
  const [categories, setCategories] = useState<CCategory[]>([]);
  const [results, setResults] = useState<ArticleMatch[]>([]);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [situation, setSituation] = useState("");
  const [sitLoading, setSitLoading] = useState(false);
  const [sitResults, setSitResults] = useState<ArticleMatch[] | null>(null);
  const [sitTopics, setSitTopics] = useState<CCategory[]>([]);

  useEffect(() => {
    fetchCategories().then((c) => setCategories(c.filter((x) => x.kind === "topic")));
  }, []);

  const pickTopic = async (c: CCategory) => {
    setActiveSlug(c.slug);
    setLoading(true);
    const arts = await fetchArticlesByCategory(c.id);
    const catMap = await fetchCategoriesForArticles(arts.map((a) => a.id));
    setResults(
      arts.map((a) => ({
        article: a,
        reasons: [
          { kind: "category" as const, label: "विषय", value: c.name_mr },
          { kind: "category" as const, label: "Category", value: c.slug },
        ],
        categories: catMap.get(a.id) || [],
      }))
    );
    setLoading(false);
    markTopicExplored(c.slug);
    logConstitutionEvent({ event_type: "topic_lookup", category_slug: c.slug, matched_count: arts.length });
  };

  const runSituation = async (text: string) => {
    const q = text.trim();
    if (!q) return;
    setSituation(q);
    setSitLoading(true);
    const r = await mapSituation(q);
    setSitResults(r.results);
    setSitTopics(r.matchedCategories);
    setSitLoading(false);
    logConstitutionEvent({ event_type: "situation_lookup", query_text: q, matched_count: r.results.length });
  };

  return (
    <div className="space-y-14">
      {/* Rights finder */}
      <div>
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground flex items-center justify-center gap-2">
            <Compass className="text-accent" size={24} /> माझा हक्क कुठे आहे?
          </h2>
          <div className="decorative-line mt-3" />
          <p className="text-sm text-muted-foreground mt-3">
            विषय निवडा — त्या विषयाशी संबंधित घटनात्मक तरतुदी दिसतील.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {categories.map((c) => (
            <Button
              key={c.id}
              size="sm"
              variant={activeSlug === c.slug ? "default" : "outline"}
              onClick={() => pickTopic(c)}
            >
              {c.name_mr}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-accent" />
          </div>
        ) : activeSlug ? (
          results.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {results.map((m) => (
                <ArticleResultCard key={m.article.id} match={m} />
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              या विषयासाठी सध्या पडताळलेली कलमे जोडलेली नाहीत.
            </p>
          )
        ) : null}
      </div>

      {/* Situation mapping */}
      <div>
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground flex items-center justify-center gap-2">
            <MessageSquareText className="text-accent" size={24} /> परिस्थितीत संविधान
          </h2>
          <div className="decorative-line mt-3" />
          <p className="text-sm text-muted-foreground mt-3">
            तुमची परिस्थिती सोप्या शब्दांत लिहा — संबंधित विषय व कलमे शोधली जातील. (ही कायदेशीर सल्ला सेवा नाही,
            केवळ शैक्षणिक माहिती आहे.)
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto mb-3">
          <Input
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSituation(situation)}
            placeholder="उदा. माझ्याशी जातीमुळे भेदभाव झाला"
            className="h-11"
          />
          <Button className="h-11" onClick={() => runSituation(situation)} disabled={sitLoading}>
            {sitLoading ? <Loader2 className="animate-spin" size={16} /> : "कलमे शोधा"}
          </Button>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {sampleSituations.map((s) => (
            <Button key={s} size="sm" variant="ghost" className="text-xs" onClick={() => runSituation(s)}>
              {s}
            </Button>
          ))}
        </div>

        {sitResults && !sitLoading && (
          <>
            {sitTopics.length > 0 && (
              <p className="text-center text-sm text-muted-foreground mb-4">
                ओळखलेले विषय: {sitTopics.map((c) => c.name_mr).join(", ")}
              </p>
            )}
            {sitResults.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {sitResults.map((m) => (
                  <ArticleResultCard key={m.article.id} match={m} />
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                या वाक्यातून विषय ओळखता आला नाही. वेगळे शब्द वापरून पहा (उदा. भेदभाव, शिक्षण, धर्म).
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RightsFinder;
