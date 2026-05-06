// Judge dashboard: category-wise scoring with autosave, INCREMENTAL polling, anti-duplicate
import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, LogOut, Lock, CheckCircle2, AlertCircle } from "lucide-react";

type Comp = { id: string; name: string; status: string; updated_at?: string };
type Entry = { id: string; competition_id: string; entry_code: string; category: string; image_url: string; created_at: string };
type Score = { id: string; entry_id: string; competition_id: string; category: string; marks: number; is_submitted: boolean; updated_at?: string };

const CATEGORIES: { key: "chota" | "motha" | "khula"; label: string }[] = [
  { key: "chota", label: "छोटा गट" },
  { key: "motha", label: "मोठा गट" },
  { key: "khula", label: "खुला गट" },
];

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const JudgeDashboard = () => {
  const nav = useNavigate();
  const [judge, setJudge] = useState<any>(null);
  const [competitions, setCompetitions] = useState<Comp[]>([]);
  const [activeComp, setActiveComp] = useState<string>("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [scores, setScores] = useState<Record<string, Score>>({});
  const [draftMarks, setDraftMarks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<"chota" | "motha" | "khula">("chota");

  // Refs avoid recreating polling interval on every state change
  const tokenRef = useRef<string | null>(typeof window !== "undefined" ? localStorage.getItem("judge_token") : null);
  const sinceRef = useRef<string | null>(null);
  const activeCompRef = useRef<string>("");
  const lastEntryCountRef = useRef(0);
  const inflightRef = useRef(false);
  const saveTimers = useRef<Record<string, any>>({});

  useEffect(() => {
    if (!tokenRef.current) { nav("/judge-login"); return; }
    const j = localStorage.getItem("judge_info");
    if (j) setJudge(JSON.parse(j));
  }, [nav]);

  useEffect(() => { activeCompRef.current = activeComp; }, [activeComp]);

  const callJudgeData = useCallback(async (silent: boolean) => {
    const token = tokenRef.current;
    if (!token || inflightRef.current) return;
    inflightRef.current = true;
    try {
      const url = new URL(`${SUPABASE_URL}/functions/v1/judge-data`);
      if (activeCompRef.current) url.searchParams.set("competition_id", activeCompRef.current);
      if (silent && sinceRef.current) url.searchParams.set("since", sinceRef.current);

      const res = await fetch(url.toString(), {
        headers: { "x-judge-token": token, apikey: ANON },
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        if (res.status === 401) {
          localStorage.removeItem("judge_token");
          nav("/judge-login");
          return;
        }
        if (!silent) toast.error(data.error || "server त्रुटी");
        return;
      }

      const isFull = !!data.full;
      const comps: Comp[] = data.competitions || [];
      if (isFull) setCompetitions(comps);
      else if (comps.length) {
        // merge status updates only
        setCompetitions((prev) => {
          const map = new Map(prev.map((c) => [c.id, c]));
          comps.forEach((c) => map.set(c.id, { ...map.get(c.id), ...c }));
          return Array.from(map.values());
        });
      }

      // Bootstrap activeComp on first load
      if (!activeCompRef.current && comps.length > 0) {
        activeCompRef.current = comps[0].id;
        setActiveComp(comps[0].id);
      }

      const newEntries: Entry[] = data.entries || [];
      if (isFull) {
        const scoped = activeCompRef.current
          ? newEntries.filter((e) => e.competition_id === activeCompRef.current)
          : newEntries;
        setEntries(scoped);
        lastEntryCountRef.current = scoped.length;
      } else if (newEntries.length) {
        setEntries((prev) => {
          const seen = new Set(prev.map((e) => e.id));
          const adds = newEntries.filter((e) => !seen.has(e.id) && e.competition_id === activeCompRef.current);
          if (adds.length === 0) return prev;
          if (silent) toast.success(`${adds.length} नवीन नोंद आल्या`);
          const merged = [...prev, ...adds].sort((a, b) => a.created_at.localeCompare(b.created_at));
          lastEntryCountRef.current = merged.length;
          return merged;
        });
      }

      const newScores: Score[] = data.scores || [];
      if (isFull) {
        const sMap: Record<string, Score> = {};
        const dMap: Record<string, string> = {};
        newScores.forEach((s) => { sMap[s.entry_id] = s; dMap[s.entry_id] = String(s.marks); });
        setScores(sMap);
        setDraftMarks((prev) => {
          // keep user's unsaved drafts for entries that aren't yet locked
          const out = { ...dMap };
          Object.entries(prev).forEach(([k, v]) => { if (!sMap[k]?.is_submitted && v !== undefined) out[k] = v; });
          return out;
        });
      } else if (newScores.length) {
        setScores((prev) => {
          const out = { ...prev };
          newScores.forEach((s) => { out[s.entry_id] = s; });
          return out;
        });
        setDraftMarks((prev) => {
          const out = { ...prev };
          newScores.forEach((s) => {
            if (s.is_submitted || prev[s.entry_id] === undefined) out[s.entry_id] = String(s.marks);
          });
          return out;
        });
      }

      if (data.server_time) sinceRef.current = data.server_time;
    } catch {
      // network blip — next poll will retry
    } finally {
      inflightRef.current = false;
    }
  }, [nav]);

  // Initial full load
  useEffect(() => {
    (async () => {
      setLoading(true);
      sinceRef.current = null; // force full
      await callJudgeData(false);
      setLoading(false);
    })();
  }, [callJudgeData]);

  // When competition switches: reset and full-reload
  useEffect(() => {
    if (!activeComp) return;
    sinceRef.current = null;
    setEntries([]); setScores({}); setDraftMarks({});
    callJudgeData(false);
  }, [activeComp, callJudgeData]);

  // Stable 6s polling (incremental)
  useEffect(() => {
    const t = setInterval(() => callJudgeData(true), 6000);
    const onVis = () => { if (document.visibilityState === "visible") callJudgeData(true); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [callJudgeData]);

  const saveScore = useCallback(async (entryId: string, marksRaw: string) => {
    const token = tokenRef.current;
    if (!token) return;
    const m = Number(marksRaw);
    if (Number.isNaN(m) || m < 0 || m > 10) return;
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/judge-score`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-judge-token": token, apikey: ANON },
        body: JSON.stringify({ action: "save", entry_id: entryId, marks: m }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        if (data.error?.includes("submit")) return;
        toast.error(data.error || "save अयशस्वी");
      }
    } catch { /* silent — autosave will retry on next change */ }
  }, []);

  const onMarksChange = (entryId: string, value: string) => {
    if (scores[entryId]?.is_submitted) return;
    setDraftMarks((p) => ({ ...p, [entryId]: value }));
    if (saveTimers.current[entryId]) clearTimeout(saveTimers.current[entryId]);
    saveTimers.current[entryId] = setTimeout(() => saveScore(entryId, value), 700);
  };

  const submitCategory = async (category: string) => {
    const token = tokenRef.current;
    if (!token || !activeComp) return;
    if (!confirm(`${CATEGORIES.find((c) => c.key === category)?.label} चे सर्व गुण final submit करायचे? यानंतर बदल करता येणार नाही.`)) return;
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/judge-score`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-judge-token": token, apikey: ANON },
        body: JSON.stringify({ action: "submit_category", competition_id: activeComp, category }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { toast.error(data.error || "submit अयशस्वी"); return; }
      toast.success("Category submit झाली");
      const idx = CATEGORIES.findIndex((c) => c.key === category);
      if (idx < CATEGORIES.length - 1) setActiveCategory(CATEGORIES[idx + 1].key);
      sinceRef.current = null;
      callJudgeData(false);
    } catch (e: any) { toast.error(e?.message ?? "त्रुटी"); }
  };

  const logout = () => {
    localStorage.removeItem("judge_token");
    localStorage.removeItem("judge_info");
    nav("/judge-login");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground sticky top-0 z-40 shadow">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <div className="font-bold text-base sm:text-lg">न्यायाधीश पॅनेल</div>
            <div className="text-xs opacity-80">{judge?.judge_code} — {judge?.display_name}</div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="text-primary-foreground hover:bg-primary-foreground/10">
            <LogOut className="h-4 w-4 mr-1" /> लॉगआउट
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 py-4 space-y-4">
        {competitions.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">सध्या कोणतीही स्पर्धा नाही</CardContent></Card>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">स्पर्धा निवडा</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {competitions.map((c) => (
                    <Button
                      key={c.id}
                      size="sm"
                      variant={c.id === activeComp ? "default" : "outline"}
                      onClick={() => setActiveComp(c.id)}
                    >
                      {c.name} {c.status === "LOCKED" && <Lock className="h-3 w-3 ml-1" />}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                {CATEGORIES.map((c) => {
                  const catEntries = entries.filter((e) => e.category === c.key);
                  const allSubmitted = catEntries.length > 0 && catEntries.every((e) => scores[e.id]?.is_submitted);
                  return (
                    <TabsTrigger key={c.key} value={c.key}>
                      {c.label}
                      {allSubmitted && <CheckCircle2 className="h-3 w-3 ml-1 text-green-500" />}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {CATEGORIES.map((c) => {
                const catEntries = entries.filter((e) => e.category === c.key);
                const scoredCount = catEntries.filter((e) => scores[e.id]).length;
                const submittedCount = catEntries.filter((e) => scores[e.id]?.is_submitted).length;
                const allSubmitted = catEntries.length > 0 && submittedCount === catEntries.length;
                return (
                  <TabsContent key={c.key} value={c.key} className="space-y-3">
                    <Card>
                      <CardContent className="pt-4 flex items-center justify-between">
                        <div className="text-sm">
                          एकूण: <b>{catEntries.length}</b> · दिले: <b>{scoredCount}</b> · submit: <b>{submittedCount}</b>
                        </div>
                        <Button
                          size="sm"
                          disabled={catEntries.length === 0 || allSubmitted || scoredCount < catEntries.length}
                          onClick={() => submitCategory(c.key)}
                        >
                          {allSubmitted ? "✓ Submitted" : "Final Submit"}
                        </Button>
                      </CardContent>
                    </Card>

                    {catEntries.length === 0 && (
                      <Card><CardContent className="p-8 text-center text-muted-foreground">या category त नोंदी नाहीत</CardContent></Card>
                    )}

                    <div className="grid sm:grid-cols-2 gap-3">
                      {catEntries.map((e) => {
                        const sc = scores[e.id];
                        const submitted = !!sc?.is_submitted;
                        return (
                          <Card key={e.id} className={submitted ? "border-green-500/50" : ""}>
                            <CardContent className="p-3 space-y-2">
                              <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
                                <img
                                  src={e.image_url}
                                  alt={e.entry_code}
                                  loading="lazy"
                                  decoding="async"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-0.5 rounded text-xs font-bold">
                                  {e.entry_code}
                                </div>
                                {submitted && (
                                  <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-0.5 rounded text-xs flex items-center gap-1">
                                    <Lock className="h-3 w-3" /> Locked
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  inputMode="decimal"
                                  min={0} max={10} step={0.1}
                                  placeholder="गुण (0-10)"
                                  value={draftMarks[e.id] ?? ""}
                                  onChange={(ev) => onMarksChange(e.id, ev.target.value)}
                                  disabled={submitted}
                                  className="text-lg font-bold"
                                />
                                {sc && !submitted && <span className="text-xs text-muted-foreground">draft</span>}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>

            <Card className="mt-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200">
              <CardContent className="p-3 flex gap-2 text-xs">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <div>नवीन नोंदी आल्यावर automatic दिसतील. प्रत्येक गुण auto-save होतो. एकदा "Final Submit" केले की बदल करता येणार नाही.</div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default JudgeDashboard;
