import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, ChevronLeft, ChevronRight, Send, WifiOff, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Q = {
  id: string;
  question: string;
  marks: number;
  options: { key: string; text: string }[];
};

type LocalAnswer = {
  question_id: string;
  selected_option: string;
  time_spent_seconds: number;
  synced: boolean;
};

const LS_KEY = (sid: string) => `quiz_local_answers_${sid}`;

const QuizTake = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [tabSwitches, setTabSwitches] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const questionStartRef = useRef<number>(Date.now());
  const submittedRef = useRef(false);

  // ====== Init: load session ======
  useEffect(() => {
    const sid = sessionStorage.getItem("quiz_session_id");
    const name = sessionStorage.getItem("quiz_participant_name");
    const dob = sessionStorage.getItem("quiz_participant_dob");
    if (!sid || !name || !dob) {
      navigate("/quiz");
      return;
    }
    (async () => {
      const { data, error } = await supabase.functions.invoke("quiz-start", {
        body: { participant_name: name, dob },
      });
      if (error || !data || (data as any).error) {
        toast({ title: "त्रुटी", description: (data as any)?.error || "session लोड झाली नाही", variant: "destructive" });
        navigate("/quiz");
        return;
      }
      const d = data as any;
      setSessionId(d.session_id);
      setQuestions(d.questions);
      setCurrentIdx(d.current_index || 0);
      setTimeLeft(d.time_left);
      const ansMap: Record<string, string> = {};
      for (const a of d.saved_answers ?? []) {
        if (a.selected_option) ansMap[a.question_id] = a.selected_option;
      }
      setAnswers(ansMap);
      questionStartRef.current = Date.now();
      setLoading(false);
    })();
  }, [navigate, toast]);

  // ====== Timer (server-controlled, client just decrements) ======
  useEffect(() => {
    if (loading) return;
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          handleSubmit(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // ====== Anti-cheat: tab visibility, copy/paste, contextmenu ======
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        setTabSwitches((n) => {
          const next = n + 1;
          // Persist to server (best-effort)
          if (sessionId) {
            supabase.functions.invoke("quiz-save-answer", {
              body: { session_id: sessionId, question_id: questions[currentIdx]?.id, tab_switches: next },
            }).catch(() => {});
          }
          return next;
        });
      }
    };
    const blockKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["c", "v", "x", "u", "p"].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };
    const blockCtx = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("visibilitychange", onVis);
    document.addEventListener("keydown", blockKey);
    document.addEventListener("contextmenu", blockCtx);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      document.removeEventListener("keydown", blockKey);
      document.removeEventListener("contextmenu", blockCtx);
    };
  }, [sessionId, currentIdx, questions]);

  // ====== Network status + offline sync ======
  useEffect(() => {
    const goOn = () => { setIsOnline(true); syncLocal(); };
    const goOff = () => setIsOnline(false);
    window.addEventListener("online", goOn);
    window.addEventListener("offline", goOff);
    return () => {
      window.removeEventListener("online", goOn);
      window.removeEventListener("offline", goOff);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const persistLocal = (ans: LocalAnswer) => {
    if (!sessionId) return;
    const raw = localStorage.getItem(LS_KEY(sessionId));
    const list: LocalAnswer[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((x) => x.question_id === ans.question_id);
    if (idx >= 0) list[idx] = ans; else list.push(ans);
    localStorage.setItem(LS_KEY(sessionId), JSON.stringify(list));
  };

  const syncLocal = useCallback(async () => {
    if (!sessionId) return;
    const raw = localStorage.getItem(LS_KEY(sessionId));
    if (!raw) return;
    const list: LocalAnswer[] = JSON.parse(raw);
    const pending = list.filter((x) => !x.synced);
    for (const a of pending) {
      try {
        await supabase.functions.invoke("quiz-save-answer", {
          body: {
            session_id: sessionId,
            question_id: a.question_id,
            selected_option: a.selected_option,
            time_spent_seconds: a.time_spent_seconds,
          },
        });
        a.synced = true;
      } catch { /* keep unsynced */ }
    }
    localStorage.setItem(LS_KEY(sessionId), JSON.stringify(list));
  }, [sessionId]);

  // ====== Save answer with retry ======
  const saveAnswer = async (qid: string, opt: string) => {
    const timeSpent = Math.floor((Date.now() - questionStartRef.current) / 1000);
    const local: LocalAnswer = { question_id: qid, selected_option: opt, time_spent_seconds: timeSpent, synced: false };
    persistLocal(local);
    setAnswers((prev) => ({ ...prev, [qid]: opt }));

    let attempts = 0;
    while (attempts < 3) {
      try {
        const { error, data } = await supabase.functions.invoke("quiz-save-answer", {
          body: {
            session_id: sessionId,
            question_id: qid,
            selected_option: opt,
            time_spent_seconds: timeSpent,
            current_index: currentIdx,
          },
        });
        if (!error && !(data as any)?.error) {
          local.synced = true;
          persistLocal(local);
          return;
        }
        if ((data as any)?.expired) {
          handleSubmit(true);
          return;
        }
      } catch { /* retry */ }
      attempts++;
      await new Promise((r) => setTimeout(r, 600 * attempts));
    }
  };

  const goNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      questionStartRef.current = Date.now();
    }
  };
  const goPrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
      questionStartRef.current = Date.now();
    }
  };

  const handleSubmit = useCallback(async (auto = false) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setIsSubmitting(true);
    try {
      await syncLocal();
    } catch { /* ignore */ }
    try {
      const { data } = await supabase.functions.invoke("quiz-submit", {
        body: { session_id: sessionId, auto },
      });
      if (sessionId) localStorage.removeItem(LS_KEY(sessionId));
      const result = data as any;
      navigate(`/quiz/result?session_id=${sessionId}`, { state: result });
    } catch {
      toast({ title: "त्रुटी", description: "submit झाले नाही, पुन्हा प्रयत्न करा", variant: "destructive" });
      submittedRef.current = false;
      setIsSubmitting(false);
    }
  }, [sessionId, navigate, toast, syncLocal]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    );
  }

  const q = questions[currentIdx];
  const mins = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const secs = (timeLeft % 60).toString().padStart(2, "0");
  const lowTime = timeLeft < 60;
  const answered = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-background select-none" style={{ userSelect: "none" }}>
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="text-sm sm:text-base font-medium">
            प्रश्न {currentIdx + 1} / {questions.length}
          </div>
          <div className="flex items-center gap-3">
            {!isOnline && (
              <span className="flex items-center gap-1 text-xs bg-destructive px-2 py-1 rounded-md">
                <WifiOff size={14} /> ऑफलाईन
              </span>
            )}
            {tabSwitches > 0 && (
              <span className="flex items-center gap-1 text-xs bg-amber-500/90 text-amber-50 px-2 py-1 rounded-md">
                <AlertTriangle size={14} /> Tab × {tabSwitches}
              </span>
            )}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-mono font-bold ${lowTime ? "bg-destructive animate-pulse" : "bg-primary-foreground/15"}`}>
              <Clock size={16} /> {mins}:{secs}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="mb-6">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-accent transition-all" style={{ width: `${(answered / questions.length) * 100}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-right">{answered} / {questions.length} उत्तरे दिली</p>
        </div>

        <motion.div
          key={q?.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6 sm:p-8"
        >
          <h2 className="text-lg sm:text-xl font-semibold mb-6 leading-relaxed">
            {currentIdx + 1}. {q?.question}
          </h2>
          <div className="space-y-3">
            {q?.options.map((opt) => {
              const selected = answers[q.id] === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => saveAnswer(q.id, opt.key)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selected ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"
                  }`}
                >
                  <span className="font-bold mr-3 text-accent">{opt.key}.</span>
                  {opt.text}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 gap-3">
          <Button variant="outline" onClick={goPrev} disabled={currentIdx === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" /> मागील
          </Button>
          {currentIdx < questions.length - 1 ? (
            <Button onClick={goNext}>
              पुढील <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={() => handleSubmit(false)} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
              अंतिम सादर करा
            </Button>
          )}
        </div>

        {/* Question palette */}
        <div className="mt-8">
          <p className="text-sm text-muted-foreground mb-2">सर्व प्रश्न:</p>
          <div className="grid grid-cols-8 sm:grid-cols-10 gap-2">
            {questions.map((qq, i) => {
              const isAns = !!answers[qq.id];
              const isCur = i === currentIdx;
              return (
                <button
                  key={qq.id}
                  onClick={() => { setCurrentIdx(i); questionStartRef.current = Date.now(); }}
                  className={`aspect-square rounded text-xs font-semibold border-2 transition-all ${
                    isCur ? "border-accent bg-accent text-accent-foreground"
                    : isAns ? "border-green-500 bg-green-500/15"
                    : "border-border bg-card"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuizTake;
