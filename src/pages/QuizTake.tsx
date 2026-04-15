import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Clock, AlertTriangle, CheckCircle, XCircle, ArrowRight, Send, RefreshCw, Wifi, WifiOff } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface Question {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
}

interface ShuffledQuestion extends Question {
  shuffledOptions: { key: string; originalKey: string; value: string }[];
}

interface QuizSession {
  id: string;
  participant_name: string;
  dob: string;
  start_time: string;
  duration_seconds: number;
  question_order: string[];
  option_orders: Record<string, string[]>;
  answers_saved: Record<string, string>;
  tab_switches: number;
  status: string;
  current_index: number;
}

// Shuffle array with seed for deterministic shuffling
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const AUTOSAVE_DEBOUNCE = 1500;
const RETRY_DELAY = 2000;
const MAX_RETRIES = 3;

const QuizTake = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [participantName] = useState(
    () => (location.state as any)?.participantName || ""
  );
  const [dob] = useState(() => (location.state as any)?.dob || "");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ShuffledQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSaves, setPendingSaves] = useState<Record<string, string>>({});
  const [isResuming, setIsResuming] = useState(false);

  const submittedRef = useRef(false);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<string>("");
  const durationRef = useRef(0);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingSaves();
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Redirect if no name/dob
  useEffect(() => {
    if (!participantName || !dob) {
      navigate("/quiz");
    }
  }, [participantName, dob, navigate]);

  // Initialize or resume session
  useEffect(() => {
    if (!participantName || !dob) return;
    initializeSession();
  }, [participantName, dob]);

  const initializeSession = async () => {
    setIsLoading(true);

    // Check for existing session
    const { data: existingSession } = await supabase
      .from("quiz_sessions")
      .select("*")
      .eq("participant_name", participantName)
      .eq("dob", dob)
      .maybeSingle();

    if (existingSession) {
      if (existingSession.status === "completed") {
        // Already submitted
        toast({
          title: "क्विझ आधीच पूर्ण झाला",
          description: "तुम्ही आधीच हा क्विझ दिला आहे.",
          variant: "destructive",
        });
        navigate("/quiz");
        return;
      }

      // Resume existing session
      setIsResuming(true);
      await resumeSession(existingSession as unknown as QuizSession);
      setIsResuming(false);
    } else {
      // Create new session
      await createNewSession();
    }
    setIsLoading(false);
  };

  const resumeSession = async (session: QuizSession) => {
    // Calculate remaining time from server
    const startTime = new Date(session.start_time).getTime();
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const remaining = Math.max(0, session.duration_seconds - elapsed);

    if (remaining <= 0) {
      // Timer expired, auto-submit
      await autoSubmitExpired(session);
      return;
    }

    startTimeRef.current = session.start_time;
    durationRef.current = session.duration_seconds;
    setTimeLeft(remaining);
    setSessionId(session.id);
    setTabSwitches(session.tab_switches);
    setCurrentIndex(session.current_index);

    // Restore answers
    const savedAnswers = (session.answers_saved || {}) as Record<string, string>;
    setAnswers(savedAnswers);

    // Fetch questions and apply saved order
    const { data: allQuestions } = await supabase
      .from("quiz_questions")
      .select("*");

    if (!allQuestions) return;

    const questionOrder = (session.question_order || []) as string[];
    const optionOrders = (session.option_orders || {}) as Record<string, string[]>;

    // Reconstruct shuffled questions in saved order
    const orderedQuestions: ShuffledQuestion[] = questionOrder
      .map((qId) => {
        const q = allQuestions.find((aq) => aq.id === qId);
        if (!q) return null;
        const optOrder = optionOrders[qId] || ["A", "B", "C", "D"];
        const optionMap: Record<string, string> = {
          A: q.option_a,
          B: q.option_b,
          C: q.option_c,
          D: q.option_d,
        };
        return {
          ...q,
          shuffledOptions: optOrder.map((key, idx) => ({
            key: String.fromCharCode(65 + idx),
            originalKey: key,
            value: optionMap[key],
          })),
        } as ShuffledQuestion;
      })
      .filter(Boolean) as ShuffledQuestion[];

    setQuestions(orderedQuestions);

    toast({
      title: "परीक्षा पुन्हा सुरू",
      description: `शिल्लक वेळ: ${Math.floor(remaining / 60)} मिनिटे ${remaining % 60} सेकंद`,
    });
  };

  const autoSubmitExpired = async (session: QuizSession) => {
    // Fetch questions to calculate score
    const { data: allQuestions } = await supabase
      .from("quiz_questions")
      .select("*");

    if (!allQuestions) {
      navigate("/quiz");
      return;
    }

    const savedAnswers = (session.answers_saved || {}) as Record<string, string>;
    let correctCount = 0;
    const questionOrder = (session.question_order || []) as string[];
    const optionOrders = (session.option_orders || {}) as Record<string, string[]>;

    questionOrder.forEach((qId) => {
      const q = allQuestions.find((aq) => aq.id === qId);
      if (!q) return;
      const userAnswer = savedAnswers[qId];
      if (!userAnswer) return;
      // Convert shuffled answer back to original
      const optOrder = optionOrders[qId] || ["A", "B", "C", "D"];
      const displayIdx = userAnswer.charCodeAt(0) - 65;
      const originalKey = optOrder[displayIdx];
      if (originalKey === q.correct_answer) correctCount++;
    });

    // Save response
    const { data: responseData } = await supabase
      .from("quiz_responses")
      .insert([{
        participant_name: session.participant_name,
        dob: session.dob,
        category: "general",
        score: correctCount,
        total_questions: questionOrder.length,
        tab_switches: session.tab_switches,
      }])
      .select("id")
      .single();

    if (responseData) {
      const answerRecords = questionOrder.map((qId) => {
        const q = allQuestions.find((aq) => aq.id === qId);
        const userAnswer = savedAnswers[qId] || "";
        const optOrder = optionOrders[qId] || ["A", "B", "C", "D"];
        let originalKey = "";
        if (userAnswer) {
          const displayIdx = userAnswer.charCodeAt(0) - 65;
          originalKey = optOrder[displayIdx] || "";
        }
        return {
          response_id: responseData.id,
          question_id: qId,
          selected_answer: originalKey,
          is_correct: q ? originalKey === q.correct_answer : false,
        };
      });
      await supabase.from("quiz_answers").insert(answerRecords);
    }

    // Mark session complete
    await supabase
      .from("quiz_sessions")
      .update({ status: "completed" })
      .eq("id", session.id);

    setScore(correctCount);
    setQuestions(questionOrder.map((qId) => {
      const q = allQuestions.find((aq) => aq.id === qId);
      return q as any;
    }).filter(Boolean));
    setIsComplete(true);
  };

  const createNewSession = async () => {
    // Fetch quiz settings
    const { data: settings } = await supabase
      .from("quiz_settings")
      .select("duration_minutes, is_active")
      .eq("is_active", true)
      .limit(1);

    if (!settings || settings.length === 0) {
      toast({
        title: "क्विझ बंद आहे",
        description: "हा क्विझ सध्या सक्रिय नाही.",
        variant: "destructive",
      });
      navigate("/quiz");
      return;
    }

    const durationMins = settings[0].duration_minutes || 30;
    const durationSecs = durationMins * 60;

    // Fetch all questions
    const { data: allQuestions } = await supabase
      .from("quiz_questions")
      .select("*");

    if (!allQuestions || allQuestions.length === 0) {
      toast({
        title: "त्रुटी",
        description: "प्रश्न उपलब्ध नाहीत",
        variant: "destructive",
      });
      navigate("/quiz");
      return;
    }

    // Shuffle questions
    const shuffledQIds = shuffleArray(allQuestions.map((q) => q.id));

    // Shuffle options for each question
    const optionOrders: Record<string, string[]> = {};
    allQuestions.forEach((q) => {
      optionOrders[q.id] = shuffleArray(["A", "B", "C", "D"]);
    });

    // Create session in DB
    const now = new Date().toISOString();
    const { data: sessionData, error } = await supabase
      .from("quiz_sessions")
      .insert([{
        participant_name: participantName,
        dob,
        start_time: now,
        duration_seconds: durationSecs,
        question_order: shuffledQIds,
        option_orders: optionOrders,
        answers_saved: {},
        tab_switches: 0,
        status: "active",
        current_index: 0,
      }])
      .select("id")
      .single();

    if (error || !sessionData) {
      // Could be duplicate - check
      if (error?.code === "23505") {
        toast({
          title: "क्विझ आधीच दिला आहे",
          description: "या नावाने व जन्मतारखेने आधीच क्विझ दिला आहे.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "त्रुटी",
          description: "सत्र तयार करण्यात त्रुटी",
          variant: "destructive",
        });
      }
      navigate("/quiz");
      return;
    }

    startTimeRef.current = now;
    durationRef.current = durationSecs;
    setSessionId(sessionData.id);
    setTimeLeft(durationSecs);

    // Build shuffled questions
    const shuffledQuestions: ShuffledQuestion[] = shuffledQIds
      .map((qId) => {
        const q = allQuestions.find((aq) => aq.id === qId);
        if (!q) return null;
        const optOrder = optionOrders[qId];
        const optionMap: Record<string, string> = {
          A: q.option_a,
          B: q.option_b,
          C: q.option_c,
          D: q.option_d,
        };
        return {
          ...q,
          shuffledOptions: optOrder.map((key, idx) => ({
            key: String.fromCharCode(65 + idx),
            originalKey: key,
            value: optionMap[key],
          })),
        } as ShuffledQuestion;
      })
      .filter(Boolean) as ShuffledQuestion[];

    setQuestions(shuffledQuestions);
  };

  // Sync pending saves when back online
  const syncPendingSaves = useCallback(async () => {
    if (!sessionId || Object.keys(pendingSaves).length === 0) return;
    const merged = { ...answers, ...pendingSaves };
    await retryUpdate({ answers_saved: merged });
    setPendingSaves({});
  }, [sessionId, pendingSaves, answers]);

  // Retry mechanism for DB updates
  const retryUpdate = async (
    updateData: Record<string, any>,
    retries = MAX_RETRIES
  ): Promise<boolean> => {
    if (!sessionId) return false;
    for (let i = 0; i < retries; i++) {
      const { error } = await supabase
        .from("quiz_sessions")
        .update(updateData)
        .eq("id", sessionId);
      if (!error) return true;
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY * (i + 1)));
      }
    }
    return false;
  };

  // Autosave answers with debounce
  const autosaveAnswers = useCallback(
    (newAnswers: Record<string, string>, newIndex: number) => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = setTimeout(async () => {
        if (!sessionId) return;
        if (!navigator.onLine) {
          // Store locally
          setPendingSaves((prev) => ({ ...prev, ...newAnswers }));
          // Also store in localStorage as backup
          localStorage.setItem(
            `quiz_backup_${sessionId}`,
            JSON.stringify(newAnswers)
          );
          return;
        }
        const success = await retryUpdate({
          answers_saved: newAnswers,
          current_index: newIndex,
        });
        if (!success) {
          setPendingSaves((prev) => ({ ...prev, ...newAnswers }));
          localStorage.setItem(
            `quiz_backup_${sessionId}`,
            JSON.stringify(newAnswers)
          );
        }
      }, AUTOSAVE_DEBOUNCE);
    },
    [sessionId]
  );

  // Submit quiz
  const submitQuiz = useCallback(async () => {
    if (submittedRef.current || isSubmitting) return;
    submittedRef.current = true;
    setIsSubmitting(true);

    // Merge any pending saves
    const finalAnswers = { ...answers, ...pendingSaves };

    // Calculate score using original keys
    let correctCount = 0;
    questions.forEach((q) => {
      const userAnswer = finalAnswers[q.id];
      if (!userAnswer) return;
      // Convert display key to original key
      const opt = q.shuffledOptions.find((o) => o.key === userAnswer);
      if (opt && opt.originalKey === q.correct_answer) correctCount++;
    });

    // Insert response
    const { data: responseData, error } = await supabase
      .from("quiz_responses")
      .insert([{
        participant_name: participantName,
        dob,
        category: "general",
        score: correctCount,
        total_questions: questions.length,
        tab_switches: tabSwitches,
      }])
      .select("id")
      .single();

    if (error || !responseData) {
      toast({
        title: "त्रुटी",
        description: "प्रतिसाद सबमिट करण्यात त्रुटी. पुन्हा प्रयत्न करत आहे...",
        variant: "destructive",
      });
      // Retry
      submittedRef.current = false;
      setIsSubmitting(false);
      return;
    }

    // Insert individual answers with original keys
    const answerRecords = questions.map((q) => {
      const userAnswer = finalAnswers[q.id] || "";
      let originalKey = "";
      if (userAnswer) {
        const opt = q.shuffledOptions.find((o) => o.key === userAnswer);
        originalKey = opt?.originalKey || "";
      }
      return {
        response_id: responseData.id,
        question_id: q.id,
        selected_answer: originalKey,
        is_correct: originalKey === q.correct_answer,
      };
    });

    await supabase.from("quiz_answers").insert(answerRecords);

    // Mark session complete
    if (sessionId) {
      await supabase
        .from("quiz_sessions")
        .update({ status: "completed", answers_saved: finalAnswers })
        .eq("id", sessionId);
    }

    // Cleanup
    if (sessionId) localStorage.removeItem(`quiz_backup_${sessionId}`);

    setScore(correctCount);
    setIsComplete(true);
    setIsSubmitting(false);
  }, [answers, pendingSaves, participantName, dob, questions, tabSwitches, sessionId, toast]);

  // Server-synced timer (calculates from start_time)
  useEffect(() => {
    if (!sessionId || isComplete || questions.length === 0) return;

    const interval = setInterval(() => {
      if (startTimeRef.current && durationRef.current) {
        const startTime = new Date(startTimeRef.current).getTime();
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = Math.max(0, durationRef.current - elapsed);
        setTimeLeft(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
          submitQuiz();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId, isComplete, questions.length, submitQuiz]);

  // Tab switch detection
  useEffect(() => {
    if (!sessionId || isComplete || questions.length === 0) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches((prev) => {
          const newCount = prev + 1;
          toast({
            title: "⚠️ चेतावणी",
            description: `तुम्ही टॅब सोडला! (${newCount} वेळा)`,
            variant: "destructive",
          });
          // Save tab switch count
          retryUpdate({ tab_switches: newCount });
          return newCount;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [sessionId, isComplete, questions.length, toast]);

  // Prevent copy/paste/context menu
  useEffect(() => {
    if (!sessionId || isComplete || questions.length === 0) return;

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.ctrlKey &&
        (e.key === "c" || e.key === "v" || e.key === "u" || e.key === "s")
      ) {
        e.preventDefault();
      }
    };
    const handleCopy = (e: ClipboardEvent) => e.preventDefault();

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handleCopy);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handleCopy);
    };
  }, [sessionId, isComplete, questions.length]);

  // Save to localStorage on beforeunload
  useEffect(() => {
    if (!sessionId) return;
    const handleBeforeUnload = () => {
      localStorage.setItem(
        `quiz_backup_${sessionId}`,
        JSON.stringify(answers)
      );
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [sessionId, answers]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
    autosaveAnswers(newAnswers, currentIndex);
  };

  const currentQuestion = questions[currentIndex];

  if (isLoading || isResuming) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-accent" />
          <p className="text-muted-foreground">
            {isResuming ? "परीक्षा पुन्हा सुरू होत आहे..." : "लोड होत आहे..."}
          </p>
        </div>
      </Layout>
    );
  }

  if (isComplete) {
    const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    return (
      <Layout>
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto text-center"
          >
            <Card className="shadow-xl">
              <CardHeader>
                <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 bg-primary/10">
                  {percentage >= 60 ? (
                    <CheckCircle className="h-12 w-12 text-green-500" />
                  ) : (
                    <XCircle className="h-12 w-12 text-red-500" />
                  )}
                </div>
                <CardTitle className="text-2xl">क्विझ पूर्ण!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-6xl font-bold text-primary">
                  {score}/{questions.length}
                </div>
                <p className="text-xl text-muted-foreground">{percentage}% बरोबर</p>

                {tabSwitches > 0 && (
                  <div className="p-4 bg-destructive/10 rounded-lg">
                    <p className="text-destructive flex items-center justify-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      टॅब स्विच: {tabSwitches} वेळा
                    </p>
                  </div>
                )}

                <Button onClick={() => navigate("/quiz")} className="w-full">
                  मुख्य पृष्ठावर परत जा
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </Layout>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-background select-none">
      {/* Fixed Timer Header */}
      <div className="fixed top-0 left-0 right-0 bg-primary text-primary-foreground z-50 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm opacity-80">प्रश्न</span>
            <span className="font-bold">
              {currentIndex + 1}/{questions.length}
            </span>
          </div>
          <div
            className={`flex items-center gap-2 font-mono text-xl font-bold ${
              timeLeft < 60 ? "text-red-300 animate-pulse" : ""
            }`}
          >
            <Clock className="h-5 w-5" />
            {formatTime(timeLeft)}
          </div>
          <div className="flex items-center gap-3">
            {!isOnline && (
              <div className="flex items-center gap-1 text-yellow-300" title="ऑफलाइन - उत्तरे लोकली सेव्ह होतील">
                <WifiOff className="h-4 w-4" />
              </div>
            )}
            {tabSwitches > 0 && (
              <div className="flex items-center gap-1 text-red-300">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">{tabSwitches}</span>
              </div>
            )}
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-primary-foreground/20">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Question Content */}
      <div className="pt-24 pb-32 px-4">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg leading-relaxed">
                    {currentQuestion.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={answers[currentQuestion.id] || ""}
                    onValueChange={(value) =>
                      handleAnswerSelect(currentQuestion.id, value)
                    }
                    className="space-y-3"
                  >
                    {currentQuestion.shuffledOptions.map((option) => (
                      <Label
                        key={option.key}
                        htmlFor={`${currentQuestion.id}-${option.key}`}
                        className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                          answers[currentQuestion.id] === option.key
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <RadioGroupItem
                          value={option.key}
                          id={`${currentQuestion.id}-${option.key}`}
                        />
                        <span className="font-medium text-primary mr-2">
                          {option.key}.
                        </span>
                        <span>{option.value}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Question Navigator */}
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${
                  idx === currentIndex
                    ? "bg-primary text-primary-foreground"
                    : answers[q.id]
                    ? "bg-green-500 text-white"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
          >
            मागे
          </Button>

          {currentIndex === questions.length - 1 ? (
            <Button
              onClick={submitQuiz}
              disabled={isSubmitting}
              className="flex-1 gap-2"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? "सबमिट होत आहे..." : "सबमिट करा"}
            </Button>
          ) : (
            <Button
              onClick={() =>
                setCurrentIndex((prev) =>
                  Math.min(questions.length - 1, prev + 1)
                )
              }
              className="flex-1 gap-2"
            >
              पुढे
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizTake;
