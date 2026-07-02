import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Clock, Award, AlertTriangle, CheckCircle, Loader2, Calendar, ShieldAlert } from "lucide-react";

const rules = [
  "प्रश्नमंजुषा डॉ. बाबासाहेब आंबेडकरांच्या जीवनावर आधारित आहे",
  "प्रत्येक प्रश्नास १ गुण (नकारात्मक गुण नाहीत)",
  "उत्तर देण्यासाठी निश्चित वेळ — सर्व्हर वरून नियंत्रित",
  "प्रश्न आणि पर्यायांचा क्रम प्रत्येक सहभागीसाठी वेगळा",
  "टॅब बदलणे, copy/paste करणे प्रतिबंधित — मोजले जाईल",
  "प्रत्येक उत्तर आपोआप server वर save होते",
  "इंटरनेट गेल्यास उत्तरे local साठवतात व पुन्हा connect झाल्यावर sync होतात",
  "Page refresh / tab बंद केल्यास परीक्षा त्याच ठिकाणाहून सुरू राहते (timer सर्व्हर कडून)",
  "वेळ संपल्यावर परीक्षा आपोआप submit होईल",
];

type QuizConfig = {
  status: "UPCOMING" | "ACTIVE" | "COMPLETED";
  title: string;
  description: string | null;
  duration_seconds: number;
  publish_answer_key: boolean;
};

type AnswerKeyQ = {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: "A" | "B" | "C" | "D";
};

