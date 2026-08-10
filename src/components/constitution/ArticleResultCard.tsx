import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle2 } from "lucide-react";
import type { ArticleMatch } from "@/lib/constitution";

interface Props {
  match: ArticleMatch;
  showReasons?: boolean;
}

const ArticleResultCard = ({ match, showReasons = true }: Props) => {
  const { article: a, reasons, categories } = match;
  return (
    <Card className="p-4 md:p-5 h-full flex flex-col">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
        <span className="text-lg font-bold text-accent">कलम {a.article_number}</span>
        <span className="font-medium text-foreground break-words">{a.title_mr}</span>
      </div>

      {a.simple_explanation_mr ? (
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{a.simple_explanation_mr}</p>
      ) : (
        <p className="text-sm text-muted-foreground italic line-clamp-3 mb-3">
          {a.title_en || "सोप्या भाषेतील स्पष्टीकरण अद्याप उपलब्ध नाही — अधिकृत मजकूर उपलब्ध आहे."}
        </p>
      )}

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {categories.slice(0, 4).map((c) => (
            <Badge key={c.id} variant="secondary" className="text-[11px]">
              {c.name_mr}
            </Badge>
          ))}
        </div>
      )}

      {showReasons && reasons.length > 0 && (
        <div className="rounded-lg bg-secondary/70 border border-border p-3 mb-3 text-xs space-y-1">
          <p className="font-medium text-foreground">
            कलम {a.article_number} तुम्हाला सुचवले कारण:
          </p>
          {reasons.slice(0, 4).map((r, i) => (
            <p key={i} className="flex items-start gap-1.5 text-muted-foreground">
              <CheckCircle2 size={13} className="text-accent mt-0.5 shrink-0" />
              <span>
                {r.label}: <span className="text-foreground">{r.value}</span>
              </span>
            </p>
          ))}
          <p className="text-muted-foreground pt-1">हे घटनात्मक कलम या विषयाशी संबंधित आहे.</p>
        </div>
      )}

      <div className="mt-auto">
        <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
          <Link to={`/ideology/constitution/kalam/${encodeURIComponent(a.article_number)}`}>
            <BookOpen size={15} className="mr-2" /> सविस्तर वाचा
          </Link>
        </Button>
      </div>
    </Card>
  );
};

export default ArticleResultCard;
