import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Receipt, IndianRupee, TrendingUp, TrendingDown, Wallet, Eraser } from "lucide-react";
import { logAdminAction } from "@/lib/activityLog";

interface Expense { id: string; year: string; title: string; amount: number; created_at: string; }

const fmtINR = (n: number) => "₹" + new Intl.NumberFormat("en-IN").format(Math.round(n || 0));
const currentYear = String(new Date().getFullYear());

const LedgerExpenses = () => {
  const [year, setYear] = useState(currentYear);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [donationsTotal, setDonationsTotal] = useState(0);
  const [assignedTotal, setAssignedTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Expense | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: ex }, { data: pays }, { data: assigns }] = await Promise.all([
      (supabase as any).from("ledger_expenses").select("*").order("created_at", { ascending: false }),
      supabase.from("donation_payments").select("year, amount"),
      supabase.from("household_year_assignments").select("year, assigned_amount"),
    ]);
    setExpenses((ex as any) || []);
    const dt = (pays || []).filter((p: any) => p.year === year).reduce((s: number, p: any) => s + Number(p.amount), 0);
    const at = (assigns || []).filter((a: any) => a.year === year).reduce((s: number, a: any) => s + Number(a.assigned_amount), 0);
    setDonationsTotal(dt);
    setAssignedTotal(at);
    setLoading(false);
  };
  useEffect(() => { load(); }, [year]);

  const years = useMemo(() => {
    const set = new Set<string>([currentYear, year]);
    expenses.forEach((e) => set.add(e.year));
    return Array.from(set).sort().reverse();
  }, [expenses, year]);

  const yearExpenses = expenses.filter((e) => e.year === year);
  const totalExpense = yearExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const balance = donationsTotal - totalExpense;

  const handleAdd = async () => {
    if (!title.trim() || !Number(amount) || Number(amount) <= 0) {
      toast.error("शीर्षक व वैध रक्कम आवश्यक");
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any).from("ledger_expenses").insert({
      year, title: title.trim(), amount: Number(amount),
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("खर्च जोडला");
      logAdminAction("create_ledger_expense", "ledger_expenses", undefined, { year, title: title.trim(), amount: Number(amount) });
      setTitle(""); setAmount(""); load();
    }
  };

  const handleDelete = async (e: Expense) => {
    const { error } = await (supabase as any).from("ledger_expenses").delete().eq("id", e.id);
    if (error) toast.error(error.message);
    else {
      toast.success("खर्च हटवला");
      logAdminAction("delete_ledger_expense", "ledger_expenses", e.id, { year: e.year, amount: e.amount });
      load();
    }
    setConfirmDel(null);
  };

  const handleClearYear = async () => {
    const { error } = await (supabase as any).from("ledger_expenses").delete().eq("year", year);
    if (error) toast.error(error.message);
    else {
      toast.success(`${year} चे सर्व खर्च हटवले`);
      logAdminAction("clear_ledger_expenses", "ledger_expenses", undefined, { year });
      load();
    }
    setConfirmClear(false);
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="नियुक्त देणगी" value={fmtINR(assignedTotal)} color="from-violet-500 to-purple-600" Icon={IndianRupee} />
        <SummaryCard label="एकूण जमा" value={fmtINR(donationsTotal)} color="from-emerald-500 to-teal-600" Icon={TrendingUp} />
        <SummaryCard label="एकूण खर्च" value={fmtINR(totalExpense)} color="from-rose-500 to-pink-600" Icon={TrendingDown} />
        <SummaryCard label="शिल्लक" value={fmtINR(balance)} color={balance >= 0 ? "from-blue-500 to-indigo-600" : "from-red-500 to-rose-700"} Icon={Wallet} />
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" /> खर्च नोंदी ({year})
              <Badge variant="outline" className="ml-1">{yearExpenses.length}</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" className="text-destructive" onClick={() => setConfirmClear(true)} disabled={yearExpenses.length === 0}>
                <Eraser className="h-4 w-4 mr-1" /> सर्व हटवा
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add expense */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_auto] gap-2 items-end p-3 rounded-lg bg-muted/30">
            <div className="space-y-1.5">
              <Label className="text-xs">शीर्षक (बाब) *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="उदा. मंडप व्यवस्था" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">रक्कम (₹) *</Label>
              <Input type="number" inputMode="numeric" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} className="h-9" />
            </div>
            <Button onClick={handleAdd} disabled={saving} className="h-9">
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} <Plus className="h-4 w-4 mr-1" /> जोडा
            </Button>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">लोड होत आहे...</div>
            ) : yearExpenses.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">या वर्षात कोणताही खर्च नोंदवलेला नाही</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs">
                  <tr>
                    <th className="text-left p-2">दिनांक</th>
                    <th className="text-left p-2">बाब</th>
                    <th className="text-right p-2">रक्कम</th>
                    <th className="p-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {yearExpenses.map((e) => (
                    <tr key={e.id}>
                      <td className="p-2 text-xs text-muted-foreground">{new Date(e.created_at).toLocaleDateString("mr-IN")}</td>
                      <td className="p-2">{e.title}</td>
                      <td className="p-2 text-right font-semibold text-rose-600">{fmtINR(Number(e.amount))}</td>
                      <td className="p-2">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setConfirmDel(e)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/30 font-semibold">
                    <td colSpan={2} className="p-2">एकूण खर्च</td>
                    <td className="p-2 text-right">{fmtINR(totalExpense)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmDel} onOpenChange={(b) => !b && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>खर्च हटवायचा?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDel && `${confirmDel.title} • ${fmtINR(Number(confirmDel.amount))}`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>रद्द</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDel && handleDelete(confirmDel)} className="bg-destructive">हटवा</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{year} चे सर्व खर्च हटवायचे?</AlertDialogTitle>
            <AlertDialogDescription>
              ही क्रिया परत करता येणार नाही. एकूण {yearExpenses.length} नोंदी हटवल्या जातील.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>रद्द</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearYear} className="bg-destructive">सर्व हटवा</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const SummaryCard = ({ label, value, color, Icon }: { label: string; value: string; color: string; Icon: any }) => (
  <Card className="border-0 shadow-md overflow-hidden relative">
    <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-95`} />
    <CardContent className="relative p-3 text-white">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-3.5 w-3.5 opacity-90" />
        <p className="text-[11px] opacity-90">{label}</p>
      </div>
      <p className="text-lg sm:text-xl font-bold tracking-tight truncate">{value}</p>
    </CardContent>
  </Card>
);

export default LedgerExpenses;
