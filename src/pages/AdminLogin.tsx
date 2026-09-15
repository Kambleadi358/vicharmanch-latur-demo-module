import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Shield, Mail, Lock, ArrowLeft, KeyRound } from "lucide-react";

type ResetStep = "request" | "verify";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Security-question reset state
  const [resetOpen, setResetOpen] = useState(false);
  const [resetStep, setResetStep] = useState<ResetStep>("request");
  const [resetEmail, setResetEmail] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>(["", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetBusy, setResetBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "लॉगिन त्रुटी", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "यशस्वी लॉगिन", description: "Admin Dashboard मध्ये स्वागत आहे!" });
        navigate("/admin");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openReset = () => {
    setResetEmail(email.trim());
    setResetStep("request");
    setQuestions([]);
    setAnswers(["", "", ""]);
    setNewPassword("");
    setConfirmPassword("");
    setResetOpen(true);
  };

  const loadQuestions = async () => {
    if (!resetEmail.trim()) {
      toast({ title: "ईमेल आवश्यक", variant: "destructive" });
      return;
    }
    setResetBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-reset-password", {
        body: { action: "questions", email: resetEmail.trim() },
      });
      if (error || (data as any)?.error) {
        toast({
          title: "सुरक्षा प्रश्न सापडले नाहीत",
          description: (data as any)?.error || "प्रथम प्रशासक पॅनेलमधून सुरक्षा प्रश्न सेट करा.",
          variant: "destructive",
        });
        return;
      }
      setQuestions((data as any).questions || []);
      setResetStep("verify");
    } finally {
      setResetBusy(false);
    }
  };

  const verifyAndReset = async () => {
    if (answers.some((a) => a.trim().length < 1)) {
      toast({ title: "तीनही उत्तरे भरा", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "पासवर्ड किमान ८ अक्षरांचा असावा", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "पासवर्ड जुळत नाहीत", variant: "destructive" });
      return;
    }

    setResetBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-reset-password", {
        body: { action: "reset", email: resetEmail.trim(), answers, new_password: newPassword },
      });
      if (error || (data as any)?.error) {
        toast({ title: "रीसेट अयशस्वी", description: (data as any)?.error || "उत्तरे तपासा", variant: "destructive" });
        return;
      }
      toast({ title: "पासवर्ड बदलला!", description: "नवीन पासवर्डने लॉगिन करा." });
      setResetOpen(false);
    } finally {
      setResetBusy(false);
    }
  };


  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> मुख्यपृष्ठावर परत जा
        </Link>

        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription>विचारमंच प्रशासक पॅनेलमध्ये प्रवेश करा</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">ईमेल</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-11" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">पासवर्ड</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-11" required />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={openReset} className="text-primary hover:underline inline-flex items-center gap-1">
                  <KeyRound className="h-3.5 w-3.5" /> पासवर्ड विसरलात?
                </button>
              </div>

              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? "लॉगिन होत आहे..." : "लॉगिन करा"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                खाते नाही?{" "}
                <Link to="/admin-signup" className="text-primary hover:underline">साइन अप करा</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security-question Reset Dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> सुरक्षा प्रश्नांद्वारे पासवर्ड रीसेट</DialogTitle>
            <DialogDescription>
              {resetStep === "request"
                ? "नोंदणीकृत ईमेल टाका. तुमचे सुरक्षा प्रश्न दाखवले जातील."
                : "तीनही उत्तरे व नवीन पासवर्ड टाका."}
            </DialogDescription>
          </DialogHeader>

          {resetStep === "request" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>ईमेल</Label>
                <Input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="h-11" />
              </div>
              <Button onClick={loadQuestions} disabled={resetBusy} className="w-full h-11">
                {resetBusy ? "तपासत आहे..." : "पुढे"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q, i) => (
                <div key={i} className="space-y-2">
                  <Label className="text-xs">{q}</Label>
                  <Input
                    value={answers[i]}
                    onChange={(e) => setAnswers((p) => p.map((a, j) => (j === i ? e.target.value : a)))}
                    className="h-11"
                    placeholder="उत्तर"
                  />
                </div>
              ))}
              <div className="space-y-2">
                <Label>नवीन पासवर्ड</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label>पुन्हा टाका</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-11" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setResetStep("request")} disabled={resetBusy} className="flex-1 h-11">मागे</Button>
                <Button onClick={verifyAndReset} disabled={resetBusy} className="flex-1 h-11">
                  {resetBusy ? "बदलत..." : "पासवर्ड बदला"}
                </Button>
              </div>
            </div>
          )}

        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLogin;
