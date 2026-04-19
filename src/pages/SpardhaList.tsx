// Public list page: all visible competitions
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Loader2, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const SpardhaList = () => {
  const [comps, setComps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("competitions")
        .select("id, name, status, program_id, programs(name)")
        .eq("is_visible", true)
        .order("created_at", { ascending: false });
      setComps(data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 mb-2">
            <Trophy className="h-7 w-7 text-accent" /> स्पर्धा
          </h1>
          <p className="text-muted-foreground mb-6">सर्व सहभागी फोटो पहा आणि आपले मत द्या</p>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : comps.length === 0 ? (
            <Card><CardContent className="p-12 text-center text-muted-foreground">सध्या कोणतीही स्पर्धा उपलब्ध नाही</CardContent></Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {comps.map((c) => (
                <Link key={c.id} to={`/spardha/${c.id}`}>
                  <Card className="hover:border-accent transition-colors cursor-pointer">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-lg">{c.name}</h3>
                        <p className="text-xs text-muted-foreground">{(c.programs as any)?.name}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-accent" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default SpardhaList;
