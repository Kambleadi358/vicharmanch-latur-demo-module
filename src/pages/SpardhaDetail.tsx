// Public competition detail: gallery + voting
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
  { key: "chota", label: "चोटा गट" },
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

const SpardhaDetail = () => {
  const { id } = useParams();
  const [comp, setComp] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<"chota" | "motha" | "khula">("chota");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Voting state per category
  const [voteOpen, setVoteOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [picks, setPicks] = useState<{ first?: string; second?: string; third?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) return;
      // First fetch comp to know if LOCKED → only then request participant_name
      const { data: c } = await supabase
        .from("competitions")
        .select("id, name, status, programs(name)")
        .eq("id", id)
        .maybeSingle();
      setComp(c);
      const cols = c?.status === "LOCKED"
        ? "id, entry_code, category, image_url, participant_name"
        : "id, entry_code, category, image_url";
      const { data: e } = await supabase
        .from("competition_entries")
        .select(cols)
        .eq("competition_id", id)
        .order("entry_code");
      setEntries(e ?? []);
      setLoading(false);
    })();
  }, [id]);

  const isLocked = comp?.status === "LOCKED";
  const votingEnabled = isLocked;

  const showName = (e: any) => isLocked ? e.participant_name : null;

  const votedKey = (cat: string) => `voted_${id}_${cat}`;
  const hasVoted = (cat: string) => !!localStorage.getItem(votedKey(cat));

  const togglePick = (slot: "first" | "second" | "third", entryId: string) => {
    setPicks((p) => {
      const next = { ...p };
      // If this entry is already in another slot, remove it
      (Object.keys(next) as Array<"first" | "second" | "third">).forEach((k) => {
        if (next[k] === entryId) delete next[k];
      });
      next[slot] = entryId;
      return next;
    });
  };

  const submitVote = async () => {
    if (!id) return;
    if (!phone || phone.replace(/\D/g, "").length < 10) { toast.error("वैध 10-अंकी मोबाइल नंबर द्या"); return; }
    if (!picks.first || !picks.second || !picks.third) { toast.error("तीन निवडा"); return; }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("public-vote", {
        body: {
          competition_id: id,
          category: activeCategory,
          voter_phone: phone,
          device_fingerprint: fingerprint(),
          first_entry_id: picks.first,
          second_entry_id: picks.second,
          third_entry_id: picks.third,
        },
      });
      if (error || (data as any)?.error) {
        toast.error((data as any)?.error || "मतदान अयशस्वी");
        return;
      }
      localStorage.setItem(votedKey(activeCategory), "1");
      toast.success("धन्यवाद! आपले मत नोंदले गेले");
      setVoteOpen(false);
      setPicks({}); setPhone("");
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
                return (
                  <TabsContent key={c.key} value={c.key} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">{list.length} नोंदी</p>
                      <Button
                        size="sm"
                        disabled={voted || list.length < 3 || !votingEnabled}
                        onClick={() => { setPicks({}); setVoteOpen(true); }}
                      >
                        <Vote className="h-4 w-4 mr-1" />
                        {voted ? "मतदान केले" : votingEnabled ? "मतदान करा" : "Lock नंतर मतदान"}
                      </Button>
                    </div>

                    {list.length === 0 ? (
                      <Card><CardContent className="p-12 text-center text-muted-foreground">कोणतीही नोंद नाही</CardContent></Card>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {list.map((e) => (
                          <Card key={e.id} className="overflow-hidden">
                            <button onClick={() => setPreviewUrl(e.image_url)} className="block w-full">
                              <img src={e.image_url} alt={e.entry_code} loading="lazy" className="w-full aspect-square object-cover" />
                            </button>
                            <CardContent className="p-2 text-xs flex items-center justify-between">
                              <div>
                                <div className="font-bold">{e.entry_code}</div>
                                {showName(e) && <div className="text-muted-foreground truncate">{e.participant_name}</div>}
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
          {previewUrl && <img src={previewUrl} className="w-full h-auto rounded" />}
        </DialogContent>
      </Dialog>

      {/* Vote dialog */}
      <Dialog open={voteOpen} onOpenChange={setVoteOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <CardHeader className="p-0 pb-3">
            <CardTitle>{CATEGORIES.find((c) => c.key === activeCategory)?.label} — मतदान</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <div>
              <Label>मोबाइल नंबर</Label>
              <Input type="tel" inputMode="numeric" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98XXXXXXXX" />
            </div>
            <div>
              <Label>आपली निवड (1ला, 2रा, 3रा क्रमांक)</Label>
              <p className="text-xs text-muted-foreground mb-2">चित्रावर क्लिक करून slot निवडा</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {(["first", "second", "third"] as const).map((slot, i) => {
                  const ent = entries.find((e) => e.id === picks[slot]);
                  return (
                    <div key={slot} className="border-2 border-dashed border-muted rounded-lg p-2 min-h-[100px]">
                      <div className="text-xs font-semibold text-center mb-1">{i + 1}ला क्रमांक</div>
                      {ent ? (
                        <div className="relative">
                          <img src={ent.image_url} className="w-full aspect-square object-cover rounded" />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs text-center py-0.5">{ent.entry_code}</div>
                        </div>
                      ) : <div className="text-xs text-muted-foreground text-center py-6">रिक्त</div>}
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto p-1">
                {entries.filter((e) => e.category === activeCategory).map((e) => {
                  const slot = (Object.keys(picks) as Array<"first" | "second" | "third">).find((k) => picks[k] === e.id);
                  return (
                    <div key={e.id} className="space-y-1">
                      <div className={`relative cursor-pointer border-2 rounded ${slot ? "border-accent" : "border-transparent"}`}>
                        <img src={e.image_url} className="w-full aspect-square object-cover rounded" />
                        <div className="absolute top-0 left-0 bg-black/60 text-white text-[10px] px-1 rounded-br">{e.entry_code}</div>
                        {slot && (
                          <div className="absolute top-0 right-0 bg-accent text-accent-foreground text-[10px] font-bold px-1 rounded-bl">
                            {slot === "first" ? "1" : slot === "second" ? "2" : "3"}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-0.5">
                        {(["first", "second", "third"] as const).map((s, i) => (
                          <button
                            key={s}
                            onClick={() => togglePick(s, e.id)}
                            className={`flex-1 text-[10px] py-0.5 rounded ${picks[s] === e.id ? "bg-accent text-accent-foreground" : "bg-muted"}`}
                          >{i + 1}</button>
                        ))}
                      </div>
                    </div>
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
