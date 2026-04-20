// Admin module: link competition to program, manage entries with camera, manage judges, view results, declare winners
import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Camera, Plus, Trophy, Users, Lock, Loader2, Trash2, Copy, Eye, EyeOff, Crown,
} from "lucide-react";
import CameraCapture from "@/components/competition/CameraCapture";

type Program = { id: string; name: string };
type Competition = { id: string; program_id: string; name: string; status: string; is_visible: boolean };
type Entry = {
  id: string; entry_code: string; category: "chota" | "motha" | "khula";
  participant_name: string; image_url: string; image_path: string; created_at: string;
};
type Judge = { id: string; judge_code: string; display_name: string; is_active: boolean };
type Score = { id: string; entry_id: string; judge_id: string; marks: number; is_submitted: boolean; category: string };

const CATEGORIES: { key: "chota" | "motha" | "khula"; label: string }[] = [
  { key: "chota", label: "चोटा गट" },
  { key: "motha", label: "मोठा गट" },
  { key: "khula", label: "खुला गट" },
];

const CompetitionManagement = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedComp, setSelectedComp] = useState<string>("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);

  // Create competition form
  const [newCompProgram, setNewCompProgram] = useState("");
  const [newCompName, setNewCompName] = useState("");

  // Add entry
  const [cameraOpen, setCameraOpen] = useState(false);
  const [entryCategory, setEntryCategory] = useState<"chota" | "motha" | "khula">("chota");
  const [entryName, setEntryName] = useState("");
  const [pendingCapture, setPendingCapture] = useState<{ blob: Blob; previewUrl: string } | null>(null);

  // Judge dialog
  const [judgeDialog, setJudgeDialog] = useState(false);
  const [newJudgeName, setNewJudgeName] = useState("");
  const [generatedCred, setGeneratedCred] = useState<{ code: string; password: string } | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [p, c, j] = await Promise.all([
      supabase.from("programs").select("id, name").order("created_at", { ascending: false }),
      supabase.from("competitions").select("*").order("created_at", { ascending: false }),
      supabase.from("judges").select("*").order("created_at", { ascending: false }),
    ]);
    setPrograms((p.data ?? []) as any);
    setCompetitions((c.data ?? []) as any);
    setJudges((j.data ?? []) as any);
    if (!selectedComp && c.data && c.data.length > 0) setSelectedComp(c.data[0].id);
    setLoading(false);
  }, [selectedComp]);

  const loadCompetitionData = useCallback(async (compId: string) => {
    if (!compId) return;
    const [e, s] = await Promise.all([
      supabase.from("competition_entries").select("*").eq("competition_id", compId).order("created_at"),
      supabase.from("judge_scores").select("*").eq("competition_id", compId),
    ]);
    setEntries((e.data ?? []) as any);
    setScores((s.data ?? []) as any);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { if (selectedComp) loadCompetitionData(selectedComp); }, [selectedComp, loadCompetitionData]);

  const createCompetition = async () => {
    if (!newCompProgram || !newCompName.trim()) {
      toast.error("कार्यक्रम व नाव आवश्यक");
      return;
    }
    const { data, error } = await supabase
      .from("competitions")
      .insert({ program_id: newCompProgram, name: newCompName.trim(), type: "image" })
      .select().single();
    if (error) { toast.error(error.message); return; }
    toast.success("स्पर्धा तयार झाली");
    setNewCompName(""); setNewCompProgram("");
    setSelectedComp(data.id);
    loadAll();
  };

  const handleCaptured = async (blob: Blob, dataUrl: string) => {
    setPendingCapture({ blob, previewUrl: dataUrl });
    setCameraOpen(false);
  };

  const savePendingEntry = async () => {
    if (!selectedComp) { toast.error("स्पर्धा निवडा"); return; }
    if (!pendingCapture) { toast.error("पहिले फोटो घ्या"); return; }
    if (!entryName.trim()) { toast.error("सहभागीचे नाव लिहा"); return; }
    if (currentComp?.status === "LOCKED") { toast.error("Lock नंतर नवीन नोंद करता येणार नाही"); return; }

    const { data: codeData, error: codeErr } = await supabase
      .rpc("next_entry_code", { _competition_id: selectedComp, _category: entryCategory });
    if (codeErr) { toast.error(codeErr.message); return; }
    const entry_code = codeData as string;

    const path = `${selectedComp}/${entryCategory}/${entry_code}-${Date.now()}.webp`;
    const { error: upErr } = await supabase.storage
      .from("competition-images")
      .upload(path, pendingCapture.blob, { contentType: "image/webp", upsert: false });
    if (upErr) { toast.error("Upload अयशस्वी: " + upErr.message); return; }

    const { data: pub } = supabase.storage.from("competition-images").getPublicUrl(path);
    const { error } = await supabase.from("competition_entries").insert({
      competition_id: selectedComp,
      entry_code,
      category: entryCategory,
      participant_name: entryName.trim(),
      image_url: pub.publicUrl,
      image_path: path,
    });
    if (error) { toast.error(error.message); return; }

    toast.success(`${entry_code} जोडली`);
    setPendingCapture(null);
    setEntryName("");
    setEntryCategory("chota");
    loadCompetitionData(selectedComp);
  };

  const deleteEntry = async (e: Entry) => {
    if (!confirm(`${e.entry_code} delete करायची?`)) return;
    await supabase.storage.from("competition-images").remove([e.image_path]);
    await supabase.from("competition_entries").delete().eq("id", e.id);
    toast.success("Entry काढली");
    loadCompetitionData(selectedComp);
  };

  const createJudge = async () => {
    if (!newJudgeName.trim()) { toast.error("नाव आवश्यक"); return; }
    const { data, error } = await supabase.functions.invoke("judge-create", {
      body: { display_name: newJudgeName.trim() },
    });
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || "Judge create अयशस्वी");
      return;
    }
    setGeneratedCred({ code: (data as any).judge.judge_code, password: (data as any).plain_password });
    setNewJudgeName("");
    loadAll();
  };

  const toggleJudge = async (j: Judge) => {
    await supabase.from("judges").update({ is_active: !j.is_active }).eq("id", j.id);
    loadAll();
  };
  const deleteJudge = async (j: Judge) => {
    if (!confirm(`${j.judge_code} delete?`)) return;
    await supabase.from("judges").delete().eq("id", j.id);
    loadAll();
  };

  const copyJudgeMessage = (cred: { code: string; password: string }) => {
    const msg = `विचारमंच न्यायाधीश लॉगिन\n\nJudge ID: ${cred.code}\nपासवर्ड: ${cred.password}\n\nलिंक: ${window.location.origin}/judge-login`;
    navigator.clipboard.writeText(msg);
    toast.success("मेसेज copy झाला");
  };

  const currentComp = competitions.find((c) => c.id === selectedComp);

  // Aggregate per-entry: avg marks (only submitted), judge count
  const entryStats = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    scores.filter((s) => s.is_submitted).forEach((s) => {
      const v = map.get(s.entry_id) ?? { sum: 0, count: 0 };
      v.sum += Number(s.marks); v.count += 1;
      map.set(s.entry_id, v);
    });
    return map;
  }, [scores]);

  const rankings = useMemo(() => {
    const out: Record<string, (Entry & { avg: number; jcount: number })[]> = {};
    CATEGORIES.forEach(({ key }) => {
      const list = entries
        .filter((e) => e.category === key)
        .map((e) => {
          const s = entryStats.get(e.id);
          return { ...e, avg: s ? s.sum / s.count : 0, jcount: s?.count ?? 0 };
        })
        .sort((a, b) => b.avg - a.avg);
      out[key] = list;
    });
    return out;
  }, [entries, entryStats]);

  const declareWinners = async (cat: "chota" | "motha" | "khula") => {
    if (!currentComp) return;
    const top3 = rankings[cat].slice(0, 3);
    if (top3.length === 0) { toast.error("कुणालाही गुण मिळाले नाहीत"); return; }
    if (!confirm(`${CATEGORIES.find((c) => c.key === cat)?.label} चे विजेते कार्यक्रमात जोडायचे?`)) return;

    // Find or create program_winners row for this program + category label
    const categoryLabel = `${currentComp.name} – ${CATEGORIES.find((c) => c.key === cat)?.label}`;
    const payload = {
      program_id: currentComp.program_id,
      category: categoryLabel,
      first_place: top3[0]?.participant_name ?? null,
      second_place: top3[1]?.participant_name ?? null,
      third_place: top3[2]?.participant_name ?? null,
      show_on_ui: true,
    };
    const { data: existing } = await supabase
      .from("program_winners").select("id")
      .eq("program_id", currentComp.program_id).eq("category", categoryLabel).maybeSingle();
    const { error } = existing
      ? await supabase.from("program_winners").update(payload).eq("id", existing.id)
      : await supabase.from("program_winners").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("विजेते जाहीर झाले");
  };

  const finalLock = async () => {
    if (!currentComp) return;
    if (!confirm("स्पर्धा कायमची lock करायची? यानंतर कुणीही बदल करू शकणार नाही.")) return;
    await supabase.from("competitions").update({ status: "LOCKED" }).eq("id", currentComp.id);
    toast.success("स्पर्धा lock झाली");
    loadAll();
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      {cameraOpen && (
        <CameraCapture
          onCaptured={async (b, d) => { await handleCaptured(b, d); }}
          onClose={() => setCameraOpen(false)}
        />
      )}

      <Dialog open={!!pendingCapture} onOpenChange={(open) => !open && setPendingCapture(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>नवीन नोंद पूर्ण करा</DialogTitle>
            <DialogDescription>आधी फोटो घेतला आहे. आता सहभागीचे नाव आणि गट जतन करा.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {pendingCapture && (
              <img src={pendingCapture.previewUrl} alt="नवीन नोंद पूर्वावलोकन" className="w-full aspect-square object-cover rounded-lg border" />
            )}
            <div className="space-y-2">
              <Label>सहभागीचे नाव</Label>
              <Input placeholder="सहभागीचे नाव" value={entryName} onChange={(e) => setEntryName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>गट</Label>
              <Select value={entryCategory} onValueChange={(v) => setEntryCategory(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPendingCapture(null)}>रद्द</Button>
              <Button onClick={savePendingEntry}>नोंद जतन करा</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create competition */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5" /> स्पर्धा मूल्यांकन</CardTitle>
          <CardDescription>कार्यक्रमाला जोडून नवीन स्पर्धा तयार करा</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <Select value={newCompProgram} onValueChange={setNewCompProgram}>
              <SelectTrigger><SelectValue placeholder="कार्यक्रम निवडा" /></SelectTrigger>
              <SelectContent>
                {programs.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="स्पर्धेचे नाव" value={newCompName} onChange={(e) => setNewCompName(e.target.value)} />
            <Button onClick={createCompetition}><Plus className="h-4 w-4 mr-1" /> जोडा</Button>
          </div>
        </CardContent>
      </Card>

      {/* Switch competition */}
      {competitions.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <Label className="text-sm">सक्रिय स्पर्धा</Label>
            <div className="flex gap-2 mt-1 items-center">
              <Select value={selectedComp} onValueChange={setSelectedComp}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {competitions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {c.status === "LOCKED" ? "🔒" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentComp && currentComp.status !== "LOCKED" && (
                <Button variant="outline" size="sm" onClick={finalLock}>
                  <Lock className="h-4 w-4 mr-1" /> Final Lock
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedComp && (
        <Tabs defaultValue="entries">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="entries">नोंदी</TabsTrigger>
            <TabsTrigger value="judges">न्यायाधीश</TabsTrigger>
            <TabsTrigger value="results">निकाल</TabsTrigger>
          </TabsList>

          {/* ENTRIES TAB */}
          <TabsContent value="entries" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">नवीन नोंद</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid sm:grid-cols-[1fr_auto] gap-3">
                  <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                    क्रम: <b>१) फोटो घ्या</b> → <b>२) सहभागीचे नाव</b> → <b>३) गट निवडा</b> → <b>४) नोंद जतन करा</b>
                  </div>
                  <Button onClick={() => setCameraOpen(true)} disabled={!selectedComp || currentComp?.status === "LOCKED"}>
                    <Camera className="h-4 w-4 mr-1" /> फोटो घ्या
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Lock झाल्यानंतर नवीन entry जोडता येणार नाही. मतदान मात्र lock नंतर सुरू राहील.
                </p>
              </CardContent>
            </Card>

            {CATEGORIES.map(({ key, label }) => {
              const list = entries.filter((e) => e.category === key);
              if (list.length === 0) return null;
              return (
                <Card key={key}>
                  <CardHeader><CardTitle className="text-base">{label} ({list.length})</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {list.map((e) => {
                        const stat = entryStats.get(e.id);
                        return (
                          <div key={e.id} className="border rounded-lg overflow-hidden bg-card">
                            <img src={e.image_url} alt={e.entry_code} loading="lazy" className="w-full aspect-square object-cover" />
                            <div className="p-2 text-xs">
                              <div className="font-semibold flex items-center justify-between">
                                {e.entry_code}
                                <Button variant="ghost" size="sm" onClick={() => deleteEntry(e)} className="h-6 w-6 p-0">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="text-muted-foreground truncate">{e.participant_name}</div>
                              {stat && stat.count > 0 && (
                                <div className="text-accent font-medium">avg {(stat.sum / stat.count).toFixed(1)} ({stat.count})</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* JUDGES TAB */}
          <TabsContent value="judges" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> न्यायाधीश व्यवस्थापन</CardTitle>
                <CardDescription>नवीन न्यायाधीश तयार करा. Judge ID व पासवर्ड auto तयार होईल.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input placeholder="न्यायाधीशाचे नाव" value={newJudgeName} onChange={(e) => setNewJudgeName(e.target.value)} />
                  <Button onClick={createJudge}><Plus className="h-4 w-4 mr-1" /> तयार करा</Button>
                </div>
                {generatedCred && (
                  <div className="border-2 border-accent bg-accent/10 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-semibold">नवीन Judge Login (हा डेटा एकदाच दिसेल):</p>
                    <p className="font-mono text-sm">ID: <b>{generatedCred.code}</b></p>
                    <p className="font-mono text-sm">Password: <b>{generatedCred.password}</b></p>
                    <Button size="sm" onClick={() => copyJudgeMessage(generatedCred)}>
                      <Copy className="h-4 w-4 mr-1" /> मेसेज copy
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setGeneratedCred(null)}>बंद</Button>
                  </div>
                )}

                <div className="space-y-2 mt-4">
                  {judges.map((j) => (
                    <div key={j.id} className="flex items-center justify-between border rounded p-2 bg-card">
                      <div>
                        <div className="font-semibold text-sm">{j.judge_code} — {j.display_name}</div>
                        <div className="text-xs text-muted-foreground">{j.is_active ? "सक्रिय" : "निष्क्रिय"}</div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => toggleJudge(j)}>
                          {j.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteJudge(j)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {judges.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">अजून न्यायाधीश नाहीत</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* RESULTS TAB */}
          <TabsContent value="results" className="space-y-4">
            {CATEGORIES.map(({ key, label }) => {
              const list = rankings[key];
              return (
                <Card key={key}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">{label} — Top 3</CardTitle>
                    <Button size="sm" onClick={() => declareWinners(key)} disabled={list.length === 0 || list[0].jcount === 0}>
                      <Crown className="h-4 w-4 mr-1" /> विजेते जाहीर
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {list.length === 0 ? (
                      <p className="text-sm text-muted-foreground">कोणत्याही नोंदी नाहीत</p>
                    ) : (
                      <div className="space-y-2">
                        {list.slice(0, 10).map((e, i) => (
                          <div key={e.id} className={`flex items-center gap-3 border rounded p-2 ${i < 3 ? "bg-accent/10 border-accent" : ""}`}>
                            <span className="font-bold w-8">{i + 1}.</span>
                            <img src={e.image_url} className="h-12 w-12 object-cover rounded" loading="lazy" />
                            <div className="flex-1 text-sm">
                              <div className="font-semibold">{e.entry_code} — {e.participant_name}</div>
                              <div className="text-xs text-muted-foreground">{e.jcount} न्यायाधीश</div>
                            </div>
                            <div className="font-bold text-lg">{e.avg.toFixed(1)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default CompetitionManagement;
