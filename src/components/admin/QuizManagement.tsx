import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { notifySubscribers } from "@/lib/notify";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus, Pencil, Trash2, Download, BarChart3, Trophy, AlertTriangle, Loader2, RefreshCw,
} from "lucide-react";

type Question = {
  id: string;
  question: string;
  option_a: string; option_b: string; option_c: string; option_d: string;
  correct_answer: "A" | "B" | "C" | "D";
  marks: number;
  display_order: number;
  category_slug: string | null;
};

type Config = {
  id: string;
  title: string;
  description: string | null;
  status: "UPCOMING" | "ACTIVE" | "COMPLETED";
  duration_seconds: number;
  publish_answer_key: boolean;
};

type Session = {
  id: string;
  participant_name: string;
  dob: string;
  score: number;
  total_marks: number;
  total_questions: number;
  time_taken_seconds: number | null;
  status: string;
  tab_switches: number;
  risk_level: "NORMAL" | "SUSPICIOUS" | "HIGH_RISK";
  risk_reasons: string[];
  start_time: string;
  end_time: string | null;
};

const emptyQ: Omit<Question, "id"> = {
  question: "", option_a: "", option_b: "", option_c: "", option_d: "",
  correct_answer: "A", marks: 1, display_order: 0, category_slug: null,
};

