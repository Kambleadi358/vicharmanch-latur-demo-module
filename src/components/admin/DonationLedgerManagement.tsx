import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Search, IndianRupee, Plus, Phone, Trash2, Loader2, MessageCircle,
  Copy, Printer, History, CheckCircle2, Clock, AlertCircle, Users2, MessageSquare, FileDown,
} from "lucide-react";
import { logAdminAction } from "@/lib/activityLog";
import logo from "@/assets/vicharmanch-logo.jpeg";
import stampImg from "@/assets/vicharmanch-stamp.png";

type PaymentMode = "cash" | "online";
const MODE_LABEL: Record<PaymentMode, string> = { cash: "रोख", online: "ऑनलाइन" };

interface Household {
  id: string; house_code: number; head_name: string; mobile: string;
}
interface Payment {
  id: string; household_id: string; year: string; amount: number;
  payment_date: string; payment_mode: PaymentMode; remark: string | null;
  created_at: string;
}
interface Assignment {
  household_id: string; year: string; assigned_amount: number;
}

const fmtINR = (n: number) => "₹" + new Intl.NumberFormat("en-IN").format(Math.round(n || 0));
const currentYear = String(new Date().getFullYear());

const DonationLedgerManagement = () => {
  const [year, setYear] = useState(currentYear);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "partial" | "completed">("all");
  const [loading, setLoading] = useState(true);
  const [detailHH, setDetailHH] = useState<Household | null>(null);

  const availableYears = useMemo(() => {
    const set = new Set<string>([currentYear]);
    payments.forEach((p) => set.add(p.year));
    assignments.forEach((a) => set.add(a.year));
    return Array.from(set).sort().reverse();
  }, [payments, assignments]);

  const loadAll = async () => {
    setLoading(true);
    const [{ data: hh }, { data: pays }, { data: assigns }] = await Promise.all([
      supabase.from("households").select("id, house_code, head_name, mobile").order("house_code"),
      supabase.from("donation_payments").select("*").order("payment_date", { ascending: false }),
      supabase.from("household_year_assignments").select("household_id, year, assigned_amount"),
    ]);
    setHouseholds((hh as any) || []);
    setPayments((pays as any) || []);
    setAssignments((assigns as any) || []);
    setLoading(false);
  };
  useEffect(() => { loadAll(); }, []);

  const enriched = households.map((h) => {
    const assigned = assignments.find((a) => a.household_id === h.id && a.year === year)?.assigned_amount || 0;
    const paid = payments
      .filter((p) => p.household_id === h.id && p.year === year)
      .reduce((s, p) => s + Number(p.amount), 0);
    const remaining = Math.max(0, assigned - paid);
    let status: "unassigned" | "pending" | "partial" | "completed";
    if (assigned === 0) status = "unassigned";
    else if (paid >= assigned) status = "completed";
    else if (paid === 0) status = "pending";
    else status = "partial";
    return { ...h, assigned, paid, remaining, status };
  });

  const filtered = enriched.filter((h) => {
    if (statusFilter !== "all" && h.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return h.head_name.toLowerCase().includes(q) || h.mobile.includes(q) || String(h.house_code).includes(q);
  });

  const totals = enriched.reduce(
    (acc, h) => {
      acc.assigned += h.assigned;
      acc.paid += h.paid;
      acc.remaining += h.remaining;
      return acc;
    },
    { assigned: 0, paid: 0, remaining: 0 },
  );

  const STATUS_STYLE = {
    completed: { c: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300", icon: CheckCircle2, label: "पूर्ण" },
    partial: { c: "bg-amber-500/15 text-amber-700 dark:text-amber-300", icon: Clock, label: "अर्धवट" },
    pending: { c: "bg-rose-500/15 text-rose-700 dark:text-rose-300", icon: AlertCircle, label: "प्रलंबित" },
    unassigned: { c: "bg-muted text-muted-foreground", icon: AlertCircle, label: "अनिर्धारित" },
  } as const;

  // Bulk-assign same amount to ALL households for the selected year (single click)
  const [bulkAmount, setBulkAmount] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const doBulkAssign = async () => {
    const num = Number(bulkAmount);
    if (!num || num <= 0) { toast.error("वैध रक्कम टाका"); return; }
    if (!confirm(`सर्व ${households.length} घरांना ${fmtINR(num)} नियुक्त करायचे? (विद्यमान नोंदी अपडेट होतील)`)) return;
    setBulkBusy(true);
    const rows = households.map((h) => ({ household_id: h.id, year, assigned_amount: num }));
    const { error } = await supabase.from("household_year_assignments").upsert(rows, { onConflict: "household_id,year" });
    setBulkBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success(`${households.length} घरांना ${fmtINR(num)} नियुक्त केले`);
      logAdminAction("bulk_assign_donation", "household_year_assignments", undefined, { year, amount: num, count: households.length });
      setBulkAmount("");
      loadAll();
    }
  };

  const exportPDF = () => {
    const rows = enriched
      .slice()
      .sort((a, b) => a.house_code - b.house_code);
    const tg = totals;
    const today = new Date().toLocaleDateString("mr-IN", { day: "numeric", month: "long", year: "numeric" });
    const html = `<!doctype html><html lang="mr"><head><meta charset="utf-8"><title>देणगी खातावही ${year}</title>
<style>
  @page { size: A4; margin: 12mm; }
  *{box-sizing:border-box}
  body{font-family:'Noto Sans Devanagari','Tiro Devanagari Marathi',system-ui,sans-serif;color:#0f172a;margin:0;padding:0}
  .hdr{display:flex;align-items:center;gap:14px;border-bottom:3px double #0c2340;padding-bottom:10px;margin-bottom:12px}
  .hdr img{width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid #c9a84c}
  .hdr h1{margin:0;font-size:16px;color:#0c2340}
  .hdr h2{margin:2px 0 0;font-size:12px;color:#64748b;font-weight:500}
  .meta{display:flex;justify-content:space-between;margin:8px 0 12px;font-size:11px;color:#475569}
  .totals{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:10px}
  .t{border:1px solid #e2e8f0;border-radius:6px;padding:6px 8px}
  .t b{display:block;font-size:10px;color:#64748b;font-weight:500}
  .t span{font-size:14px;font-weight:700;color:#0c2340}
  table{width:100%;border-collapse:collapse;font-size:10.5px}
  th,td{border:1px solid #cbd5e1;padding:5px 6px;text-align:left}
  th{background:#0c2340;color:#fff;font-weight:600}
  tr:nth-child(even) td{background:#f8fafc}
  .right{text-align:right}
  .ok{color:#059669;font-weight:600}
  .warn{color:#d97706;font-weight:600}
  .pend{color:#dc2626;font-weight:600}
  .ft{margin-top:14px;border-top:1px solid #cbd5e1;padding-top:8px;font-size:10px;color:#64748b;text-align:center}
  @media print { button { display:none } }
</style></head><body>
  <div class="hdr">
    <img src="${logo}" alt="logo"/>
    <div>
      <h1>भारतरत्न डॉ. बाबासाहेब आंबेडकर विचारमंच, लातूर</h1>
      <h2>बौद्ध नगर, लातूर · समता | स्वातंत्र्य | बंधुता | न्याय</h2>
    </div>
  </div>
  <div class="meta">
    <div><b>अहवाल:</b> देणगी खातावही — वर्ष ${year}</div>
    <div><b>दिनांक:</b> ${today}</div>
  </div>
  <div class="totals">
    <div class="t"><b>एकूण घरे</b><span>${enriched.length}</span></div>
    <div class="t"><b>नियुक्त रक्कम</b><span>${fmtINR(tg.assigned)}</span></div>
    <div class="t"><b>जमा रक्कम</b><span>${fmtINR(tg.paid)}</span></div>
    <div class="t"><b>शिल्लक रक्कम</b><span>${fmtINR(tg.remaining)}</span></div>
  </div>
  <table>
    <thead><tr>
      <th>घर क्र.</th><th>नाव</th><th>मोबाईल</th>
      <th class="right">नियुक्त</th><th class="right">जमा</th><th class="right">शिल्लक</th><th>स्थिती</th>
    </tr></thead>
    <tbody>
      ${rows.map((h) => `<tr>
        <td>#${h.house_code}</td>
        <td>${escapeHtml(h.head_name)}</td>
        <td>${escapeHtml(h.mobile)}</td>
        <td class="right">${fmtINR(h.assigned)}</td>
        <td class="right">${fmtINR(h.paid)}</td>
        <td class="right">${fmtINR(h.remaining)}</td>
        <td class="${h.status === "completed" ? "ok" : h.status === "partial" ? "warn" : "pend"}">${
          h.status === "completed" ? "पूर्ण" : h.status === "partial" ? "अर्धवट" : h.status === "pending" ? "प्रलंबित" : "अनिर्धारित"
        }</td>
      </tr>`).join("")}
    </tbody>
  </table>
  <div class="ft">हा अहवाल विचारमंच प्रणालीद्वारे स्वयं-निर्मित — पारदर्शकता, सातत्य, ऐतिहासिक जतन</div>
  <script>window.onload=()=>{setTimeout(()=>window.print(),300)}</script>
</body></html>`;
    const w = window.open("", "_blank");
    if (!w) { toast.error("Pop-up blocked"); return; }
    w.document.open(); w.document.write(html); w.document.close();
    logAdminAction("export_donation_ledger_pdf", "donation_payments", undefined, { year, rows: rows.length });
  };

  // basic HTML escaper
  function escapeHtml(s: string) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: "एकूण घरे", v: enriched.length, c: "from-blue-500 to-indigo-600" },
          { l: "नियुक्त रक्कम", v: fmtINR(totals.assigned), c: "from-violet-500 to-purple-600" },
          { l: "जमा रक्कम", v: fmtINR(totals.paid), c: "from-emerald-500 to-teal-600" },
          { l: "शिल्लक रक्कम", v: fmtINR(totals.remaining), c: "from-amber-500 to-orange-600" },
        ].map((s) => (
          <Card key={s.l} className="border-0 shadow-md overflow-hidden relative">
            <div className={`absolute inset-0 bg-gradient-to-br ${s.c} opacity-95`} />
            <CardContent className="relative p-3 text-white">
              <p className="text-[11px] opacity-90">{s.l}</p>
              <p className="text-lg sm:text-xl font-bold tracking-tight truncate">{s.v}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bulk assign card */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-3 flex items-end gap-2 flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <Label className="text-xs flex items-center gap-1.5 mb-1"><Users2 className="h-3 w-3" /> सर्वांना समान देणगी नियुक्त करा ({year})</Label>
            <Input type="number" inputMode="numeric" min={0} placeholder="उदा. 100"
              value={bulkAmount} onChange={(e) => setBulkAmount(e.target.value)} className="h-9" />
          </div>
          <Button onClick={doBulkAssign} disabled={bulkBusy || !bulkAmount}>
            {bulkBusy && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} सर्वांना नियुक्त
          </Button>
        </CardContent>
      </Card>


      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-base flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-primary" /> देणगी रजिस्टर ({year})
              <Badge variant="outline" className="ml-2">{filtered.length}</Badge>
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {availableYears.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">सर्व</SelectItem>
                  <SelectItem value="pending">प्रलंबित</SelectItem>
                  <SelectItem value="partial">अर्धवट</SelectItem>
                  <SelectItem value="completed">पूर्ण</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={exportPDF} className="h-9">
                <FileDown className="h-4 w-4 mr-1" /> PDF अहवाल
              </Button>
            </div>
          </div>
          <div className="relative mt-2">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="नाव, मोबाईल किंवा घर क्रमांकाने शोधा..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">लोड होत आहे...</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {households.length === 0
                ? "प्रथम 'समाज नोंदणी' मध्ये घरे जोडा"
                : "जुळणारी नोंद नाही"}
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((h) => {
                const S = STATUS_STYLE[h.status];
                const SIcon = S.icon;
                return (
                  <button key={h.id}
                    onClick={() => setDetailHH(h)}
                    className="w-full flex items-center gap-3 py-3 hover:bg-muted/40 -mx-2 px-2 rounded-lg text-left transition-colors"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0 text-xs">
                      #{h.house_code}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{h.head_name}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{h.mobile}</span>
                        <span>•</span>
                        <span>नियुक्त {fmtINR(h.assigned)}</span>
                        <span>•</span>
                        <span>जमा {fmtINR(h.paid)}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${S.c}`}>
                        <SIcon className="h-3 w-3" /> {S.label}
                      </span>
                      <div className="text-[11px] mt-1 text-muted-foreground">शिल्लक {fmtINR(h.remaining)}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {detailHH && (
        <LedgerDialog
          household={detailHH}
          year={year}
          allPayments={payments.filter((p) => p.household_id === detailHH.id)}
          assignment={assignments.find((a) => a.household_id === detailHH.id && a.year === year)}
          onClose={() => setDetailHH(null)}
          onChanged={loadAll}
        />
      )}
    </div>
  );
};

// ----------------- Ledger / Payment History Dialog -----------------
const LedgerDialog = ({ household, year, allPayments, assignment, onClose, onChanged }: {
  household: Household; year: string;
  allPayments: Payment[]; assignment?: Assignment;
  onClose: () => void; onChanged: () => void;
}) => {
  const [filterYear, setFilterYear] = useState<string>(year);
  const [showAdd, setShowAdd] = useState(false);
  const [assignedDraft, setAssignedDraft] = useState(String(assignment?.assigned_amount || ""));
  const [savingAssigned, setSavingAssigned] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Payment | null>(null);

  const years = useMemo(() => {
    const set = new Set<string>([year, currentYear]);
    allPayments.forEach((p) => set.add(p.year));
    return Array.from(set).sort().reverse();
  }, [year, allPayments]);

  const yearPayments = allPayments.filter((p) => p.year === filterYear);
  const yearPaid = yearPayments.reduce((s, p) => s + Number(p.amount), 0);
  const yearAssigned = filterYear === year
    ? assignment?.assigned_amount || 0
    : 0; // for past years we still show payments; assignment lookup omitted for brevity
  const remaining = Math.max(0, yearAssigned - yearPaid);
  const status: "completed" | "partial" | "pending" | "unassigned" =
    yearAssigned === 0 ? "unassigned"
    : yearPaid >= yearAssigned ? "completed"
    : yearPaid === 0 ? "pending" : "partial";

  const saveAssigned = async () => {
    const num = Number(assignedDraft);
    if (isNaN(num) || num < 0) { toast.error("वैध रक्कम टाका"); return; }
    setSavingAssigned(true);
    const { error } = await supabase
      .from("household_year_assignments")
      .upsert({ household_id: household.id, year, assigned_amount: num }, { onConflict: "household_id,year" });
    setSavingAssigned(false);
    if (error) toast.error("त्रुटी: " + error.message);
    else {
      toast.success("नियुक्त रक्कम जतन");
      logAdminAction("assign_donation", "household_year_assignments", household.id, { year, amount: num });
      onChanged();
    }
  };

  const deletePayment = async (p: Payment) => {
    const { error } = await supabase.from("donation_payments").delete().eq("id", p.id);
    if (error) toast.error("त्रुटी: " + error.message);
    else {
      toast.success("नोंद हटवली");
      logAdminAction("delete_donation_payment", "donation_payments", p.id, { amount: p.amount, year: p.year });
      onChanged();
    }
    setConfirmDel(null);
  };

  // WhatsApp / SMS templates
  const ambedkarYear = new Date().getFullYear() - 1891;
  const completedMsg =
`नमस्कार ${household.head_name},
भारतीय राज्यघटनेचे शिल्पकार, महामानव, बोधिसत्व, भारतरत्न डॉ. बाबासाहेब आंबेडकर यांच्या ${ambedkarYear} व्या जयंतीसाठी आपली देणगी रक्कम रुपये ${fmtINR(yearPaid).replace("₹", "")} विचारमंचाकडे पूर्ण प्राप्त झाली आहे.
एकूण रक्कम: ${fmtINR(yearPaid)}

धन्यवाद.
भारतरत्न डॉ. बाबासाहेब आंबेडकर विचारमंच
बौद्ध नगर, लातूर
समता | स्वातंत्र्य | बंधुता | न्याय`;

  const pendingMsg =
`नमस्कार ${household.head_name},
प. पू. डॉ. बाबासाहेब आंबेडकर यांच्या जयंती निमित्त आपल्यावर भारतरत्न डॉ. बाबासाहेब आंबेडकर विचारमंच कडे रुपये ${fmtINR(remaining).replace("₹", "")} देणगी देणे बाकी आहे.
कृपया ते लवकरात लवकर जमा करावे.

जर आपण आधीच रक्कम भरली असेल तर कृपया या संदेशाकडे दुर्लक्ष करावे.

धन्यवाद.
भारतरत्न डॉ. बाबासाहेब आंबेडकर विचारमंच
बौद्ध नगर, लातूर
समता | स्वातंत्र्य | बंधुता | न्याय`;

  const msg = status === "completed" ? completedMsg : pendingMsg;
  const waLink = `https://wa.me/91${household.mobile}?text=${encodeURIComponent(msg)}`;
  const smsLink = `sms:+91${household.mobile}?body=${encodeURIComponent(msg)}`;

  const copyMsg = async () => {
    await navigator.clipboard.writeText(msg);
    toast.success("संदेश कॉपी झाला");
  };

  const printStatement = () => window.print();

  return (
    <Dialog open onOpenChange={(b) => !b && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto print:max-w-full print:shadow-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" /> देणगी इतिहास — #{household.house_code} {household.head_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Assigned amount for current year */}
          <div className="rounded-lg border p-3 bg-muted/30 print:hidden">
            <Label className="text-xs mb-1.5 block">नियुक्त (पावती) रक्कम — {year}</Label>
            <div className="flex gap-2">
              <Input
                type="number" inputMode="numeric" min={0}
                value={assignedDraft}
                onChange={(e) => setAssignedDraft(e.target.value)}
                className="h-9"
              />
              <Button size="sm" onClick={saveAssigned} disabled={savingAssigned}>
                {savingAssigned && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} जतन
              </Button>
            </div>
          </div>

          {/* Year selector for history view */}
          <div className="flex items-center gap-2 flex-wrap">
            <Label className="text-xs">वर्ष:</Label>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Badge variant="outline">{yearPayments.length} नोंदी</Badge>
            <div className="flex-1" />
            <Button size="sm" variant="outline" onClick={printStatement} className="print:hidden">
              <Printer className="h-4 w-4 mr-1" /> प्रिंट
            </Button>
            <Button size="sm" onClick={() => setShowAdd(true)} className="print:hidden">
              <Plus className="h-4 w-4 mr-1" /> देणगी
            </Button>
          </div>

          {/* Payments table */}
          <div className="border rounded-lg overflow-hidden">
            {yearPayments.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">या वर्षात कोणतीही देणगी नाही</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs">
                  <tr>
                    <th className="text-left p-2">दिनांक</th>
                    <th className="text-right p-2">रक्कम</th>
                    <th className="text-left p-2">पद्धत</th>
                    <th className="text-left p-2 hidden sm:table-cell">टीप</th>
                    <th className="p-2 print:hidden"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {yearPayments.map((p) => (
                    <tr key={p.id}>
                      <td className="p-2">{new Date(p.payment_date).toLocaleDateString("mr-IN")}</td>
                      <td className="p-2 text-right font-semibold">{fmtINR(Number(p.amount))}</td>
                      <td className="p-2"><Badge variant="outline" className="text-[10px]">{MODE_LABEL[p.payment_mode]}</Badge></td>
                      <td className="p-2 hidden sm:table-cell text-xs text-muted-foreground truncate max-w-[180px]">{p.remark}</td>
                      <td className="p-2 print:hidden">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                          onClick={() => setConfirmDel(p)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/30 font-semibold">
                    <td className="p-2">एकूण</td>
                    <td className="p-2 text-right">{fmtINR(yearPaid)}</td>
                    <td colSpan={3}></td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* Summary */}
          <div className="text-sm grid grid-cols-3 gap-2">
            <div className="rounded p-2 bg-muted/30">नियुक्त<br /><b>{fmtINR(yearAssigned)}</b></div>
            <div className="rounded p-2 bg-muted/30">जमा<br /><b>{fmtINR(yearPaid)}</b></div>
            <div className="rounded p-2 bg-muted/30">शिल्लक<br /><b>{fmtINR(remaining)}</b></div>
          </div>

          {/* Message template */}
          {(status === "completed" || status === "pending" || status === "partial") && (
            <div className="rounded-lg border p-3 bg-card print:hidden">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-semibold">
                  {status === "completed" ? "धन्यवाद संदेश" : "स्मरण संदेश"}
                </Label>
                <div className="flex gap-1 flex-wrap">
                  <Button size="sm" variant="outline" onClick={copyMsg}>
                    <Copy className="h-3.5 w-3.5 mr-1" /> कॉपी
                  </Button>
                  <Button size="sm" asChild variant="outline">
                    <a href={smsLink}>
                      <MessageSquare className="h-3.5 w-3.5 mr-1" /> SMS
                    </a>
                  </Button>
                  <Button size="sm" asChild className="bg-green-600 hover:bg-green-700 text-white">
                    <a href={waLink} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-3.5 w-3.5 mr-1" /> WhatsApp
                    </a>
                  </Button>
                </div>
              </div>
              <pre className="text-[11px] whitespace-pre-wrap bg-muted/40 rounded p-2 max-h-40 overflow-y-auto">{msg}</pre>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>बंद</Button>
        </DialogFooter>

        {showAdd && (
          <AddPaymentDialog
            household={household} year={year}
            onClose={() => setShowAdd(false)}
            onSaved={() => { setShowAdd(false); onChanged(); }}
          />
        )}

        <AlertDialog open={!!confirmDel} onOpenChange={(b) => !b && setConfirmDel(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>देणगी नोंद हटवायची?</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmDel && `${fmtINR(Number(confirmDel.amount))} • ${new Date(confirmDel.payment_date).toLocaleDateString("mr-IN")}`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>रद्द</AlertDialogCancel>
              <AlertDialogAction onClick={() => confirmDel && deletePayment(confirmDel)} className="bg-destructive">हटवा</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};

// ----------------- Add Payment Dialog -----------------
const AddPaymentDialog = ({ household, year, onClose, onSaved }: {
  household: Household; year: string;
  onClose: () => void; onSaved: () => void;
}) => {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [mode, setMode] = useState<PaymentMode>("cash");
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const num = Number(amount);
    if (!num || num <= 0) { toast.error("वैध रक्कम टाका"); return; }
    setSaving(true);
    const { error } = await supabase.from("donation_payments").insert({
      household_id: household.id, year, amount: num,
      payment_date: date, payment_mode: mode, remark: remark.trim() || null,
    });
    setSaving(false);
    if (error) toast.error("त्रुटी: " + error.message);
    else {
      toast.success("देणगी नोंद जतन");
      logAdminAction("create_donation_payment", "donation_payments", undefined, { household_id: household.id, year, amount: num, mode });
      onSaved();
    }
  };

  return (
    <Dialog open onOpenChange={(b) => !b && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>नवीन देणगी — {household.head_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">रक्कम (₹) *</Label>
            <Input type="number" inputMode="numeric" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">दिनांक *</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">पद्धत *</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as PaymentMode)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">रोख</SelectItem>
                <SelectItem value="online">ऑनलाइन</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">टीप (वैकल्पिक)</Label>
            <Textarea rows={2} value={remark} onChange={(e) => setRemark(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>रद्द</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} जतन
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DonationLedgerManagement;
