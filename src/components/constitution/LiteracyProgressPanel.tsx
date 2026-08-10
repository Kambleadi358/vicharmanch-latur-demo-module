import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, RotateCcw } from "lucide-react";
import {
  readProgress,
  literacyScore,
  resetProgress,
  prePostSummary,
  type ConstitutionProgress,
} from "@/lib/constitutionProgress";

interface Props {
  totals: { articles: number; lessons: number; topics: number };
}

const LiteracyProgressPanel = ({ totals }: Props) => {
  const [p, setP] = useState<ConstitutionProgress>(readProgress());

  useEffect(() => {
    const h = () => setP(readProgress());
    window.addEventListener("vm-constitution-progress", h);
    return () => window.removeEventListener("vm-constitution-progress", h);
  }, []);

  const score = literacyScore(p, totals);
  const prePost = prePostSummary(p);

  const rows = [
    { label: "कलमे अभ्यासली", value: score.breakdown.articles },
    { label: "विषय शोधले", value: score.breakdown.topics },
    { label: "धडे पूर्ण", value: score.breakdown.lessons },
    { label: "प्रश्नमंजुषा कामगिरी", value: score.breakdown.quiz },
  ];

  return (
    <Card className="p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
          <GraduationCap className="text-accent" size={22} /> माझी संविधान शिकण्याची प्रगती
        </h3>
        <span className="text-3xl font-bold text-accent">
          {score.total}
          <span className="text-base text-muted-foreground">/100</span>
        </span>
      </div>

      <Progress value={score.total} className="mb-6" />

      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-medium text-foreground">{r.value}%</span>
            </div>
            <Progress value={r.value} className="h-2" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 text-center mb-5">
        <div className="bg-secondary rounded-lg p-3">
          <p className="text-xl font-bold text-foreground">{p.articlesViewed.length}</p>
          <p className="text-xs text-muted-foreground">कलमे पाहिली</p>
        </div>
        <div className="bg-secondary rounded-lg p-3">
          <p className="text-xl font-bold text-foreground">
            {p.lessonsCompleted.length}/{totals.lessons}
          </p>
          <p className="text-xs text-muted-foreground">धडे पूर्ण</p>
        </div>
        <div className="bg-secondary rounded-lg p-3">
          <p className="text-xl font-bold text-foreground">{p.quizAttempts.length}</p>
          <p className="text-xs text-muted-foreground">प्रश्नमंजुषा प्रयत्न</p>
        </div>
      </div>

      {prePost && (
        <div className="rounded-lg border border-border p-4 text-sm mb-5">
          <p className="font-medium text-foreground mb-1">पूर्व व नंतरची तपासणी</p>
          <p className="text-muted-foreground">
            पूर्व: {prePost.pre}% · नंतर: {prePost.post}% · बदल:{" "}
            <span className="text-accent font-medium">
              {prePost.improvement > 0 ? "+" : ""}
              {prePost.improvement} टक्के गुण
            </span>
          </p>
        </div>
      )}

      <p className="text-xs text-muted-foreground mb-4">
        ही प्रगती केवळ तुमच्या स्वतःच्या ब्राउझरमध्ये साठवली जाते. ही शैक्षणिक प्रगती दर्शवते — कायदेशीर
        पात्रतेचे मोजमाप नाही.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link to="/quiz">प्रश्नमंजुषा द्या</Link>
        </Button>
        <Button size="sm" variant="outline" onClick={() => resetProgress()}>
          <RotateCcw size={14} className="mr-2" /> प्रगती रीसेट करा
        </Button>
      </div>
    </Card>
  );
};

export default LiteracyProgressPanel;
