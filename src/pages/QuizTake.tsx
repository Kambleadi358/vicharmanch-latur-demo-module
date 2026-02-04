import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Clock, AlertTriangle, CheckCircle, XCircle, ArrowRight, Send } from "lucide-react";
import Layout from "@/components/layout/Layout";

interface Question {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
}

const QuizTake = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [participantName, setParticipantName] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [quizDuration, setQuizDuration] = useState(30);
  const [isLoading, setIsLoading] = useState(true);

  const submittedRef = useRef(false);

  // Fetch quiz settings - get any active quiz settings
  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("quiz_settings")
        .select("duration_minutes, is_active")
        .eq("is_active", true)
        .limit(1);

      if (error || !data || data.length === 0) {
        toast({
          title: "क्विझ बंद आहे",
          description: "हा क्विझ सध्या सक्रिय नाही.",
          variant: "destructive",
        });
        navigate("/quiz");
        return;
      }

      setQuizDuration(data[0].duration_minutes || 30);
      setTimeLeft((data[0].duration_minutes || 30) * 60);
      setIsLoading(false);
    };

    fetchSettings();
  }, [navigate, toast]);

  // Fetch ALL questions when quiz starts (no category filter)
  const startQuiz = async () => {
    const trimmedName = participantName.trim();
    
    if (!trimmedName) {
      toast({
        title: "त्रुटी",
        description: "कृपया तुमचे नाव टाका",
        variant: "destructive",
      });
      return;
    }

    // Check if this participant has already taken the quiz
    const { data: existingResponse, error: checkError } = await supabase
      .from("quiz_responses")
      .select("id, submitted_at")
      .eq("participant_name", trimmedName)
      .limit(1);

    if (checkError) {
      toast({
        title: "त्रुटी",
        description: "तपासणी करताना त्रुटी आली",
        variant: "destructive",
      });
      return;
    }

    if (existingResponse && existingResponse.length > 0) {
      toast({
        title: "क्विझ आधीच दिला आहे",
        description: `"${trimmedName}" या नावाने आधीच क्विझ दिला आहे. एकाच नावाने पुन्हा क्विझ देता येत नाही.`,
        variant: "destructive",
      });
      return;
    }

    // Fetch all questions regardless of category
    const { data, error } = await supabase
      .from("quiz_questions")
      .select("*");

    if (error || !data || data.length === 0) {
      toast({
        title: "त्रुटी",
        description: "प्रश्न लोड करण्यात त्रुटी किंवा प्रश्न उपलब्ध नाहीत",
        variant: "destructive",
      });
      return;
    }

    // Shuffle questions
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setHasStarted(true);
  };

  // Submit quiz
  const submitQuiz = useCallback(async () => {
    if (submittedRef.current || isSubmitting) return;
    submittedRef.current = true;
    setIsSubmitting(true);

    // Calculate score
    let correctCount = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_answer) {
        correctCount++;
      }
    });

    // Insert main response first
    const { data: responseData, error } = await supabase.from("quiz_responses").insert([
      {
        participant_name: participantName,
        category: "general",
        score: correctCount,
        total_questions: questions.length,
        tab_switches: tabSwitches,
      },
    ]).select("id").single();

    if (error || !responseData) {
      toast({
        title: "त्रुटी",
        description: "प्रतिसाद सबमिट करण्यात त्रुटी",
        variant: "destructive",
      });
      submittedRef.current = false;
      setIsSubmitting(false);
      return;
    }

    // Insert individual answers
    const answerRecords = questions.map((q) => ({
      response_id: responseData.id,
      question_id: q.id,
      selected_answer: answers[q.id] || "",
      is_correct: answers[q.id] === q.correct_answer,
    }));

    await supabase.from("quiz_answers").insert(answerRecords);

    setScore(correctCount);
    setIsComplete(true);
    setIsSubmitting(false);
  }, [answers, participantName, questions, tabSwitches, toast]);

  // Timer countdown
  useEffect(() => {
    if (!hasStarted || isComplete) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          submitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [hasStarted, isComplete, submitQuiz]);

  // Tab switch detection
  useEffect(() => {
    if (!hasStarted || isComplete) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches((prev) => {
          const newCount = prev + 1;
          toast({
            title: "⚠️ चेतावणी",
            description: `तुम्ही टॅब सोडला! (${newCount} वेळा)`,
            variant: "destructive",
          });
          return newCount;
        });
      }
    };

    const handleBlur = () => {
      setTabSwitches((prev) => {
        const newCount = prev + 1;
        toast({
          title: "⚠️ चेतावणी",
          description: `विंडो फोकस गमावला! (${newCount} वेळा)`,
          variant: "destructive",
        });
        return newCount;
      });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [hasStarted, isComplete, toast]);

  // Prevent context menu and keyboard shortcuts
  useEffect(() => {
    if (!hasStarted || isComplete) return;

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.ctrlKey &&
        (e.key === "c" || e.key === "v" || e.key === "u" || e.key === "s")
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [hasStarted, isComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const currentQuestion = questions[currentIndex];

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }

  if (isComplete) {
    const percentage = Math.round((score / questions.length) * 100);
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

  if (!hasStarted) {
    return (
      <Layout>
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <Card className="shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">प्रश्नमंजुषा</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">तुमचे नाव *</Label>
                  <Input
                    id="name"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    placeholder="तुमचे पूर्ण नाव टाका"
                  />
                </div>

                <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    वेळ: {quizDuration} मिनिटे
                  </p>
                  <p className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    टॅब सोडल्यास गुण कमी होतील
                  </p>
                </div>

                <Button onClick={startQuiz} className="w-full" size="lg">
                  क्विझ सुरू करा
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
          {tabSwitches > 0 && (
            <div className="flex items-center gap-1 text-red-300">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">{tabSwitches}</span>
            </div>
          )}
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
                    {[
                      { key: "A", value: currentQuestion.option_a },
                      { key: "B", value: currentQuestion.option_b },
                      { key: "C", value: currentQuestion.option_c },
                      { key: "D", value: currentQuestion.option_d },
                    ].map((option) => (
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
