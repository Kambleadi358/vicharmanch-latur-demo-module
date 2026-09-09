// Public competition detail: gallery + single-choice voting + top 10 results
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2, Download, Trophy, Vote, Check, X } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES: { key: "chota" | "motha" | "khula"; label: string }[] = [
  { key: "chota", label: "छोटा गट" },
  { key: "motha", label: "मोठा गट" },
  { key: "khula", label: "खुला गट" },
];

// Stable device fingerprint (no DST drift; persisted across sessions)
const fingerprint = () => {
  const KEY = "vmanch_dev_fp";
  let stored = localStorage.getItem(KEY);
  if (stored) return stored;
  const data = [
    navigator.userAgent,
    navigator.language,
    String(screen.width) + "x" + String(screen.height),
    String(screen.colorDepth),
    String(screen.availWidth) + "x" + String(screen.availHeight),
    navigator.hardwareConcurrency || "0",
    (navigator as any).deviceMemory || "0",
    Intl.DateTimeFormat().resolvedOptions().timeZone || "",
  ].join("|");
  let h = 0;
  for (let i = 0; i < data.length; i++) { h = ((h << 5) - h) + data.charCodeAt(i); h |= 0; }
  stored = "fp_" + Math.abs(h).toString(36) + "_" + crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
  localStorage.setItem(KEY, stored);
  return stored;
};

interface Tally { entry_id: string; entry_code: string; category: string; votes: number }

