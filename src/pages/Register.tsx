import { useEffect, useState } from "react";
import { z } from "zod";
import { motion } from "framer-motion";
import { Loader2, UserPlus, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().trim().min(2, "नाव किमान २ अक्षरांचे असावे").max(100, "नाव १०० अक्षरांपेक्षा कमी असावे"),
  category: z.enum(["chota", "motha", "khula"], {
    errorMap: () => ({ message: "कृपया गट निवडा" }),
  }),
  competition_id: z.string().uuid("कृपया स्पर्धा निवडा"),
});

const categoryLabels: Record<string, string> = {
  chota: "छोटा गट",
  motha: "मोठा गट",
  khula: "खुला गट",
};

const Register = () => {
  const { toast } = useToast();
  const [comps, setComps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("");
  const [competitionId, setCompetitionId] = useState<string>("");

  useEffect(() => {
    (async () => {
      // Competitions are auto-synced 1:1 with Programs (DB trigger).
      // Showing competitions ensures judges + scoring all share the same id.
      const { data } = await supabase
        .from("competitions")
        .select("id, name, program_id")
        .eq("is_visible", true)
        .order("created_at", { ascending: false });
      setComps(data ?? []);
      setLoading(false);
    })();
  }, []);

  const [songFile, setSongFile] = useState<File | null>(null);
  const selectedComp = comps.find((c) => c.id === competitionId);
  const isDance = (selectedComp?.name ?? "").includes("नृत्य");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ name, category, competition_id: competitionId });
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? "कृपया योग्य माहिती भरा";
      toast({ title: "चूक", description: firstError, variant: "destructive" });
      return;
    }
    if (songFile && songFile.size > 15 * 1024 * 1024) {
      toast({ title: "फाइल मोठी आहे", description: "गाण्याची फाइल १५ MB पेक्षा कमी हवी", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { data: inserted, error } = await supabase.from("participants").insert({
      name: parsed.data.name,
      category: parsed.data.category,
      competition_id: parsed.data.competition_id,
    }).select().single();
    if (error) {
      setSubmitting(false);
      toast({ title: "नोंदणी अयशस्वी", description: error.message, variant: "destructive" });
      return;
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
    toast({ title: "नोंदणी यशस्वी!", description: "आपली सहभागी नोंदणी यशस्वीरित्या पूर्ण झाली." });
  };

  const resetForm = () => {
    setName("");
    setCategory("");
    setCompetitionId("");
    setDone(false);
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
              <CardDescription>स्पर्धेत सहभागी होण्यासाठी आपली माहिती भरा</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : done ? (
                <div className="text-center py-8 space-y-4">
                  <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
                  <h3 className="text-xl font-bold">नोंदणी यशस्वी!</h3>
                  <p className="text-muted-foreground">आपली सहभागी नोंदणी झाली आहे.</p>
                  <Button onClick={resetForm}>आणखी एक नोंदणी करा</Button>
                </div>
              ) : comps.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  सध्या कोणतीही स्पर्धा उपलब्ध नाही
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">सहभागीचे नाव *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="आपले पूर्ण नाव"
                      maxLength={100}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>गट *</Label>
                    <RadioGroup value={category} onValueChange={setCategory} className="grid grid-cols-3 gap-2">
                      {(["chota", "motha", "khula"] as const).map((c) => (
                        <Label
                          key={c}
                          htmlFor={`cat-${c}`}
                          className={`flex items-center justify-center gap-2 border rounded-md p-3 cursor-pointer transition-colors ${
                            category === c ? "border-accent bg-accent/10" : "border-border"
                          }`}
                        >
                          <RadioGroupItem value={c} id={`cat-${c}`} />
                          <span className="text-sm font-medium">{categoryLabels[c]}</span>
                        </Label>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="competition">स्पर्धा निवडा *</Label>
                    <Select value={competitionId} onValueChange={setCompetitionId}>
                      <SelectTrigger id="competition">
                        <SelectValue placeholder="स्पर्धा निवडा" />
                      </SelectTrigger>
                      <SelectContent>
                        {comps.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {isDance && (
                    <div className="space-y-2 rounded-lg border border-accent/40 bg-accent/5 p-3">
                      <Label htmlFor="song" className="text-sm">गाण्याची फाइल (MP3/M4A/WAV, १५ MB पर्यंत)</Label>
                      <Input id="song" type="file" accept="audio/*" onChange={(e) => setSongFile(e.target.files?.[0] ?? null)} />
                      <p className="text-[10px] text-muted-foreground">नृत्य स्पर्धेसाठी आपले गाणे अपलोड करा. ऐच्छिक.</p>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> नोंदणी होत आहे...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" /> नोंदणी करा
                      </>
                    )}
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
