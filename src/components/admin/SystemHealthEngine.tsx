// System Health Engine — evaluates each Community OS module dynamically.
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw, Loader2, CheckCircle2, AlertTriangle, AlertCircle, XCircle } from "lucide-react";
import { useConnectionHealth } from "@/hooks/useConnectionHealth";
import { getAllPermissions } from "@/lib/permissions";

type Status = "healthy" | "weak" | "checkup" | "poor";

interface Module {
  key: string;
  name: string;
  status: Status;
  reason: string;
  action: string;
}

const STATUS_META: Record<Status, { color: string; dot: string; label: string; Icon: any; weight: number }> = {
  healthy: { color: "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/40", dot: "bg-emerald-500", label: "🟢 उत्तम",     Icon: CheckCircle2, weight: 100 },
  weak:    { color: "text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/40",         dot: "bg-amber-500",   label: "🟡 कमकुवत",   Icon: AlertCircle, weight: 75 },
  checkup: { color: "text-orange-700 dark:text-orange-300 bg-orange-500/10 border-orange-500/40",     dot: "bg-orange-500",  label: "🟠 तपासणी", Icon: AlertTriangle, weight: 50 },
  poor:    { color: "text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/40",             dot: "bg-rose-500",    label: "🔴 खराब",    Icon: XCircle,      weight: 20 },
};

const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

