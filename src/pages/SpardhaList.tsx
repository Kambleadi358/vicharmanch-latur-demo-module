// Public list page: all visible competitions
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Loader2, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useSeo } from "@/hooks/useSeo";

const SpardhaList = () => {
  useSeo({
    title: "स्पर्धा | विचारमंच लातूर",
    description: "रांगोळी व इतर स्पर्धांच्या नोंदी, सार्वजनिक मतदान व निकाल पहा.",
    canonical: "/spardha",
  });

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

  // Feature रांगोळी स्पर्धा if present; else keep as normal list.
  const featured = comps.find((c) => (c.name || "").includes("रांगोळी"));
  const rest = featured ? comps.filter((c) => c.id !== featured.id) : comps;

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
            <div className="space-y-6">
              {featured && (
                <Link to={`/spardha/${featured.id}`}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.01 }}
                    className="relative overflow-hidden rounded-2xl border-2 border-accent shadow-xl cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500 via-orange-500 to-rose-500 opacity-90" />
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_50%,white_1px,transparent_2px),radial-gradient(circle_at_80%_50%,white_1px,transparent_2px)] [background-size:40px_40px]" />
                    <div className="relative p-6 sm:p-8 text-white">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur px-3 py-1 text-[11px] font-bold uppercase tracking-widest mb-3">
                        🎨 मुख्य आकर्षण · Main Focus
                      </div>
                      <h2 className="text-3xl sm:text-4xl font-black leading-tight">{featured.name}</h2>
                      <p className="text-white/90 mt-2 text-sm">{(featured.programs as any)?.name}</p>
                      <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white text-fuchsia-700 px-5 py-2 font-bold text-sm shadow-lg">
                        मत द्या <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              )}

              {rest.length > 0 && (
                <div>
                  {featured && <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-semibold">इतर स्पर्धा</p>}
                  <div className="grid sm:grid-cols-2 gap-4">
                    {rest.map((c) => (
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
                </div>
              )}
            </div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default SpardhaList;
