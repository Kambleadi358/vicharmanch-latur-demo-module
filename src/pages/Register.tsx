import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Loader2, UserPlus, CheckCircle2, Search, MessageCircle, RefreshCw, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

const categoryLabels: Record<string, string> = { chota: "छोटा गट", motha: "मोठा गट", khula: "खुला गट" };
const ADMIN_WA = "918275956954";

interface Member { id: string; name: string; household_id: string }

const Register = () => {
  const { toast } = useToast();
  const [comps, setComps] = useState<any[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [query, setQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [category, setCategory] = useState<string>("");
  const [competitionId, setCompetitionId] = useState<string>("");
  const [songFile, setSongFile] = useState<File | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: m }] = await Promise.all([
        supabase.from("competitions").select("id, name, program_id").eq("is_visible", true).order("created_at", { ascending: false }),
        supabase.from("household_members").select("id, name, household_id"),
      ]);
      setComps(c ?? []);
      setMembers((m as any) ?? []);
      setLoading(false);
    })();
  }, []);

  const selectedComp = comps.find((c) => c.id === competitionId);
  const isDance = (selectedComp?.name ?? "").includes("नृत्य");

  // Smart search: partial substring across name; deduped by id
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return members
      .filter((m) => m.name.toLowerCase().includes(q))
      .slice(0, 12);
  }, [query, members]);

  const noMatchVisible = query.trim().length >= 2 && matches.length === 0 && !selectedMember;

  const logMissing = async () => {
    await supabase.from("failed_participation_searches").insert({
      entered_name: query.trim(),
      competition_id: competitionId || null,
      competition_name: selectedComp?.name ?? null,
      user_agent: navigator.userAgent,
    });
  };

  const handleWhatsAppContact = async () => {
    await logMissing();
    const msg =
`*भारतरत्न डॉ बाबासाहेब आंबेडकर विचारमंच, लातूर*

जय भीम,
मी ${query.trim()}, माझे नाव समाज नोंदणीमध्ये उपलब्ध नाही. मला ${selectedComp?.name ?? "स्पर्धा"} मध्ये सहभाग नोंदवायचा आहे. कृपया माझी नोंदणी तपासून मार्गदर्शन करावे.

धन्यवाद.`;
    window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!competitionId) return toast({ title: "चूक", description: "कृपया स्पर्धा निवडा", variant: "destructive" });
    if (!category) return toast({ title: "चूक", description: "कृपया गट निवडा", variant: "destructive" });
    if (!selectedMember) return toast({ title: "चूक", description: "कृपया नोंदणीमधून नाव निवडा", variant: "destructive" });
    if (songFile && songFile.size > 15 * 1024 * 1024) {
      return toast({ title: "फाइल मोठी", description: "१५ MB पेक्षा कमी", variant: "destructive" });
    }

    setSubmitting(true);
    const { data: inserted, error } = await supabase.from("participants").insert({
      name: selectedMember.name,
      category, competition_id: competitionId,
      household_member_id: selectedMember.id,
    }).select().single();

    if (error) {
      setSubmitting(false);
      if (error.code === "23505" || /duplicate/i.test(error.message)) {
        return toast({ title: "आधीच नोंदणी झाली", description: "या स्पर्धेसाठी आपली नोंदणी आधीच आहे.", variant: "destructive" });
      }
      return toast({ title: "नोंदणी अयशस्वी", description: error.message, variant: "destructive" });
    }

    if (isDance && songFile && inserted) {
      const ext = songFile.name.split(".").pop() || "mp3";
      const path = `${inserted.id}.${ext}`;
      const up = await supabase.storage.from("participation-songs").upload(path, songFile, { upsert: true });
      if (!up.error) {
        await supabase.from("participation_songs").insert({
          participant_id: inserted.id, file_path: path,
          original_filename: songFile.name, mime: songFile.type, size_bytes: songFile.size,
        });
      }
    }

    setSubmitting(false);
    setDone(true);
    toast({ title: "नोंदणी यशस्वी!", description: "आपली सहभागी नोंदणी पूर्ण झाली." });
  };

  const resetForm = () => {
    setQuery(""); setSelectedMember(null); setCategory(""); setCompetitionId("");
    setSongFile(null); setDone(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 mt-20">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <UserPlus className="h-6 w-6 text-accent" /> सहभागी नोंदणी
              </CardTitle>
              <CardDescription>स्पर्धेत सहभागी होण्यासाठी समाज नोंदणीमधून आपले नाव निवडा</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
              ) : done ? (
                <div className="text-center py-8 space-y-4">
                  <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
                  <h3 className="text-xl font-bold">नोंदणी यशस्वी!</h3>
                  <Button onClick={resetForm}>आणखी एक नोंदणी करा</Button>
                </div>
              ) : comps.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">सध्या कोणतीही स्पर्धा उपलब्ध नाही</p>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="competition">स्पर्धा निवडा *</Label>
                    <Select value={competitionId} onValueChange={(v) => { setCompetitionId(v); }}>
                      <SelectTrigger id="competition"><SelectValue placeholder="स्पर्धा निवडा" /></SelectTrigger>
                      <SelectContent>
                        {comps.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>गट *</Label>
                    <RadioGroup value={category} onValueChange={setCategory} className="grid grid-cols-3 gap-2">
                      {(["chota", "motha", "khula"] as const).map((c) => (
                        <Label key={c} htmlFor={`cat-${c}`}
                          className={`flex items-center justify-center gap-2 border rounded-md p-3 cursor-pointer transition-colors ${category === c ? "border-accent bg-accent/10" : "border-border"}`}>
                          <RadioGroupItem value={c} id={`cat-${c}`} />
                          <span className="text-sm font-medium">{categoryLabels[c]}</span>
                        </Label>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="search">सहभागीचे नाव * (समाज नोंदणीमधून निवडा)</Label>
                    {selectedMember ? (
                      <div className="flex items-center justify-between gap-2 rounded-md border bg-accent/5 p-3">
                        <div>
                          <p className="font-semibold text-sm">{selectedMember.name}</p>
                          <p className="text-[11px] text-muted-foreground">समाज नोंदणीमधून निवडले</p>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => { setSelectedMember(null); setQuery(""); }}>
                          बदला
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="पूर्ण नाव मराठीत टाका (नाव आडनाव)"
                            className="pl-9"
                            autoComplete="off"
                          />
                        </div>
                        {matches.length > 0 && (
                          <div className="border rounded-md divide-y max-h-64 overflow-y-auto">
                            {matches.map((m) => (
                              <button key={m.id} type="button" onClick={() => setSelectedMember(m)}
                                className="w-full text-left px-3 py-2 hover:bg-muted/60 text-sm">
                                {m.name}
                              </button>
                            ))}
                          </div>
                        )}
                        {noMatchVisible && (
                          <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 space-y-3">
                            <div className="flex gap-2 items-start">
                              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-amber-900 dark:text-amber-200">
                                आपले नाव नोंदणीमध्ये उपलब्ध नाही. स्पर्धेमध्ये सहभाग घेण्यासाठी प्रथम नोंदणीमध्ये आपली माहिती असणे आवश्यक आहे.
                              </p>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <Button type="button" size="sm" onClick={handleWhatsAppContact} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                <MessageCircle className="h-4 w-4 mr-1" /> प्रशासनाशी संपर्क साधा
                              </Button>
                              <Button type="button" size="sm" variant="outline" onClick={() => setQuery("")}>
                                <RefreshCw className="h-4 w-4 mr-1" /> पुन्हा शोधा
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {isDance && (
                    <div className="space-y-2 rounded-lg border border-accent/40 bg-accent/5 p-3">
                      <Label htmlFor="song" className="text-sm">गाण्याची फाइल (MP3/M4A/WAV, १५ MB पर्यंत)</Label>
                      <Input id="song" type="file" accept="audio/*" onChange={(e) => setSongFile(e.target.files?.[0] ?? null)} />
                      <p className="text-[10px] text-muted-foreground">नृत्य स्पर्धेसाठी ऐच्छिक.</p>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={submitting || !selectedMember}>
                    {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> नोंदणी होत आहे...</> : <><UserPlus className="h-4 w-4 mr-2" /> नोंदणी करा</>}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Register;
