// Admin security questions — cost-free password recovery (no SMS/email OTP)
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { HelpCircle, Loader2, Save, ShieldCheck } from "lucide-react";
import { hashAnswer, SECURITY_QUESTION_OPTIONS } from "@/lib/securityAnswers";

const SecurityQuestions = () => {
  const { user } = useAuth();
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [qs, setQs] = useState<string[]>([
    SECURITY_QUESTION_OPTIONS[0],
    SECURITY_QUESTION_OPTIONS[1],
    SECURITY_QUESTION_OPTIONS[2],
  ]);
  const [answers, setAnswers] = useState<string[]>(["", "", ""]);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase
        .from("admin_security_questions")
        .select("q1, q2, q3")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setConfigured(true);
        setQs([data.q1, data.q2, data.q3]);
      }
      setLoading(false);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    if (new Set(qs).size !== 3) return toast.error("तीन वेगवेगळे प्रश्न निवडा");
    if (answers.some((a) => a.trim().length < 2)) return toast.error("तीनही उत्तरे भरा (किमान २ अक्षरे)");
    setSaving(true);
    try {
      const [a1, a2, a3] = await Promise.all(answers.map((a) => hashAnswer(user.id, a)));
      const { error } = await supabase.from("admin_security_questions").upsert({
        user_id: user.id,
        q1: qs[0], a1_hash: a1,
        q2: qs[1], a2_hash: a2,
        q3: qs[2], a3_hash: a3,
      });
      if (error) throw error;
      setConfigured(true);
      setAnswers(["", "", ""]);
      toast.success("सुरक्षा प्रश्न जतन झाले");
    } catch (e: any) {
      toast.error(e.message || "जतन करता आले नाही");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <HelpCircle className="h-4 w-4" /> सुरक्षा प्रश्न
          {configured && <Badge variant="secondary" className="gap-1"><ShieldCheck className="h-3 w-3" /> सक्रिय</Badge>}
        </CardTitle>
        <CardDescription>
          पासवर्ड विसरल्यास OTP शिवाय, या तीन प्रश्नांच्या उत्तरांनी पासवर्ड पुन्हा सेट करता येईल.
          उत्तरे एन्क्रिप्ट स्वरूपात जतन होतात व कुणालाही दिसत नाहीत.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="py-6 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
        ) : (
          <>
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-1.5">
                <Label className="text-xs">प्रश्न {i + 1}</Label>
                <Select value={qs[i]} onValueChange={(v) => setQs((p) => p.map((q, j) => (j === i ? v : q)))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SECURITY_QUESTION_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="उत्तर"
                  value={answers[i]}
                  onChange={(e) => setAnswers((p) => p.map((a, j) => (j === i ? e.target.value : a)))}
                />
              </div>
            ))}
            <Button onClick={save} disabled={saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {configured ? "सुरक्षा प्रश्न अद्ययावत करा" : "सुरक्षा प्रश्न जतन करा"}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              टीप: उत्तरे लक्षात ठेवा. लहान-मोठ्या अक्षरांचा फरक पडत नाही.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SecurityQuestions;
