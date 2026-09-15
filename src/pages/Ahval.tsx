import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Loader2, TrendingUp, TrendingDown, Wallet, Download, Calendar, ArrowRight, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { useSeo } from "@/hooks/useSeo";

interface AnnualReport {
  id: string;
  year: string;
  title: string;
  pdf_url: string | null;
  remark: string | null;
  total_jama: number;
  total_expense: number;
}

interface ArchiveRow {
  id: string; year: string; archive_date: string; remark: string;
  summary: any;
}

const Ahval = () => {
  useSeo({
    title: "वार्षिक अहवाल | विचारमंच लातूर",
    description: "विचारमंचाचे वर्षनिहाय अहवाल, जमा-खर्च आलेख व PDF डाउनलोड.",
    canonical: "/ahval",
  });

  const [reports, setReports] = useState<AnnualReport[]>([]);
  const [archives, setArchives] = useState<ArchiveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AnnualReport | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: r }, { data: a }] = await Promise.all([
        supabase.from("annual_reports").select("*").order("year", { ascending: false }),
        supabase.from("archives").select("id, year, archive_date, remark, summary").order("year", { ascending: false }),
      ]);
      setReports((r as AnnualReport[]) || []);
      setArchives((a as any) || []);
      setLoading(false);
    })();
  }, []);

  const buildChartData = (r: AnnualReport) => {
    const jama = Number(r.total_jama) || 0;
    const expense = Number(r.total_expense) || 0;
    return {
      bar: [
        { name: "जमा", value: jama, fill: "hsl(142 70% 45%)" },
        { name: "खर्च", value: expense, fill: "hsl(0 70% 55%)" },
        { name: "शिल्लक", value: jama - expense, fill: "hsl(var(--primary))" },
      ],
      pie: [
        { name: "जमा", value: jama },
        { name: "खर्च", value: expense },
      ],
    };
  };

  const PIE_COLORS = ["hsl(142 70% 45%)", "hsl(0 70% 55%)"];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/20 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <h1 className="text-3xl md:text-5xl font-bold text-primary mb-3">वार्षिक अहवाल</h1>
            <p className="text-muted-foreground">भीम जयंती – वर्षनिहाय अहवाल</p>
            <p className="text-xs text-muted-foreground mt-1">कार्डवर क्लिक करा संपूर्ण अहवाल पाहण्यासाठी</p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : reports.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">अद्याप कोणताही अहवाल प्रकाशित केलेला नाही.</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {reports.map((r, i) => {
                const shillak = (Number(r.total_jama) || 0) - (Number(r.total_expense) || 0);
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, type: "spring", stiffness: 100 }}
                    whileHover={{ y: -6, scale: 1.02 }}
                    className="cursor-pointer"
                    onClick={() => setSelected(r)}
                  >
                    <Card className="relative overflow-hidden border-2 hover:border-primary/50 hover:shadow-2xl transition-all duration-300 h-full bg-gradient-to-br from-card via-card to-primary/5">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-10 translate-x-10" />
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl translate-y-8 -translate-x-8" />
                      <CardContent className="p-6 relative">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                            <Calendar className="h-3 w-3" />
                            {r.year}
                          </div>
                          {r.pdf_url && (
                            <div className="flex items-center gap-1 text-xs text-emerald-600">
                              <FileText className="h-3 w-3" /> PDF
                            </div>
                          )}
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-4 leading-tight">{r.title}</h2>
                        <div className="space-y-2 mb-5">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">जमा</span>
                            <span className="font-bold text-emerald-600">₹{Number(r.total_jama).toLocaleString("en-IN")}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">खर्च</span>
                            <span className="font-bold text-rose-600">₹{Number(r.total_expense).toLocaleString("en-IN")}</span>
                          </div>
                          <div className="h-px bg-border" />
                          <div className="flex justify-between text-sm">
                            <span className="font-semibold">शिल्लक</span>
                            <span className="font-bold text-primary">₹{shillak.toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t">
                          <span className="text-xs text-muted-foreground">तपशील पाहा</span>
                          <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Historical archives */}
        {archives.length > 0 && (
          <div className="max-w-6xl mx-auto px-4 mt-16">
            <motion.h2 initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-2xl md:text-3xl font-bold text-primary mb-6 text-center">
              ऐतिहासिक अभिलेखागार
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {archives.map((a) => {
                const s = a.summary || {};
                const jama = Number(s.totals?.donations ?? s.donations ?? 0);
                const kharch = Number(s.totals?.expenses ?? s.expenses ?? 0);
                const shillak = jama - kharch;
                return (
                  <Card key={a.id} className="border-2 border-primary/10 hover:border-primary/40 transition-colors">
                    <CardContent className="p-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">वर्ष {a.year}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(a.archive_date).toLocaleDateString("mr-IN")}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>जमा <b className="block text-emerald-600">₹{jama.toLocaleString("en-IN")}</b></div>
                        <div>खर्च <b className="block text-rose-600">₹{kharch.toLocaleString("en-IN")}</b></div>
                        <div>शिल्लक <b className="block text-primary">₹{shillak.toLocaleString("en-IN")}</b></div>
                        <div>सहभागी <b className="block">{s.totals?.participants ?? s.participants ?? 0}</b></div>
                        <div>कार्यक्रम <b className="block">{s.totals?.programs ?? s.programs ?? 0}</b></div>
                      </div>
                      {a.remark && <p className="text-[11px] text-muted-foreground border-t pt-2 mt-2">{a.remark}</p>}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl text-primary">{selected.title}</DialogTitle>
              </DialogHeader>

              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-3 gap-3">
                    <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
                      <CardContent className="p-4">
                        <TrendingUp className="h-5 w-5 text-emerald-600 mb-2" />
                        <p className="text-xs text-muted-foreground">जमा</p>
                        <p className="text-lg font-bold text-emerald-600">₹{Number(selected.total_jama).toLocaleString("en-IN")}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-rose-500/10 to-rose-500/5 border-rose-500/20">
                      <CardContent className="p-4">
                        <TrendingDown className="h-5 w-5 text-rose-600 mb-2" />
                        <p className="text-xs text-muted-foreground">खर्च</p>
                        <p className="text-lg font-bold text-rose-600">₹{Number(selected.total_expense).toLocaleString("en-IN")}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                      <CardContent className="p-4">
                        <Wallet className="h-5 w-5 text-primary mb-2" />
                        <p className="text-xs text-muted-foreground">शिल्लक</p>
                        <p className="text-lg font-bold text-primary">₹{(Number(selected.total_jama) - Number(selected.total_expense)).toLocaleString("en-IN")}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-base">तुलना</CardTitle></CardHeader>
                      <CardContent>
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={buildChartData(selected).bar}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
                              <Bar dataKey="value" radius={[6, 6, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-base">जमा vs खर्च</CardTitle></CardHeader>
                      <CardContent>
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={buildChartData(selected).pie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                                {buildChartData(selected).pie.map((_, idx) => (
                                  <Cell key={idx} fill={PIE_COLORS[idx]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {selected.remark && (
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground mb-1">शेरा</p>
                        <p className="text-sm">{selected.remark}</p>
                      </CardContent>
                    </Card>
                  )}

                  {selected.pdf_url && (
                    <>
                      <div className="flex flex-wrap gap-2">
                        <a href={selected.pdf_url} target="_blank" rel="noreferrer" className="flex-1">
                          <Button variant="outline" className="w-full"><FileText className="h-4 w-4 mr-2" />नवीन टॅबमध्ये उघडा</Button>
                        </a>
                        <a href={selected.pdf_url} download className="flex-1">
                          <Button className="w-full"><Download className="h-4 w-4 mr-2" />डाउनलोड करा</Button>
                        </a>
                      </div>
                      <Card className="overflow-hidden">
                        <CardHeader className="pb-2"><CardTitle className="text-base">PDF पूर्वावलोकन</CardTitle></CardHeader>
                        <CardContent className="p-0">
                          <iframe
                            src={selected.pdf_url}
                            title={selected.title}
                            className="w-full h-[500px] border-0"
                          />
                        </CardContent>
                      </Card>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Ahval;