const QuizManagement = () => {
  const [config, setConfig] = useState<Config | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Question | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<Omit<Question, "id">>(emptyQ);
  const [categories, setCategories] = useState<{ slug: string; name_mr: string }[]>([]);

  useEffect(() => {
    supabase
      .from("constitution_categories")
      .select("slug, name_mr")
      .eq("is_active", true)
      .order("display_order")
      .then(({ data }) => setCategories((data as any) ?? []));
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [c, q, s, a] = await Promise.all([
      supabase.from("quiz_config").select("*").limit(1).maybeSingle(),
      supabase.from("quiz_questions").select("*").order("display_order", { ascending: true }),
      supabase.from("quiz_sessions").select("*").order("score", { ascending: false }).order("time_taken_seconds", { ascending: true }),
      supabase.from("quiz_answers").select("*"),
    ]);
    setConfig(c.data as any);
    setQuestions((q.data ?? []) as any);
    setSessions((s.data ?? []) as any);
    setAnswers(a.data ?? []);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  // Realtime: live participant count
  useEffect(() => {
    const ch = supabase
      .channel("quiz-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz_sessions" }, () => loadAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // ===== Config controls =====
  const updateConfig = async (patch: Partial<Config>) => {
    if (!config) return;
    const { error } = await supabase.from("quiz_config").update(patch).eq("id", config.id);
    if (error) return toast.error(error.message);
    toast.success("कॉन्फिग अद्यतनित");
    setConfig({ ...config, ...patch });
    // Notify on quiz completion / answer-key publication.
    if (patch.status === "COMPLETED") {
      notifySubscribers({
        title: "प्रश्नमंजुषा पूर्ण झाली",
        body: "निकाल लवकरच प्रकाशित होतील.",
        link: "/quiz",
        category: "quiz",
      });
    }
    if (patch.publish_answer_key) {
      notifySubscribers({
        title: "उत्तरतालिका प्रकाशित",
        body: "प्रश्नमंजुषेची उत्तरतालिका आता उपलब्ध आहे.",
        link: "/quiz",
        category: "quiz",
      });
    }
  };

  // ===== Question CRUD =====
  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyQ, display_order: questions.length });
    setFormOpen(true);
  };
  const openEdit = (q: Question) => {
    setEditing(q);
    const { id, ...rest } = q;
    setForm(rest);
    setFormOpen(true);
  };
  const saveQuestion = async () => {
    if (!form.question.trim() || !form.option_a || !form.option_b || !form.option_c || !form.option_d) {
      return toast.error("सर्व क्षेत्रे भरा");
    }
    if (editing) {
      const { error } = await supabase.from("quiz_questions").update(form).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("प्रश्न अद्यतनित");
      // Recalculate scores in case correct answer changed
      await supabase.rpc("recalculate_quiz_scores");
    } else {
      const { error } = await supabase.from("quiz_questions").insert(form);
      if (error) return toast.error(error.message);
      toast.success("प्रश्न जोडला");
    }
    setFormOpen(false);
    await loadAll();
  };
  const deleteQuestion = async (id: string) => {
    if (!confirm("प्रश्न हटवायचा?")) return;
    const { error } = await supabase.from("quiz_questions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("हटवला");
    await loadAll();
  };

  // ===== Live monitoring =====
  const liveActive = sessions.filter((s) => s.status === "in_progress").length;
  const submittedCount = sessions.filter((s) => s.status !== "in_progress").length;

  // ===== Rank list =====
  const rankList = useMemo(() => {
    const submitted = sessions.filter((s) => s.status !== "in_progress");
    return [...submitted].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.time_taken_seconds ?? 0) - (b.time_taken_seconds ?? 0);
    });
  }, [sessions]);

  // ===== Analytics =====
  const analytics = useMemo(() => {
    if (questions.length === 0) return null;
    const totalAttempts = sessions.filter((s) => s.status !== "in_progress").length;
    const perQ = questions.map((q) => {
      const qa = answers.filter((a) => a.question_id === q.id);
      const correct = qa.filter((a) => a.is_correct).length;
      const accuracy = qa.length ? (correct / qa.length) * 100 : 0;
      const avgTime = qa.length ? qa.reduce((s, a) => s + (a.time_spent_seconds || 0), 0) / qa.length : 0;
      let difficulty: "EASY" | "MEDIUM" | "HARD" = "MEDIUM";
      if (accuracy >= 75) difficulty = "EASY";
      else if (accuracy < 35) difficulty = "HARD";
      return { id: q.id, q: q.question, attempts: qa.length, accuracy, avgTime, difficulty };
    });
    // Distribution buckets
    const buckets = [0, 0, 0, 0, 0]; // 0-20,20-40,40-60,60-80,80-100
    for (const s of sessions.filter((x) => x.status !== "in_progress" && x.total_marks > 0)) {
      const pct = (s.score / s.total_marks) * 100;
      const idx = Math.min(4, Math.floor(pct / 20));
      buckets[idx]++;
    }
    return { totalAttempts, perQ, buckets };
  }, [questions, sessions, answers]);

  // ===== CSV Export =====
  const exportCSV = () => {
    const orderedQs = [...questions].sort((a, b) => a.display_order - b.display_order);
    const header = [
      "Name", "DOB",
      ...orderedQs.map((_, i) => `Q${i + 1}`),
      ...orderedQs.map((_, i) => `Q${i + 1}_TimeSec`),
      "TabSwitches", "RiskLevel", "TimeTakenSec", "TotalMarks", "Score", "Percentage", "Status",
    ];
    const rows = sessions
      .filter((s) => s.status !== "in_progress")
      .map((s) => {
        const sa = answers.filter((a) => a.session_id === s.id);
        const ansBy = new Map(sa.map((a) => [a.question_id, a]));
        const qAns = orderedQs.map((q) => {
          const a = ansBy.get(q.id);
          return a ? `${a.selected_option}${a.is_correct ? "✓" : "✗"}` : "-";
        });
        const qTimes = orderedQs.map((q) => ansBy.get(q.id)?.time_spent_seconds ?? 0);
        const pct = s.total_marks ? ((s.score / s.total_marks) * 100).toFixed(1) : "0";
        return [
          s.participant_name, s.dob,
          ...qAns, ...qTimes,
          s.tab_switches, s.risk_level, s.time_taken_seconds ?? 0,
          s.total_marks, s.score, pct, s.status,
        ];
      });
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `quiz_results_${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  if (loading || !config) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-accent" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Quiz Control */}
      <Card>
        <CardHeader>
          <CardTitle>प्रश्नमंजुषा नियंत्रण</CardTitle>
          <CardDescription>स्थिती, वेळ, उत्तरतालिका जाहीर करा</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <Label>शीर्षक</Label>
            <Input value={config.title} onChange={(e) => setConfig({ ...config, title: e.target.value })}
              onBlur={() => updateConfig({ title: config.title })} />
          </div>
          <div className="space-y-1">
            <Label>स्थिती</Label>
            <Select value={config.status} onValueChange={(v) => updateConfig({ status: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="UPCOMING">UPCOMING</SelectItem>
                <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                <SelectItem value="COMPLETED">COMPLETED</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>कालावधी (मिनिटे)</Label>
            <Input
              type="number" min={1}
              value={Math.round(config.duration_seconds / 60)}
              onChange={(e) => setConfig({ ...config, duration_seconds: Math.max(60, Number(e.target.value) * 60) })}
              onBlur={() => updateConfig({ duration_seconds: config.duration_seconds })}
            />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label className="block mb-2">उत्तरतालिका जाहीर</Label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={config.publish_answer_key}
                  onCheckedChange={(v) => updateConfig({ publish_answer_key: v })}
                />
                <span className="text-sm text-muted-foreground">{config.publish_answer_key ? "ON" : "OFF"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live monitoring */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">सक्रिय सहभागी</p><p className="text-2xl font-bold text-green-600">{liveActive}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">सादर केलेले</p><p className="text-2xl font-bold">{submittedCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">एकूण प्रश्न</p><p className="text-2xl font-bold">{questions.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">ध्वजांकित</p><p className="text-2xl font-bold text-destructive">{sessions.filter((s) => s.risk_level !== "NORMAL").length}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="questions">
        <TabsList className="w-full flex flex-wrap gap-1 h-auto justify-start">
          <TabsTrigger value="questions" className="flex-1 min-w-[80px]">प्रश्न</TabsTrigger>
          <TabsTrigger value="ranks" className="flex-1 min-w-[80px]">क्रमवारी</TabsTrigger>
          <TabsTrigger value="responses" className="flex-1 min-w-[80px]">प्रतिसाद</TabsTrigger>
          <TabsTrigger value="analytics" className="flex-1 min-w-[80px]">विश्लेषण</TabsTrigger>
          <TabsTrigger value="cheating" className="flex-1 min-w-[80px]">जोखीम</TabsTrigger>
        </TabsList>

        {/* Questions */}
        <TabsContent value="questions" className="space-y-3">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <h3 className="font-semibold">{questions.length} प्रश्न</h3>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => supabase.rpc("recalculate_quiz_scores").then(() => { toast.success("गुण पुनर्गणना"); loadAll(); })}>
                <RefreshCw className="h-4 w-4 mr-1" /> गुण पुनर्गणना
              </Button>
              <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> नवीन</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editing ? "प्रश्न संपादित" : "नवीन प्रश्न"}</DialogTitle>
                    <DialogDescription>योग्य उत्तर निवडण्यास विसरू नका</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div><Label>प्रश्न</Label><Textarea rows={3} value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-2">
                      {(["a", "b", "c", "d"] as const).map((k) => (
                        <div key={k}>
                          <Label>पर्याय {k.toUpperCase()}</Label>
                          <Input value={(form as any)[`option_${k}`]} onChange={(e) => setForm({ ...form, [`option_${k}`]: e.target.value } as any)} />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label>योग्य उत्तर</Label>
                        <Select value={form.correct_answer} onValueChange={(v) => setForm({ ...form, correct_answer: v as any })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(["A", "B", "C", "D"] as const).map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>गुण</Label><Input type="number" value={form.marks} onChange={(e) => setForm({ ...form, marks: Number(e.target.value) || 1 })} /></div>
                      <div><Label>क्रम</Label><Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) || 0 })} /></div>
                    </div>
                    <div>
                      <Label>संविधान विषय (ऐच्छिक)</Label>
                      <Select
                        value={form.category_slug ?? "__none__"}
                        onValueChange={(v) => setForm({ ...form, category_slug: v === "__none__" ? null : v })}
                      >
                        <SelectTrigger><SelectValue placeholder="विषय निवडा" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">विषय नाही</SelectItem>
                          {categories.map((c) => (
                            <SelectItem key={c.slug} value={c.slug}>{c.name_mr}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">विषयनिहाय निकाल विश्लेषणासाठी वापरले जाते</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setFormOpen(false)}>रद्द</Button>
                    <Button onClick={saveQuestion}>जतन करा</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="space-y-2">
            {questions.map((q, i) => (
              <div key={q.id} className="border border-border rounded-lg p-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{i + 1}. {q.question}</p>
                  <p className="text-xs text-muted-foreground mt-1">योग्य: <strong>{q.correct_answer}</strong> · गुण: {q.marks}{q.category_slug ? ` · विषय: ${categories.find((c) => c.slug === q.category_slug)?.name_mr ?? q.category_slug}` : ""}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(q)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteQuestion(q.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
            {questions.length === 0 && <p className="text-center text-muted-foreground py-8">अद्याप प्रश्न नाहीत</p>}
          </div>
        </TabsContent>

        {/* Rank list */}
        <TabsContent value="ranks">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-accent" /> क्रमवारी ({rankList.length})</CardTitle>
              <Button onClick={exportCSV} variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> CSV</Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr><th className="p-2 text-left">#</th><th className="p-2 text-left">नाव</th><th className="p-2">DOB</th><th className="p-2">गुण</th><th className="p-2">%</th><th className="p-2">वेळ</th><th className="p-2">जोखीम</th></tr>
                  </thead>
                  <tbody>
                    {rankList.map((s, i) => {
                      const pct = s.total_marks ? ((s.score / s.total_marks) * 100).toFixed(1) : "0";
                      const t = s.time_taken_seconds ?? 0;
                      return (
                        <tr key={s.id} className="border-b border-border">
                          <td className="p-2 font-bold">{i + 1}</td>
                          <td className="p-2">{s.participant_name}</td>
                          <td className="p-2 text-center">{s.dob}</td>
                          <td className="p-2 text-center">{s.score}/{s.total_marks}</td>
                          <td className="p-2 text-center">{pct}%</td>
                          <td className="p-2 text-center">{Math.floor(t / 60)}:{(t % 60).toString().padStart(2, "0")}</td>
                          <td className="p-2 text-center">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              s.risk_level === "HIGH_RISK" ? "bg-destructive text-destructive-foreground"
                              : s.risk_level === "SUSPICIOUS" ? "bg-amber-500 text-amber-50"
                              : "bg-green-600/20 text-green-700 dark:text-green-400"
                            }`}>{s.risk_level}</span>
                          </td>
                        </tr>
                      );
                    })}
                    {rankList.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">अद्याप कोणी सादर केले नाही</td></tr>}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Responses */}
        <TabsContent value="responses">
          <Card>
            <CardHeader><CardTitle>सर्व प्रतिसाद ({sessions.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {sessions.map((s) => (
                  <div key={s.id} className="border border-border rounded-lg p-3 text-sm flex justify-between gap-2">
                    <div>
                      <p className="font-medium">{s.participant_name} <span className="text-xs text-muted-foreground">({s.dob})</span></p>
                      <p className="text-xs text-muted-foreground">{s.status} · Tab×{s.tab_switches}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{s.score}/{s.total_marks}</p>
                      <p className="text-xs text-muted-foreground">{Math.floor((s.time_taken_seconds ?? 0) / 60)}m</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics">
          {analytics ? (
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> गुण वितरण ({analytics.totalAttempts} सहभागी)</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-2 items-end h-40">
                    {analytics.buckets.map((n, i) => {
                      const max = Math.max(1, ...analytics.buckets);
                      return (
                        <div key={i} className="flex flex-col items-center justify-end gap-1">
                          <div className="text-xs font-bold">{n}</div>
                          <div className="w-full bg-accent rounded-t" style={{ height: `${(n / max) * 100}%`, minHeight: 4 }} />
                          <div className="text-[10px] text-muted-foreground">{i * 20}-{(i + 1) * 20}%</div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>प्रश्न-निहाय कामगिरी</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {analytics.perQ.map((p, i) => (
                      <div key={p.id} className="border border-border rounded p-3">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <p className="text-sm font-medium flex-1">{i + 1}. {p.q}</p>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            p.difficulty === "EASY" ? "bg-green-600/20 text-green-700"
                            : p.difficulty === "HARD" ? "bg-destructive/20 text-destructive"
                            : "bg-amber-500/20 text-amber-700"
                          }`}>{p.difficulty}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>अचूकता: <strong>{p.accuracy.toFixed(1)}%</strong></div>
                          <div>सरासरी वेळ: <strong>{p.avgTime.toFixed(1)}s</strong></div>
                          <div>प्रयत्न: <strong>{p.attempts}</strong></div>
                        </div>
                        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${p.accuracy >= 75 ? "bg-green-500" : p.accuracy < 35 ? "bg-destructive" : "bg-amber-500"}`} style={{ width: `${p.accuracy}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : <p className="text-center py-12 text-muted-foreground">डेटा नाही</p>}
        </TabsContent>

        {/* Cheating */}
        <TabsContent value="cheating">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" /> ध्वजांकित सहभागी</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sessions.filter((s) => s.risk_level !== "NORMAL").map((s) => (
                  <div key={s.id} className="border border-destructive/30 bg-destructive/5 rounded p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{s.participant_name}</p>
                        <p className="text-xs text-muted-foreground">{s.dob} · Tab×{s.tab_switches}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded font-bold ${s.risk_level === "HIGH_RISK" ? "bg-destructive text-destructive-foreground" : "bg-amber-500 text-amber-50"}`}>{s.risk_level}</span>
                    </div>
                    <div className="text-xs mt-2 flex flex-wrap gap-1">
                      {(s.risk_reasons || []).map((r, i) => (
                        <span key={i} className="bg-muted px-2 py-0.5 rounded">{r}</span>
                      ))}
                    </div>
                  </div>
                ))}
                {sessions.filter((s) => s.risk_level !== "NORMAL").length === 0 && (
                  <p className="text-center py-12 text-muted-foreground">कोणीही ध्वजांकित नाही 🎉</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuizManagement;
