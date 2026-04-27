import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

const JudgeLogin = () => {
  const nav = useNavigate();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Normalize: trim, uppercase, replace common O→0 typo (J001 not Joo1)
  const normalizeCode = (raw: string) =>
    raw.trim().toUpperCase().replace(/O/g, "0");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeCode(code);
    if (!normalized || !password) { toast.error("दोन्ही फील्ड भरा"); return; }
    if (!/^J\d{3,}$/.test(normalized)) {
      toast.error("Judge ID 'J' + अंकांचा असावा (उदा. J001). 'O' च्या ऐवजी '0' टाका.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("judge-login", {
        body: { judge_code: normalized, password },
      });
      if (error || (data as any)?.error) {
        toast.error((data as any)?.error || "लॉगिन अयशस्वी. ID व पासवर्ड तपासा.");
        return;
      }
      const d = data as any;
      localStorage.setItem("judge_token", d.token);
      localStorage.setItem("judge_info", JSON.stringify(d.judge));
      toast.success("स्वागत आहे, " + d.judge.display_name);
      nav("/judge");
    } catch (err: any) {
      toast.error(err?.message ?? "server त्रुटी");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>न्यायाधीश लॉगिन</CardTitle>
          <CardDescription>आपला Judge ID व पासवर्ड टाका</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>Judge ID</Label>
              <Input
                value={code}
                onChange={(e) => setCode(normalizeCode(e.target.value))}
                placeholder="J001"
                autoComplete="username"
                autoCapitalize="characters"
                spellCheck={false}
                inputMode="text"
                className="font-mono uppercase tracking-wider"
              />
              <p className="text-xs text-muted-foreground mt-1">
                फॉर्मॅट: <b>J</b> + ३ अंक (उदा. <code>J001</code>). अंक <b>शून्य 0</b> आहे, अक्षर <b>O</b> नव्हे.
              </p>
            </div>
            <div>
              <Label>पासवर्ड</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
              <p className="text-xs text-muted-foreground mt-1">
                पासवर्ड ॲडमिनकडून मिळवा. विसरला असाल तर ॲडमिनला नवीन पासवर्ड generate करायला सांगा.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              लॉगिन करा
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default JudgeLogin;
