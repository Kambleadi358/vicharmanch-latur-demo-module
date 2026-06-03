import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Archive, Download, AlertTriangle, CheckCircle2, Loader2, FileArchive, Printer, Lock } from "lucide-react";
import JSZip from "jszip";
import { logAdminAction } from "@/lib/activityLog";

interface ArchiveRow {
  id: string;
  year: string;
  archive_date: string;
  remark: string;
  summary: any;
  zip_path: string | null;
  created_by_email: string | null;
}

const AnnualArchiveManager = () => {
  const { user } = useAuth();
  const currentYear = String(new Date().getFullYear());
  const [year, setYear] = useState(currentYear);
  const [password, setPassword] = useState("");
  const [remark, setRemark] = useState("");
  const [busy, setBusy] = useState(false);
  const [validation, setValidation] = useState<{ key: string; label: string; count: number }[]>([]);
  const [archives, setArchives] = useState<ArchiveRow[]>([]);

  const loadArchives = async () => {
    const { data } = await supabase
      .from("archives")
      .select("*")
      .order("year", { ascending: false });
    setArchives((data as any) ?? []);
  };

  useEffect(() => { loadArchives(); }, []);

  const runValidation = async () => {
    setBusy(true);
    const [hh, mem, pay, prog, parts, win, expense, notice, sugg] = await Promise.all([
      supabase.from("households").select("id", { count: "exact", head: true }),
      supabase.from("household_members").select("id", { count: "exact", head: true }),
      supabase.from("donation_payments").select("id", { count: "exact", head: true }).eq("year", year),
      supabase.from("programs").select("id", { count: "exact", head: true }),
      supabase.from("participants").select("id", { count: "exact", head: true }),
      supabase.from("program_winners").select("id", { count: "exact", head: true }),
      supabase.from("account_expenses").select("id", { count: "exact", head: true }),
      supabase.from("notices").select("id", { count: "exact", head: true }),
      supabase.from("suggestions").select("id", { count: "exact", head: true }),
    ]);
    setValidation([
      { key: "households", label: "घरे", count: hh.count ?? 0 },
      { key: "members", label: "सदस्य", count: mem.count ?? 0 },
      { key: "donations", label: "देणगी नोंदी", count: pay.count ?? 0 },
      { key: "programs", label: "कार्यक्रम", count: prog.count ?? 0 },
      { key: "participants", label: "सहभागी", count: parts.count ?? 0 },
      { key: "winners", label: "विजेते", count: win.count ?? 0 },
      { key: "expenses", label: "खर्च नोंदी", count: expense.count ?? 0 },
      { key: "notices", label: "सूचना", count: notice.count ?? 0 },
      { key: "suggestions", label: "सुझाव", count: sugg.count ?? 0 },
    ]);
    setBusy(false);
  };

  useEffect(() => { runValidation(); /* eslint-disable-next-line */ }, [year]);

  const verifyPassword = async () => {
    if (!user?.email || !password) return false;
    const { error } = await supabase.auth.signInWithPassword({ email: user.email, password });
    return !error;
  };

  const handleArchive = async () => {
    if (!remark.trim()) { toast.error("कृपया अभिलेख टिप्पणी टाका"); return; }
    if (!password.trim()) { toast.error("पासवर्ड टाका"); return; }
    if (!confirm(`${year} वर्षाचा संपूर्ण अभिलेख तयार करायचा?\n\nनंतर त्या वर्षाच्या नोंदी फक्त वाचनासाठी राहतील.`)) return;

    setBusy(true);
    try {
      const ok = await verifyPassword();
      if (!ok) { toast.error("चुकीचा पासवर्ड"); setBusy(false); return; }

      // Fetch all data
      const [hh, mem, pay, assign, prog, parts, win, expense, notice, sugg, comps, entries, judges] = await Promise.all([
        supabase.from("households").select("*"),
        supabase.from("household_members").select("*"),
        supabase.from("donation_payments").select("*").eq("year", year),
        supabase.from("household_year_assignments").select("*").eq("year", year),
        supabase.from("programs").select("*"),
        supabase.from("participants").select("*"),
        supabase.from("program_winners").select("*"),
        supabase.from("account_expenses").select("*"),
        supabase.from("notices").select("*"),
        supabase.from("suggestions").select("*"),
        supabase.from("competitions").select("*"),
        supabase.from("competition_entries").select("*"),
        supabase.from("judges").select("*"),
      ]);

      const donations = pay.data ?? [];
      const expenses = expense.data ?? [];
      const totalIncome = donations.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
      const totalExpense = expenses.reduce((s: number, e: any) => s + Number(e.amount || 0), 0);

      const summary = {
        households: hh.data?.length ?? 0,
        members: mem.data?.length ?? 0,
        donations: donations.length,
        donations_total: totalIncome,
        expenses_total: totalExpense,
        balance: totalIncome - totalExpense,
        programs: prog.data?.length ?? 0,
        participants: parts.data?.length ?? 0,
        winners: win.data?.length ?? 0,
      };

      // Insert archive row
      const { data: archiveRow, error: archErr } = await supabase
        .from("archives")
        .insert({
          year,
          remark: remark.trim(),
          summary,
          created_by: user?.id ?? null,
          created_by_email: user?.email ?? null,
        })
        .select()
        .single();
      if (archErr) throw archErr;

      // Build ZIP
      const zip = new JSZip();
      const manifest = {
        organization: "भारतरत्न डॉ. बाबासाहेब आंबेडकर विचारमंच, लातूर",
        year, archive_date: new Date().toISOString(), remark, summary,
      };
      zip.file("manifest.json", JSON.stringify(manifest, null, 2));
      const data = zip.folder("data")!;
      data.file("households.json", JSON.stringify(hh.data, null, 2));
      data.file("household_members.json", JSON.stringify(mem.data, null, 2));
      data.file("donation_payments.json", JSON.stringify(donations, null, 2));
      data.file("household_year_assignments.json", JSON.stringify(assign.data, null, 2));
      data.file("programs.json", JSON.stringify(prog.data, null, 2));
      data.file("participants.json", JSON.stringify(parts.data, null, 2));
      data.file("program_winners.json", JSON.stringify(win.data, null, 2));
      data.file("account_expenses.json", JSON.stringify(expenses, null, 2));
      data.file("notices.json", JSON.stringify(notice.data, null, 2));
      data.file("suggestions.json", JSON.stringify(sugg.data, null, 2));
      data.file("competitions.json", JSON.stringify(comps.data, null, 2));
      data.file("competition_entries.json", JSON.stringify(entries.data, null, 2));
      data.file("judges.json", JSON.stringify(judges.data, null, 2));

      const blob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `Vicharmanch_Archive_${year}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);

      // Mark data as archived (read-only enforcement on supported tables)
      const tablesToFlag: Array<keyof any> = [
        "donation_payments",
        "programs",
        "participants",
        "prize_allocations",
        "quiz_sessions",
        "notices",
        "competition_entries",
        "account_expenses",
      ];
      // donation_payments: only the year
      await supabase.from("donation_payments").update({ is_archived: true, archived_year: year }).eq("year", year).eq("is_archived", false);
      for (const t of ["programs", "participants", "prize_allocations", "quiz_sessions", "notices", "competition_entries", "account_expenses", "suggestions"] as const) {
        await (supabase.from(t as any) as any).update({ is_archived: true, archived_year: year }).eq("is_archived", false);
      }

      // Carry-forward education promotion for new year
      await supabase.rpc("promote_education_levels" as any);

      logAdminAction("archive.create", "archive", archiveRow.id, { year, summary });
      toast.success(`${year} चा अभिलेख यशस्वीरित्या तयार झाला`);
      setPassword(""); setRemark("");
      loadArchives();
    } catch (e: any) {
      console.error(e);
      toast.error("अभिलेख तयार करताना त्रुटी: " + (e?.message ?? "unknown"));
    } finally {
      setBusy(false);
    }
  };

  const printCertificate = (a: ArchiveRow) => {
    const html = `<!doctype html><html lang="mr"><head><meta charset="utf-8"><title>वार्षिक अभिलेख ${a.year}</title>
    <style>
      body{font-family:'Tiro Devanagari Marathi','Noto Sans Devanagari',serif;padding:48px;color:#1e293b}
      h1{text-align:center;color:#1e3a8a;margin:0 0 4px}
      .sub{text-align:center;color:#475569;font-size:13px;margin-bottom:24px}
      .box{border:2px solid #1e3a8a;border-radius:8px;padding:24px;margin-top:16px}
      .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #cbd5e1}
      .row:last-child{border-bottom:0}
      .label{color:#475569;font-size:13px}
      .val{font-weight:bold;color:#1e3a8a}
      .footer{text-align:center;margin-top:32px;font-size:11px;color:#64748b}
      @media print{body{padding:24px}}
    </style></head><body>
    <h1>वार्षिक अभिलेख अहवाल</h1>
    <p class="sub">भारतरत्न डॉ. बाबासाहेब आंबेडकर विचारमंच, बौद्ध नगर, लातूर</p>
    <div class="box">
      <div class="row"><span class="label">वर्ष</span><span class="val">${a.year}</span></div>
      <div class="row"><span class="label">अभिलेख दिनांक</span><span class="val">${new Date(a.archive_date).toLocaleDateString("mr-IN")}</span></div>
      <div class="row"><span class="label">एकूण देणगी</span><span class="val">₹${(a.summary?.donations_total ?? 0).toLocaleString("en-IN")}</span></div>
      <div class="row"><span class="label">एकूण खर्च</span><span class="val">₹${(a.summary?.expenses_total ?? 0).toLocaleString("en-IN")}</span></div>
      <div class="row"><span class="label">शिल्लक</span><span class="val">₹${(a.summary?.balance ?? 0).toLocaleString("en-IN")}</span></div>
      <div class="row"><span class="label">कार्यक्रम</span><span class="val">${a.summary?.programs ?? 0}</span></div>
      <div class="row"><span class="label">सहभागी</span><span class="val">${a.summary?.participants ?? 0}</span></div>
      <div class="row"><span class="label">घरे</span><span class="val">${a.summary?.households ?? 0}</span></div>
      <div class="row"><span class="label">सदस्य</span><span class="val">${a.summary?.members ?? 0}</span></div>
    </div>
    <p style="margin-top:20px"><b>टिप्पणी:</b> ${a.remark.replace(/</g, "&lt;")}</p>
    <p class="footer">समता | स्वातंत्र्य | बंधुता | न्याय</p>
    <script>window.onload=()=>window.print();</script>
    </body></html>`;
    const w = window.open("", "_blank");
    if (!w) { toast.error("Pop-up blocked"); return; }
    w.document.write(html); w.document.close();
  };

  return (
    <div className="space-y-4">
      <Card className="border-amber-500/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Archive className="h-5 w-5 text-amber-600" /> वार्षिक अभिलेखागार
          </CardTitle>
          <CardDescription>
            हे कार्य पूर्ण वर्ष बंद करेल. पुढील वर्षासाठी नवीन कार्यक्षेत्र तयार होईल.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold">पुढील गोष्टी होतील:</p>
              <ul className="list-disc list-inside text-muted-foreground">
                <li>संपूर्ण वर्षाचा ZIP डाउनलोड</li>
                <li>त्या वर्षाच्या नोंदी फक्त वाचनासाठी (read-only)</li>
                <li>समाज नोंदणी पुढच्या वर्षात कायम राहेल</li>
                <li>शैक्षणिक पातळी आपोआप एक वर्ष पुढे होईल</li>
                <li>कार्यक्रम, देणगी, स्पर्धा नवीन वर्षासाठी रिकामे</li>
              </ul>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">वर्ष</Label>
              <Input value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">प्रशासक पासवर्ड *</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="आपला पासवर्ड पुष्टीसाठी टाका" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">अभिलेख टिप्पणी *</Label>
            <Textarea rows={2} value={remark} onChange={(e) => setRemark(e.target.value)}
              placeholder="उदा. भीमजयंती १३५ वर्षाचा वार्षिक अभिलेख" />
          </div>

          <div className="rounded-lg border p-3 bg-muted/30">
            <p className="text-xs font-semibold mb-2">पूर्व-तपासणी</p>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              {validation.map((v) => (
                <div key={v.key} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  <span>{v.label}: <b>{v.count}</b></span>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleArchive} disabled={busy} className="w-full bg-amber-600 hover:bg-amber-700">
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
            अभिलेख तयार करा व ZIP डाउनलोड करा
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileArchive className="h-4 w-4" /> अभिलेख इतिहास
            <Badge variant="outline">{archives.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {archives.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">अद्याप कोणताही अभिलेख नाही</div>
          ) : (
            <div className="divide-y">
              {archives.map((a) => (
                <div key={a.id} className="py-3 flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-500/15 text-amber-700 font-bold flex items-center justify-center text-xs">
                    {a.year}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{a.remark}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      देणगी ₹{(a.summary?.donations_total ?? 0).toLocaleString("en-IN")} • खर्च ₹{(a.summary?.expenses_total ?? 0).toLocaleString("en-IN")} • शिल्लक ₹{(a.summary?.balance ?? 0).toLocaleString("en-IN")}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{new Date(a.archive_date).toLocaleDateString("mr-IN")} • {a.created_by_email}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => printCertificate(a)}>
                    <Printer className="h-3.5 w-3.5 mr-1" /> प्रमाणपत्र
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnnualArchiveManager;
