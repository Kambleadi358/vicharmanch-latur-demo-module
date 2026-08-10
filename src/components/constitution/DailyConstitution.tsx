import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { fetchDailyTrio, type DailyTrio } from "@/lib/constitution";

const linkFor = (n: string) => `/ideology/constitution/kalam/${encodeURIComponent(n)}`;

const DailyConstitution = () => {
  const [trio, setTrio] = useState<DailyTrio | null>(null);

  useEffect(() => {
    fetchDailyTrio().then(setTrio);
  }, []);

  if (!trio?.today) return null;
  const t = trio.today;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
      <Card className="overflow-hidden border-2 border-accent/40">
        <div className="p-5 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2 text-accent">
              <Sparkles size={18} className="animate-pulse" />
              <span className="text-sm font-semibold uppercase tracking-wider">आजचे संविधान</span>
            </div>
            <span className="text-xs text-muted-foreground">
              शिकण्याचा दिवस {trio.cycleDay}/{trio.poolSize}
            </span>
          </div>

          <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">
            कलम {t.article_number} — {t.title_mr}
          </h3>
          {t.simple_explanation_mr && (
            <p className="text-muted-foreground leading-relaxed mb-5">{t.simple_explanation_mr}</p>
          )}
          <Button asChild>
            <Link to={linkFor(t.article_number)}>
              <BookOpen size={16} className="mr-2" /> सविस्तर वाचा
            </Link>
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 border-t border-border">
          {trio.yesterday && (
            <Link
              to={linkFor(trio.yesterday.article_number)}
              className="p-4 hover:bg-secondary transition-colors border-b sm:border-b-0 sm:border-r border-border"
            >
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <ArrowLeft size={12} /> कालचे संविधान
              </span>
              <p className="text-sm font-medium text-foreground mt-1 line-clamp-1">
                कलम {trio.yesterday.article_number} — {trio.yesterday.title_mr}
              </p>
            </Link>
          )}
          {trio.tomorrow && (
            <Link
              to={linkFor(trio.tomorrow.article_number)}
              className="p-4 hover:bg-secondary transition-colors sm:text-right"
            >
              <span className="text-xs text-muted-foreground flex items-center gap-1 sm:justify-end">
                उद्याचे संविधान <ArrowRight size={12} />
              </span>
              <p className="text-sm font-medium text-foreground mt-1 line-clamp-1">
                कलम {trio.tomorrow.article_number} — {trio.tomorrow.title_mr}
              </p>
            </Link>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default DailyConstitution;
