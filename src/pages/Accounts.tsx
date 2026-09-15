import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Wallet, TrendingUp, TrendingDown, Eye, Calendar, FileText, Loader2, User, IndianRupee } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSeo } from "@/hooks/useSeo";

interface Household { id: string; house_code: number; head_name: string; }
interface Payment { id: string; household_id: string; year: string; amount: number; payment_date: string; }
interface Assignment { household_id: string; year: string; assigned_amount: number; }
interface Expense { id: string; year: string; title: string; amount: number; created_at: string; }

const fmtINR = (amount: number) =>
  new Intl.NumberFormat("mr-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

const fmtDate = (s: string | null) => {
  if (!s) return "-";
  return new Date(s).toLocaleDateString("mr-IN", { day: "numeric", month: "short", year: "numeric" });
};

const Accounts = () => {
  useSeo({
    title: "खातेवही व पारदर्शक हिशोब | विचारमंच लातूर",
    description: "देणगी, जमा, खर्च व शिल्लक यांचा एक-एक रुपयाचा खुला हिशोब — पूर्ण पारदर्शकता.",
    canonical: "/accounts",
  });

  const [households, setHouseholds] = useState<Household[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const [hh, pays, assigns, exp] = await Promise.all([
        supabase.from("households").select("id, house_code, head_name").order("house_code"),
        supabase.from("donation_payments").select("id, household_id, year, amount, payment_date"),
        supabase.from("household_year_assignments").select("household_id, year, assigned_amount"),
        (supabase as any).from("ledger_expenses").select("*").order("created_at", { ascending: false }),
      ]);
      setHouseholds((hh.data as any) || []);
      setPayments((pays.data as any) || []);
      setAssignments((assigns.data as any) || []);
      setExpenses((exp.data as any) || []);
      setIsLoading(false);
    })();
  }, []);

  const years = useMemo(() => {
    const set = new Set<string>();
    payments.forEach((p) => set.add(p.year));
    expenses.forEach((e) => set.add(e.year));
    assignments.forEach((a) => set.add(a.year));
    return Array.from(set).sort().reverse();
  }, [payments, expenses, assignments]);

  return (
    <Layout>
      <section className="hero-gradient py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute bottom-10 right-20 w-72 h-72 bg-accent rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">खाते माहिती</h1>
            <p className="text-xl text-primary-foreground/70 max-w-3xl mx-auto">पारदर्शक व्यवहार • प्रत्येक रुपयाचा हिशोब</p>
          </motion.div>
        </div>
      </section>

      <section className="py-8 bg-accent/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-4 text-center">
            <Eye className="text-accent" size={24} />
            <p className="text-foreground"><span className="font-semibold">१००% पारदर्शकता:</span> संपूर्ण खाते माहिती सार्वजनिक आहे</p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="text-accent text-sm font-medium uppercase tracking-wider">वार्षिक अहवाल</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">वर्षनिहाय खाते माहिती</h2>
            <div className="decorative-line mt-4" />
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
          ) : years.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-8 border border-border text-center">
              <Wallet className="mx-auto mb-6 text-accent" size={64} />
              <h2 className="text-2xl font-bold text-foreground mb-4">सध्या कोणतीही खाते माहिती उपलब्ध नाही</h2>
              <p className="text-muted-foreground">देणगी व खर्च नोंदवल्यानंतर माहिती येथे दिसेल.</p>
            </motion.div>
          ) : (
            <div className="space-y-8">
              {years.map((year, index) => {
                const yearPays = payments.filter((p) => p.year === year);
                const yearAssigns = assignments.filter((a) => a.year === year);
                const yearExp = expenses.filter((e) => e.year === year);

                const totalAssigned = yearAssigns.reduce((s, a) => s + Number(a.assigned_amount), 0);
                const totalIncome = yearPays.reduce((s, p) => s + Number(p.amount), 0);
                const totalExpense = yearExp.reduce((s, e) => s + Number(e.amount), 0);
                const balance = totalIncome - totalExpense;

                // Group payments by household
                const byHouse = new Map<string, { paid: number; lastDate: string | null }>();
                yearPays.forEach((p) => {
                  const cur = byHouse.get(p.household_id) || { paid: 0, lastDate: null };
                  cur.paid += Number(p.amount);
                  if (!cur.lastDate || new Date(p.payment_date) > new Date(cur.lastDate)) cur.lastDate = p.payment_date;
                  byHouse.set(p.household_id, cur);
                });
                const houseRows = Array.from(byHouse.entries())
                  .map(([hid, v]) => {
                    const h = households.find((x) => x.id === hid);
                    const assigned = yearAssigns.find((a) => a.household_id === hid)?.assigned_amount || 0;
                    return { h, assigned, ...v };
                  })
                  .filter((r) => r.h)
                  .sort((a, b) => (b.lastDate ? new Date(b.lastDate).getTime() : 0) - (a.lastDate ? new Date(a.lastDate).getTime() : 0));

                const isCurrentYear = year === String(new Date().getFullYear());

                return (
                  <motion.div
                    key={year}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card rounded-xl border border-border overflow-hidden"
                  >
                    <div className="bg-primary p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Calendar className="text-primary-foreground" size={24} />
                        <h3 className="text-2xl font-bold text-primary-foreground">वर्ष {year}</h3>
                      </div>
                      {isCurrentYear && (
                        <span className="px-3 py-1 bg-accent text-accent-foreground text-sm font-semibold rounded-full">चालू वर्ष</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
                      <Stat label="नियुक्त" value={fmtINR(totalAssigned)} color="violet" Icon={IndianRupee} />
                      <Stat label="एकूण जमा" value={fmtINR(totalIncome)} color="green" Icon={TrendingUp} />
                      <Stat label="एकूण खर्च" value={fmtINR(totalExpense)} color="red" Icon={TrendingDown} />
                      <Stat label="शिल्लक" value={fmtINR(balance)} color={balance >= 0 ? "blue" : "red"} Icon={Wallet} />
                    </div>

                    {houseRows.length > 0 && (
                      <div className="px-6 pb-6">
                        <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                          <User size={18} className="text-green-500" /> जमा तपशील ({houseRows.length} घरे)
                        </h4>
                        <div className="bg-secondary rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>घर क्र.</TableHead>
                                <TableHead>घरमालकाचे नाव</TableHead>
                                <TableHead className="text-right">नियुक्त</TableHead>
                                <TableHead className="text-right">दिलेली रक्कम</TableHead>
                                <TableHead className="text-right">बाकी</TableHead>
                                <TableHead>शेवटची तारीख</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {houseRows.map(({ h, assigned, paid, lastDate }) => {
                                const remaining = Math.max(0, assigned - paid);
                                return (
                                  <TableRow key={h!.id}>
                                    <TableCell className="font-medium">#{h!.house_code}</TableCell>
                                    <TableCell>{h!.head_name}</TableCell>
                                    <TableCell className="text-right text-muted-foreground">{fmtINR(assigned)}</TableCell>
                                    <TableCell className="text-right text-green-600 font-medium">{fmtINR(paid)}</TableCell>
                                    <TableCell className="text-right">
                                      {remaining > 0 ? <span className="text-red-600 font-medium">{fmtINR(remaining)}</span> : <span className="text-green-600">₹0</span>}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{fmtDate(lastDate)}</TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {yearExp.length > 0 && (
                      <div className="px-6 pb-6">
                        <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                          <FileText size={18} className="text-red-500" /> खर्चाचा तपशील
                        </h4>
                        <div className="bg-secondary rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>दिनांक</TableHead>
                                <TableHead>बाब</TableHead>
                                <TableHead className="text-right">रक्कम</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {yearExp.map((e) => (
                                <TableRow key={e.id}>
                                  <TableCell className="text-muted-foreground">{fmtDate(e.created_at)}</TableCell>
                                  <TableCell>{e.title}</TableCell>
                                  <TableCell className="text-right text-red-600 font-medium">{fmtINR(Number(e.amount))}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 hero-gradient">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
            <Wallet className="mx-auto text-accent" size={48} />
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground">विश्वासार्हता • पारदर्शकता • उत्तरदायित्व</h2>
            <p className="text-primary-foreground/70 leading-relaxed">
              आम्ही प्रत्येक रुपयाचा हिशोब ठेवतो आणि तो सार्वजनिक करतो. कोणताही खर्च गुप्त नाही. हे आमच्या चळवळीचे वैशिष्ट्य आहे.
            </p>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

const Stat = ({ label, value, color, Icon }: { label: string; value: string; color: "green" | "red" | "blue" | "violet"; Icon: any }) => {
  const tints: Record<string, string> = {
    green: "bg-green-50 dark:bg-green-900/20 text-green-600",
    red: "bg-red-50 dark:bg-red-900/20 text-red-600",
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600",
    violet: "bg-violet-50 dark:bg-violet-900/20 text-violet-600",
  };
  const bg: Record<string, string> = {
    green: "bg-green-500", red: "bg-red-500", blue: "bg-blue-500", violet: "bg-violet-500",
  };
  return (
    <div className={`${tints[color]} rounded-lg p-4 flex items-center gap-4`}>
      <div className={`w-12 h-12 ${bg[color]} rounded-full flex items-center justify-center flex-shrink-0`}>
        <Icon className="text-white" size={24} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-xl font-bold truncate">{value}</p>
      </div>
    </div>
  );
};

export default Accounts;