const Quiz = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [config, setConfig] = useState<QuizConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<"register" | "rules">("register");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [answerKey, setAnswerKey] = useState<AnswerKeyQ[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("quiz_config")
        .select("status, title, description, duration_seconds, publish_answer_key")
        .limit(1)
        .maybeSingle();
      setConfig(data as QuizConfig | null);
      if (data?.status === "COMPLETED" && (data as any).publish_answer_key) {
        const { data: qs } = await supabase
          .from("quiz_questions")
          .select("id, question, option_a, option_b, option_c, option_d, correct_answer")
          .order("display_order");
        setAnswerKey((qs as any) || []);
      }
      setIsLoading(false);
    })();
  }, []);

  const handleStart = async () => {
    if (name.trim().length < 2) {
      toast({ title: "त्रुटी", description: "कृपया तुमचे पूर्ण नाव लिहा", variant: "destructive" });
      return;
    }
    if (!dob) {
      toast({ title: "त्रुटी", description: "कृपया जन्मतारीख निवडा", variant: "destructive" });
      return;
    }
    setIsStarting(true);
    const { data, error } = await supabase.functions.invoke("quiz-start", {
      body: { participant_name: name.trim(), dob },
    });
    setIsStarting(false);

    if (error || !data || (data as any).error) {
      const msg = (data as any)?.error || error?.message || "त्रुटी आली";
      if ((data as any)?.already_submitted) {
        // Allow viewing result
        navigate(`/quiz/result?name=${encodeURIComponent(name.trim())}&dob=${dob}`);
        return;
      }
      toast({ title: "त्रुटी", description: msg, variant: "destructive" });
      return;
    }

    // Save lookup info for result lookup later
    sessionStorage.setItem("quiz_session_id", (data as any).session_id);
    sessionStorage.setItem("quiz_participant_name", name.trim());
    sessionStorage.setItem("quiz_participant_dob", dob);
    navigate("/quiz/take");
  };

  return (
    <Layout>
      <section className="hero-gradient py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-20 w-72 h-72 bg-accent rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-4">
              {config?.title ?? "विचारमंच प्रश्नमंजुषा"}
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-3xl mx-auto">
              समता, पारदर्शकता आणि न्यायाच्या मूल्यांवर आधारित प्रश्नमंजुषा मंच
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : config?.status === "UPCOMING" ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-10 text-center">
              <Clock className="mx-auto mb-4 text-accent" size={56} />
              <h2 className="text-2xl font-bold mb-3">प्रश्नमंजुषा लवकरच सुरू होईल</h2>
              <p className="text-muted-foreground">कृपया निर्धारित वेळेस पुन्हा भेट द्या.</p>
            </motion.div>
          ) : config?.status === "COMPLETED" ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="bg-card border border-border rounded-xl p-8 text-center space-y-6">
                <Award className="mx-auto text-accent" size={56} />
                <h2 className="text-2xl font-bold">प्रश्नमंजुषा संपली आहे</h2>
                <p className="text-muted-foreground">तुमचा निकाल पाहण्यासाठी नाव व जन्मतारीख टाका.</p>
                <div className="grid sm:grid-cols-2 gap-4 text-left max-w-md mx-auto">
                  <div>
                    <Label>पूर्ण नाव</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="पूर्ण नाव" />
                  </div>
                  <div>
                    <Label>जन्मतारीख</Label>
                    <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                  </div>
                </div>
                <Button
                  size="lg"
                  onClick={() => navigate(`/quiz/result?name=${encodeURIComponent(name.trim())}&dob=${dob}`)}
                  disabled={!name.trim() || !dob}
                >
                  निकाल पहा
                </Button>
              </div>

              {config.publish_answer_key && answerKey.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-6 sm:p-8">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="text-accent" size={22} />
                    <h3 className="text-xl font-bold">अधिकृत उत्तरतालिका</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-5">
                    हिरवा = योग्य उत्तर · लाल = चुकीचे पर्याय · सर्व सहभागींसाठी पारदर्शक जाहीर
                  </p>
                  <ol className="space-y-5">
                    {answerKey.map((q, i) => (
                      <li key={q.id} className="border-b border-border/70 pb-4 last:border-0">
                        <p className="font-semibold mb-3 leading-relaxed">
                          <span className="text-accent mr-1">प्र.{i + 1}.</span> {q.question}
                        </p>
                        <div className="grid sm:grid-cols-2 gap-2 text-sm">
                          {(["A", "B", "C", "D"] as const).map((k) => {
                            const label = q[`option_${k.toLowerCase()}` as "option_a"];
                            const isCorrect = q.correct_answer === k;
                            return (
                              <div
                                key={k}
                                className={`p-2.5 rounded-md border flex items-start gap-2 ${
                                  isCorrect
                                    ? "border-green-600 bg-green-500/10 text-green-800 dark:text-green-300"
                                    : "border-red-500/60 bg-red-500/5 text-red-800 dark:text-red-300"
                                }`}
                              >
                                <span className="font-bold">{k}.</span>
                                <span className="flex-1">{label}</span>
                                {isCorrect
                                  ? <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                                  : <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 opacity-60" />}
                              </div>
                            );
                          })}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </motion.div>
          ) : step === "register" ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-8 space-y-6">
              <div className="text-center">
                <BookOpen className="mx-auto text-accent mb-3" size={48} />
                <h2 className="text-2xl font-bold">सहभागी नोंदणी</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  नाव + जन्मतारीख ही तुमची ओळख आहे (एकदाच भाग घेता येईल)
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>तुमचे पूर्ण नाव *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="उदा. राजेश पाटील" />
                </div>
                <div>
                  <Label className="flex items-center gap-1"><Calendar size={14} /> जन्मतारीख *</Label>
                  <Input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="bg-muted rounded-lg p-4 flex items-center gap-3">
                  <Clock className="h-5 w-5 text-accent" />
                  <span>वेळ: <strong>{Math.floor((config?.duration_seconds ?? 1800) / 60)} मिनिटे</strong></span>
                </div>
                <Button className="w-full" size="lg" onClick={() => name.trim() && dob && setStep("rules")}>
                  पुढे जा
                </Button>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 pt-4">
                <div className="text-center p-4 rounded-lg border border-border">
                  <BookOpen className="mx-auto text-accent mb-2" size={24} />
                  <p className="text-xs text-muted-foreground">शुफल्ड प्रश्न आणि पर्याय</p>
                </div>
                <div className="text-center p-4 rounded-lg border border-border">
                  <ShieldAlert className="mx-auto text-accent mb-2" size={24} />
                  <p className="text-xs text-muted-foreground">सर्व्हर-नियंत्रित timer</p>
                </div>
                <div className="text-center p-4 rounded-lg border border-border">
                  <CheckCircle className="mx-auto text-accent mb-2" size={24} />
                  <p className="text-xs text-muted-foreground">Auto-save + resume</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-8">
              <div className="text-center mb-6">
                <AlertTriangle className="mx-auto text-accent mb-3" size={44} />
                <h2 className="text-2xl font-bold">महत्त्वाच्या सूचना</h2>
              </div>
              <ul className="space-y-3 mb-6">
                {rules.map((r, i) => (
                  <li key={i} className="flex gap-3"><CheckCircle className="text-green-500 mt-1 flex-shrink-0" size={18} /><span>{r}</span></li>
                ))}
              </ul>
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6 text-sm text-destructive">
                ⚠️ Tab बदल / paste यांची संख्या नोंदवली जाते. ५ पेक्षा जास्त वेळा झाल्यास तुमचे प्रकरण उच्च जोखीम म्हणून ध्वजांकित होईल.
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep("register")}>मागे जा</Button>
                <Button className="flex-1" onClick={handleStart} disabled={isStarting}>
                  {isStarting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> सुरू होत आहे...</> : "प्रश्नमंजुषा सुरू करा"}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Quiz;