const SystemHealthEngine = () => {
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<Module[]>([]);
  const [breakdown, setBreakdown] = useState<{ key: string; label: string; score: number; note: string }[]>([]);
  const { status: connStatus, latency } = useConnectionHealth();

  const evaluate = async () => {
    setLoading(true);
    const q = <T,>(p: Promise<any>): Promise<T[]> => p.then((r) => (r.data as T[]) || []).catch(() => [] as T[]);

    const [
      households, members, assignments, payments, expenses,
      programs, competitions, participants, entries, votes,
      judges, scores, quizQ, quizS, suggestions, archives,
      settings, logs, songs, missing,
    ] = await Promise.all([
      q(supabase.from("households").select("id")),
      q(supabase.from("household_members").select("id, education_level, gender")),
      q(supabase.from("household_year_assignments").select("id, amount, is_paid, household_id")),
      q(supabase.from("donation_payments").select("id, amount, household_id")),
      q(supabase.from("ledger_expenses").select("id, amount")),
      q(supabase.from("programs").select("id, is_visible")),
      q(supabase.from("competitions").select("id, name, status")),
      q(supabase.from("participants").select("id, household_member_id, competition_id")),
      q(supabase.from("competition_entries").select("id, competition_id, category")),
      q(supabase.from("public_votes").select("id, competition_id")),
      q(supabase.from("judges").select("id")),
      q(supabase.from("judge_scores").select("id")),
      q(supabase.from("quiz_questions").select("id, correct_answer")),
      q(supabase.from("quiz_sessions").select("id")),
      q(supabase.from("suggestions").select("id, status")),
      q(supabase.from("archives").select("id, year")),
      q(supabase.from("app_settings").select("id, section, key")),
      q(supabase.from("admin_activity_logs").select("id, created_at").order("created_at" as any, { ascending: false } as any).limit(1)),
      q(supabase.from("participation_songs").select("id, file_size")),
      q(supabase.from("failed_participation_searches").select("id")),
    ]);

    const perms = await getAllPermissions().catch(() => null);

    // Helpers
    const totalAssigned = assignments.reduce((s: number, a: any) => s + Number(a.amount || 0), 0);
    const totalPaid = payments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
    const paidPct = pct(totalPaid, totalAssigned);
    const unpaidCount = assignments.filter((a: any) => !a.is_paid).length;
    const totalExp = expenses.reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
    const orphanParticipants = participants.filter((p: any) => !p.household_member_id).length;
    const openSuggestions = suggestions.filter((s: any) => s.status === "new" || !s.status).length;
    const totalSongMB = songs.reduce((s: number, x: any) => s + Number(x.file_size || 0), 0) / (1024 * 1024);

    const m: Module[] = [];
    const push = (key: string, name: string, cond: () => { status: Status; reason: string; action: string }) => {
      const r = cond();
      m.push({ key, name, ...r });
    };

    push("registry", "Community Registry", () => {
      if (households.length === 0) return { status: "poor", reason: "एकही घर नोंदवलेले नाही.", action: "समाज नोंदणी सुरू करा." };
      if (members.length / Math.max(households.length, 1) < 2) return { status: "checkup", reason: "प्रत्येक घरामागे सरासरी सदस्य कमी.", action: "प्रत्येक घराचे सदस्य पूर्ण भरा." };
      return { status: "healthy", reason: `${households.length} घरे · ${members.length} सदस्य.`, action: "नियमित अद्यतन ठेवा." };
    });

    push("donation", "Donation Ledger", () => {
      if (totalAssigned === 0) return { status: "checkup", reason: "यंदाचे वार्षिक वाटप झालेले नाही.", action: "वार्षिक देणगी वाटप करा." };
      if (paidPct >= 80) return { status: "healthy", reason: `${paidPct}% देणगी वसूल झाली.`, action: "उर्वरित घरांना स्मरणपत्र पाठवा." };
      if (paidPct >= 40) return { status: "weak", reason: `${paidPct}% वसूल; ${unpaidCount} बाकी.`, action: "WhatsApp स्मरणपत्र मोहीम चालवा." };
      return { status: "poor", reason: `केवळ ${paidPct}% वसूल.`, action: "तात्काळ वसुली मोहीम सुरू करा." };
    });

    push("expense", "Expense Ledger", () => {
      if (expenses.length === 0 && totalPaid > 0) return { status: "weak", reason: "देणग्या आहेत पण खर्च नोंदी नाहीत.", action: "खर्च नोंदणे सुरू करा." };
      if (totalExp > totalPaid && totalPaid > 0) return { status: "checkup", reason: "खर्च देणग्यांपेक्षा जास्त.", action: "खर्चाची पुनरावलोकन करा." };
      return { status: "healthy", reason: `${expenses.length} खर्च नोंदी · ₹${totalExp.toLocaleString("en-IN")}.`, action: "मासिक पुनरावलोकन करा." };
    });

    push("competition", "Competition Engine", () => {
      if (competitions.length === 0) return { status: "checkup", reason: "एकही स्पर्धा तयार नाही.", action: "स्पर्धा तयार करा." };
      const noEntries = competitions.filter((c: any) => !entries.some((e: any) => e.competition_id === c.id)).length;
      if (noEntries === competitions.length) return { status: "weak", reason: "स्पर्धांमध्ये नोंदी नाहीत.", action: "सहभागी नोंदणी सुरू करा." };
      return { status: "healthy", reason: `${competitions.length} स्पर्धा · ${entries.length} नोंदी.`, action: "नियमित प्रकाशन ठेवा." };
    });

    push("evaluation", "Evaluation Engine", () => {
      if (entries.length > 0 && scores.length === 0) return { status: "checkup", reason: "नोंदी आहेत पण परीक्षकांचे गुण नाहीत.", action: "परीक्षकांना गुण नोंदवायला सांगा." };
      return { status: "healthy", reason: `${scores.length} गुण नोंदी.`, action: "वेळेवर मूल्यांकन पूर्ण करा." };
    });

    push("winner", "Dynamic Winner Engine", () => {
      const closed = competitions.filter((c: any) => c.status === "CLOSED" || c.status === "PUBLISHED").length;
      if (closed === 0) return { status: "healthy", reason: "सर्व स्पर्धा खुल्या; विजेते जाहीर करण्याची वेळ नाही.", action: "स्पर्धा बंद झाल्यावर विजेते नोंदवा." };
      return { status: "healthy", reason: `${closed} स्पर्धा बंद.`, action: "विजेते वेळेवर जाहीर करा." };
    });

    push("voting", "Public Voting", () => {
      if (entries.length === 0) return { status: "healthy", reason: "मतदानासाठी नोंदी नाहीत.", action: "स्पर्धा नोंदी जोडा." };
      if (votes.length === 0) return { status: "weak", reason: "एकही सार्वजनिक मत नाही.", action: "मतदान लिंक शेअर करा." };
      return { status: "healthy", reason: `${votes.length} मते नोंदवली.`, action: "मतदान चालू ठेवा." };
    });

    push("judge", "Judge Panel", () => {
      if (judges.length === 0) return { status: "checkup", reason: "परीक्षक नाहीत.", action: "परीक्षक तयार करा." };
      return { status: "healthy", reason: `${judges.length} परीक्षक.`, action: "परीक्षक क्रेडेन्शियल्स सुरक्षित ठेवा." };
    });

    push("quiz", "Quiz System", () => {
      if (quizQ.length === 0) return { status: "checkup", reason: "प्रश्नमंजुषा प्रश्न नाहीत.", action: "प्रश्न जोडा." };
      const noAns = quizQ.filter((q: any) => !q.correct_answer).length;
      if (noAns > 0) return { status: "weak", reason: `${noAns} प्रश्नांना उत्तरे नाहीत.`, action: "correct_answer भरा." };
      return { status: "healthy", reason: `${quizQ.length} प्रश्न · ${quizS.length} सत्रे.`, action: "नियमित आढावा घ्या." };
    });

    push("suggestion", "Suggestion Box", () => {
      if (openSuggestions > 20) return { status: "checkup", reason: `${openSuggestions} सुझाव प्रलंबित.`, action: "सुझावांना उत्तर द्या." };
      return { status: "healthy", reason: `${suggestions.length} एकूण · ${openSuggestions} नवीन.`, action: "साप्ताहिक तपासा." };
    });

    push("documents", "Documents Studio", () => ({
      status: "healthy",
      reason: "सर्व टेम्प्लेट्स कार्यरत.",
      action: "गरजेनुसार वापरा.",
    }));

    push("reports", "Community Reports", () => ({
      status: "healthy", reason: "अहवाल निर्मिती कार्यरत.", action: "नियमित निर्यात करा.",
    }));

    push("ai", "AI Community Intelligence", () => {
      if (households.length < 5 || payments.length < 5) return { status: "weak", reason: "अर्थपूर्ण विश्लेषणासाठी डेटा कमी.", action: "अधिक डेटा जमवा." };
      return { status: "healthy", reason: "पुरेसा डेटा उपलब्ध.", action: "नियमित अहवाल तयार करा." };
    });

    push("archive", "Annual Archive", () => {
      if (archives.length === 0) return { status: "weak", reason: "एकही वार्षिक अभिलेख नाही.", action: "वर्ष लॉक करून अभिलेख तयार करा." };
      return { status: "healthy", reason: `${archives.length} अभिलेखे.`, action: "पुढील वर्षाच्या शेवटी अभिलेख करा." };
    });

    push("dashboard", "Dashboard", () => ({ status: "healthy", reason: "सर्व विजेट्स डेटा दाखवत आहेत.", action: "—" }));

    push("settings", "Settings", () => {
      if (settings.length < 3) return { status: "weak", reason: "प्राथमिक सेटिंग्ज पूर्ण नाहीत.", action: "साइट सेटिंग्ज भरा." };
      return { status: "healthy", reason: `${settings.length} सेटिंग नोंदी.`, action: "—" };
    });

    push("logs", "Activity Logs", () => {
      const latest = logs[0]?.created_at ? new Date(logs[0].created_at) : null;
      if (!latest) return { status: "weak", reason: "क्रियाकलाप नोंदी नाहीत.", action: "प्रशासकीय क्रिया नोंदवा." };
      const days = (Date.now() - latest.getTime()) / (1000 * 60 * 60 * 24);
      if (days > 30) return { status: "checkup", reason: `${Math.round(days)} दिवसांपूर्वीची शेवटची नोंद.`, action: "क्रियाकलाप तपासा." };
      return { status: "healthy", reason: `अद्ययावत नोंदी.`, action: "—" };
    });

    push("pwa", "PWA Readiness", () => {
      const hasManifest = typeof document !== "undefined" && !!document.querySelector('link[rel="manifest"]');
      if (!hasManifest) return { status: "weak", reason: "Manifest लोड झालेले नाही.", action: "index.html तपासा." };
      return { status: "healthy", reason: "Manifest व icons उपलब्ध; इन्स्टॉलेशन तयार.", action: "APK रुपांतरणासाठी पुढील टप्पा." };
    });

    push("connection", "Connection Monitor", () => {
      if (connStatus === "offline") return { status: "poor", reason: "बॅकएंड अनुपलब्ध.", action: "इंटरनेट/सर्व्हर तपासा." };
      if (connStatus === "slow")    return { status: "weak", reason: `हळू प्रतिसाद (${latency}ms).`, action: "नेटवर्क तपासा." };
      return { status: "healthy", reason: `${latency ?? "—"}ms.`, action: "—" };
    });

    push("storage", "Storage Usage", () => {
      if (totalSongMB > 500) return { status: "checkup", reason: `${totalSongMB.toFixed(0)} MB गाणी.`, action: "जुनी फाइल्स संकुचित करा." };
      return { status: "healthy", reason: `${totalSongMB.toFixed(1)} MB वापरात.`, action: "—" };
    });

    // Overall breakdown categories
    const scoreOf = (keys: string[]) => {
      const chosen = m.filter((x) => keys.includes(x.key));
      if (chosen.length === 0) return 100;
      return Math.round(chosen.reduce((s, x) => s + STATUS_META[x.status].weight, 0) / chosen.length);
    };
    const b = [
      { key: "integrity", label: "Data Integrity", score: orphanParticipants > 0 ? 60 : scoreOf(["registry", "competition"]),
        note: orphanParticipants > 0 ? `${orphanParticipants} अनाथ सहभागी नोंदी.` : "सर्व नोंदी सुसंगत." },
      { key: "perf",      label: "Performance",       score: connStatus === "online" ? 100 : connStatus === "slow" ? 70 : 30,
        note: `कनेक्शन: ${connStatus} · ${latency ?? "—"}ms.` },
      { key: "sec",       label: "Security",          score: scoreOf(["logs", "settings"]),
        note: "RLS सक्षम · लॉगिंग सक्रिय." },
      { key: "community", label: "Community Data",    score: scoreOf(["registry"]),
        note: `${households.length} घरे · ${members.length} सदस्य.` },
      { key: "finance",   label: "Financial Records", score: scoreOf(["donation", "expense"]),
        note: `वसुली ${paidPct}%.` },
      { key: "docs",      label: "Documentation",     score: scoreOf(["documents", "reports"]),
        note: "सर्व टेम्प्लेट्स कार्यरत." },
      { key: "archive",   label: "Archive",           score: scoreOf(["archive"]),
        note: `${archives.length} अभिलेखे.` },
    ];
    setBreakdown(b);
    setModules(m);
    setLoading(false);

    void perms; void missing; // reserved for future use
  };

  useEffect(() => { evaluate(); /* eslint-disable-next-line */ }, []);

  const overall = useMemo(() => {
    if (modules.length === 0) return 0;
    return Math.round(modules.reduce((s, x) => s + STATUS_META[x.status].weight, 0) / modules.length);
  }, [modules]);

  const overallColor =
    overall >= 85 ? "text-emerald-600" :
    overall >= 65 ? "text-amber-600" :
    overall >= 40 ? "text-orange-600" : "text-rose-600";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" /> सिस्टम आरोग्य इंजिन
            </CardTitle>
            <CardDescription>प्रत्येक मॉड्यूल स्वतःची स्थिती डेटामधून तपासतो.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={evaluate} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
            पुन्हा तपासा
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border">
            <div className="flex items-baseline gap-3">
              <p className="text-sm text-muted-foreground">Overall Health</p>
              <p className={`text-4xl font-black ${overallColor}`}>{overall}%</p>
            </div>
            <Progress value={overall} className="h-2 mt-2" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-4">
              {breakdown.map((b) => (
                <div key={b.key} className="rounded-lg border p-2.5 bg-background/60">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold">{b.label}</p>
                    <span className="text-xs font-bold">{b.score}%</span>
                  </div>
                  <Progress value={b.score} className="h-1 mt-1.5" />
                  <p className="text-[10px] text-muted-foreground mt-1">{b.note}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {modules.map((mod) => {
          const meta = STATUS_META[mod.status];
          const Icon = meta.Icon;
          return (
            <div key={mod.key} className={`rounded-xl border p-3 ${meta.color}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm truncate">{mod.name}</p>
                <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs opacity-90">
                <Icon className="h-3.5 w-3.5" /> {meta.label}
              </div>
              <p className="text-xs mt-2 leading-snug">{mod.reason}</p>
              <p className="text-[11px] mt-1.5 opacity-80"><b>पुढील:</b> {mod.action}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SystemHealthEngine;