const SpardhaDetail = () => {
  const { id } = useParams();
  const [comp, setComp] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<"chota" | "motha" | "khula">("chota");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [tally, setTally] = useState<Tally[]>([]);

  // Voting state per category
  const [voteOpen, setVoteOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [voterName, setVoterName] = useState("");
  const [pick, setPick] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [votedTick, setVotedTick] = useState(0);

  const loadTally = async (compId: string) => {
    const { data } = await (supabase as any).rpc("get_vote_tally", { _competition_id: compId });
    setTally(((data as Tally[]) ?? []).map((t) => ({ ...t, votes: Number(t.votes) })));
  };

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data: c } = await supabase
        .from("competitions")
        .select("id, name, status, programs(name)")
        .eq("id", id)
        .maybeSingle();
      setComp(c);
      // Public UI: NEVER expose participant name — show entry ID only
      const { data: e } = await supabase
        .from("competition_entries")
        .select("id, entry_code, category, image_url")
        .eq("competition_id", id)
        .order("entry_code");
      setEntries(e ?? []);
      await loadTally(id);
      setLoading(false);
    })();
  }, [id]);

  const votingEnabled = comp?.status === "LOCKED";

  const votedKey = (cat: string) => `voted_${id}_${cat}`;
  const hasVoted = (cat: string) => { void votedTick; return !!localStorage.getItem(votedKey(cat)); };

  const voteMap = useMemo(() => {
    const m = new Map<string, number>();
    tally.forEach((t) => m.set(t.entry_id, t.votes));
    return m;
  }, [tally]);

  const submitVote = async () => {
    if (!id) return;
    if (voterName.trim().length < 2) { toast.error("आपले नाव लिहा"); return; }
    if (!phone || phone.replace(/\D/g, "").length < 10) { toast.error("वैध 10-अंकी मोबाइल नंबर द्या"); return; }
    if (!pick) { toast.error("एक रांगोळी निवडा"); return; }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("public-vote", {
        body: {
          competition_id: id,
          category: activeCategory,
          voter_phone: phone,
          voter_name: voterName,
          device_fingerprint: fingerprint(),
          entry_id: pick,
        },
      });
      if (error || (data as any)?.error) {
        toast.error((data as any)?.error || "मतदान अयशस्वी");
        return;
      }
      localStorage.setItem(votedKey(activeCategory), "1");
      setVotedTick((t) => t + 1);
      toast.success("धन्यवाद! आपले मत नोंदले गेले");
      setVoteOpen(false);
      setPick(null); setPhone(""); setVoterName("");
      await loadTally(id);
    } finally { setSubmitting(false); }
  };

  const downloadImage = async (url: string, name: string) => {
    try {
      const r = await fetch(url);
      const b = await r.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = name + ".webp";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch { toast.error("Download अयशस्वी"); }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto w-full px-3 py-6">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : !comp ? (
          <Card><CardContent className="p-12 text-center">स्पर्धा सापडली नाही</CardContent></Card>
        ) : (
          <>
            <div className="mb-4">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Trophy className="h-6 w-6 text-accent" /> {comp.name}
              </h1>
              <p className="text-sm text-muted-foreground">{(comp.programs as any)?.name}</p>
            </div>

            <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                {CATEGORIES.map((c) => <TabsTrigger key={c.key} value={c.key}>{c.label}</TabsTrigger>)}
              </TabsList>

              {CATEGORIES.map((c) => {
                const list = entries.filter((e) => e.category === c.key);
                const voted = hasVoted(c.key);
                const totalVotes = list.reduce((s, e) => s + (voteMap.get(e.id) || 0), 0);
                const top10 = list
                  .map((e) => ({ ...e, votes: voteMap.get(e.id) || 0 }))
                  .filter((e) => e.votes > 0)
                  .sort((a, b) => b.votes - a.votes || a.entry_code.localeCompare(b.entry_code))
                  .slice(0, 10);
                const maxVotes = top10[0]?.votes || 0;
                return (
                  <TabsContent key={c.key} value={c.key} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">{list.length} नोंदी · {totalVotes} मते</p>
                      <Button
                        size="sm"
                        disabled={voted || list.length === 0 || !votingEnabled}
                        onClick={() => { setPick(null); setVoteOpen(true); }}
                      >
                        <Vote className="h-4 w-4 mr-1" />
                        {voted ? "मतदान केले" : votingEnabled ? "मतदान करा" : "Lock नंतर मतदान"}
                      </Button>
                    </div>

                    {/* Top 10 public results */}
                    {top10.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-accent" /> सर्वाधिक मते — टॉप १० ({c.label})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {top10.map((r, i) => (
                            <div key={r.id} className="flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-md flex items-center justify-center text-sm font-bold shrink-0 ${
                                i < 3 ? "bg-accent text-accent-foreground" : "bg-muted text-foreground"
                              }`}>{i + 1}</div>
                              <button onClick={() => setPreviewUrl(r.image_url)} className="shrink-0">
                                <img src={r.image_url} alt={`रांगोळी ${r.entry_code}`} loading="lazy"
                                  className="h-12 w-12 rounded object-cover border" />
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="font-mono text-sm font-bold">{r.entry_code}</div>
                                <div className="h-2 bg-muted rounded overflow-hidden mt-1">
                                  <div className="h-full bg-primary rounded"
                                    style={{ width: `${maxVotes ? Math.round((r.votes / maxVotes) * 100) : 0}%` }} />
                                </div>
                              </div>
                              <div className="text-right shrink-0 w-16">
                                <span className="text-base font-bold text-primary">{r.votes}</span>
                                <span className="text-[10px] text-muted-foreground block leading-none">मते</span>
                              </div>
                            </div>
                          ))}
                          <p className="text-[11px] text-muted-foreground pt-1">
                            गोपनीयतेसाठी सार्वजनिक पानावर फक्त नोंद क्रमांक दिसतो — सहभागींची नावे दाखवली जात नाहीत.
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {list.length === 0 ? (
                      <Card><CardContent className="p-12 text-center text-muted-foreground">कोणतीही नोंद नाही</CardContent></Card>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {list.map((e) => (
                          <Card key={e.id} className="overflow-hidden">
                            <button onClick={() => setPreviewUrl(e.image_url)} className="block w-full">
                              <img src={e.image_url} alt={`रांगोळी नोंद ${e.entry_code}`} loading="lazy" className="w-full aspect-square object-cover" />
                            </button>
                            <CardContent className="p-2 text-xs flex items-center justify-between">
                              <div>
                                <div className="font-bold">{e.entry_code}</div>
                                <div className="text-[10px] text-muted-foreground">{voteMap.get(e.id) || 0} मते</div>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => downloadImage(e.image_url, e.entry_code)} className="h-7 w-7 p-0">
                                <Download className="h-3 w-3" />
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </>
        )}
      </main>
      <Footer />

      {/* Image preview */}
      <Dialog open={!!previewUrl} onOpenChange={(o) => !o && setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl p-2">
          {previewUrl && <img src={previewUrl} alt="रांगोळी" className="w-full h-auto rounded" />}
        </DialogContent>
      </Dialog>

      {/* Vote dialog — single choice */}
      <Dialog open={voteOpen} onOpenChange={setVoteOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <CardHeader className="p-0 pb-3">
            <CardTitle>{CATEGORIES.find((c) => c.key === activeCategory)?.label} — मतदान</CardTitle>
            <p className="text-xs text-muted-foreground">एका गटात फक्त एकच रांगोळी निवडता येते. एक मोबाइल नंबर = एक मत.</p>
          </CardHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>आपले नाव</Label>
                <Input value={voterName} onChange={(e) => setVoterName(e.target.value)} placeholder="पूर्ण नाव" />
              </div>
              <div>
                <Label>मोबाइल नंबर</Label>
                <Input type="tel" inputMode="numeric" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98XXXXXXXX" />
              </div>
            </div>
            <div>
              <Label>आपली निवड</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-72 overflow-y-auto p-1 mt-2">
                {entries.filter((e) => e.category === activeCategory).map((e) => {
                  const selected = pick === e.id;
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setPick(e.id)}
                      className={`relative rounded border-2 overflow-hidden transition-all ${selected ? "border-accent ring-2 ring-accent/40" : "border-transparent"}`}
                    >
                      <img src={e.image_url} alt={`रांगोळी ${e.entry_code}`} className="w-full aspect-square object-cover" />
                      <span className="absolute top-0 left-0 bg-black/60 text-white text-[10px] px-1 rounded-br">{e.entry_code}</span>
                      {selected && (
                        <span className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                          <Check className="h-6 w-6 text-accent-foreground bg-accent rounded-full p-1" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setVoteOpen(false)}><X className="h-4 w-4 mr-1" /> रद्द</Button>
              <Button onClick={submitVote} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                मत नोंदवा
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SpardhaDetail;
