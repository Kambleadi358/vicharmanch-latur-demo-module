import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, TrendingUp, TrendingDown, Wallet, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";

interface AnnualReport {
  id: string;
  year: string;
  title: string;
  pdf_url: string | null;
  remark: string | null;
  total_jama: number;
  total_expense: number;
}

const Ahval = () => {
  const [reports, setReports] = useState<AnnualReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("annual_reports")
        .select("*")
        .order("year", { ascending: false });
      setReports((data as AnnualReport[]) || []);
      setLoading(false);
    })();
  }, []);

  const chartData = [...reports]
    .sort((a, b) => a.year.localeCompare(b.year))
    .map((r) => ({
      year: r.year,
      जमा: Number(r.total_jama) || 0,
      खर्च: Number(r.total_expense) || 0,
      शिल्लक: (Number(r.total_jama) || 0) - (Number(r.total_expense) || 0),
    }));

  const totals = reports.reduce(
    (acc, r) => {
      acc.jama += Number(r.total_jama) || 0;
      acc.expense += Number(r.total_expense) || 0;
      return acc;
    },
    { jama: 0, expense: 0 }
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/20 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">वार्षिक अहवाल</h1>
            <p className="text-muted-foreground">भीम जयंती – वर्षनिहाय अहवाल व आर्थिक स्थिती</p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : reports.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">अद्याप कोणताही अहवाल प्रकाशित केलेला नाही.</CardContent></Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">एकूण जमा</p>
                        <p className="text-2xl font-bold text-emerald-600">₹{totals.jama.toLocaleString("en-IN")}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-emerald-600/60" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-rose-500/10 to-rose-500/5 border-rose-500/20">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">एकूण खर्च</p>
                        <p className="text-2xl font-bold text-rose-600">₹{totals.expense.toLocaleString("en-IN")}</p>
                      </div>
                      <TrendingDown className="h-8 w-8 text-rose-600/60" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">शिल्लक</p>
                        <p className="text-2xl font-bold text-primary">₹{(totals.jama - totals.expense).toLocaleString("en-IN")}</p>
                      </div>
                      <Wallet className="h-8 w-8 text-primary/60" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {chartData.length > 0 && (
                <Card className="mb-8">
                  <CardHeader><CardTitle>वर्षनिहाय जमा-खर्च तुलना</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="year" />
                          <YAxis />
                          <Tooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
                          <Legend />
                          <Bar dataKey="जमा" fill="hsl(142 70% 45%)" radius={[4,4,0,0]} />
                          <Bar dataKey="खर्च" fill="hsl(0 70% 55%)" radius={[4,4,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="h-56 w-full mt-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="year" />
                          <YAxis />
                          <Tooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
                          <Legend />
                          <Line type="monotone" dataKey="शिल्लक" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                {reports.map((r, i) => (
                  <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-bold text-primary">{r.title}</h2>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm">
                              <span className="text-emerald-600">जमा: <strong>₹{Number(r.total_jama).toLocaleString("en-IN")}</strong></span>
                              <span className="text-rose-600">खर्च: <strong>₹{Number(r.total_expense).toLocaleString("en-IN")}</strong></span>
                              <span className="text-primary">शिल्लक: <strong>₹{(Number(r.total_jama) - Number(r.total_expense)).toLocaleString("en-IN")}</strong></span>
                            </div>
                            {r.remark && <p className="text-sm text-muted-foreground mt-2">{r.remark}</p>}
                          </div>
                          {r.pdf_url && (
                            <div className="flex gap-2">
                              <a href={r.pdf_url} target="_blank" rel="noreferrer">
                                <Button variant="outline"><FileText className="h-4 w-4 mr-2" />पाहा</Button>
                              </a>
                              <a href={r.pdf_url} download>
                                <Button><Download className="h-4 w-4 mr-2" />डाउनलोड</Button>
                              </a>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Ahval;
