import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2, Layers, Tags } from "lucide-react";
import {
  fetchParts,
  fetchCategories,
  fetchArticlesByPart,
  fetchArticlesByCategory,
  fetchCategoriesForArticles,
  logConstitutionEvent,
  type CPart,
  type CCategory,
  type ArticleMatch,
} from "@/lib/constitution";
import { markTopicExplored } from "@/lib/constitutionProgress";
import ArticleResultCard from "./ArticleResultCard";

const PAGE = 12;

const ConstitutionExplorer = () => {
  const [parts, setParts] = useState<CPart[]>([]);
  const [categories, setCategories] = useState<CCategory[]>([]);
  const [mode, setMode] = useState<"part" | "category">("part");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [items, setItems] = useState<ArticleMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState(PAGE);

  useEffect(() => {
    Promise.all([fetchParts(), fetchCategories()]).then(([p, c]) => {
      setParts(p);
      setCategories(c);
    });
  }, []);

  const load = async (kind: "part" | "category", id: string) => {
    setMode(kind);
    setActiveId(id);
    setLimit(PAGE);
    setLoading(true);
    const arts = kind === "part" ? await fetchArticlesByPart(id, 0, 199) : await fetchArticlesByCategory(id);
    const catMap = await fetchCategoriesForArticles(arts.map((a) => a.id));
    setItems(arts.map((a) => ({ article: a, reasons: [], categories: catMap.get(a.id) || [] })));
    setLoading(false);
    if (kind === "category") {
      const c = categories.find((x) => x.id === id);
      if (c) {
        markTopicExplored(c.slug);
        logConstitutionEvent({
          event_type: "topic_lookup",
          category_slug: c.slug,
          matched_count: arts.length,
        });
      }
    }
  };

  return (
    <div>
      <div className="mb-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
          <Layers size={16} className="text-accent" /> भागानुसार
        </p>
        <div className="flex flex-wrap gap-2">
          {parts.map((p) => (
            <Button
              key={p.id}
              size="sm"
              variant={mode === "part" && activeId === p.id ? "default" : "outline"}
              onClick={() => load("part", p.id)}
              className="text-xs"
            >
              भाग {p.part_code} · {p.name_mr}
            </Button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
          <Tags size={16} className="text-accent" /> वर्गानुसार
        </p>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Badge
              key={c.id}
              variant={mode === "category" && activeId === c.id ? "default" : "secondary"}
              className="cursor-pointer py-1 px-3"
              onClick={() => load("category", c.id)}
            >
              {c.name_mr}
            </Badge>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-accent" />
        </div>
      ) : activeId ? (
        items.length ? (
          <>
            <p className="text-sm text-muted-foreground mb-3">
              {items.length} कलमे · दाखवत आहे {Math.min(limit, items.length)}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {items.slice(0, limit).map((m) => (
                <ArticleResultCard key={m.article.id} match={m} showReasons={false} />
              ))}
            </div>
            {limit < items.length && (
              <div className="text-center mt-5">
                <Button variant="outline" onClick={() => setLimit((l) => l + PAGE)}>
                  आणखी कलमे पहा
                </Button>
              </div>
            )}
          </>
        ) : (
          <p className="text-muted-foreground text-sm">या निवडीसाठी कलमे उपलब्ध नाहीत.</p>
        )
      ) : (
        <Card className="p-6 text-center text-muted-foreground text-sm">
          भाग किंवा वर्ग निवडा — त्या अंतर्गत येणारी कलमे येथे दिसतील.
        </Card>
      )}
    </div>
  );
};

export default ConstitutionExplorer;
