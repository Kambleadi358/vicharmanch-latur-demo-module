import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, X, Download, FileSpreadsheet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface QuizQuestion {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  category: string;
}

interface QuizSettings {
  id: string;
  category: string;
  is_active: boolean;
  duration_minutes: number;
}

interface QuizResponse {
  id: string;
  participant_name: string;
  category: string;
  score: number;
  total_questions: number;
  tab_switches: number;
  submitted_at: string;
}

interface QuizAnswer {
  id: string;
  response_id: string;
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
}

const QuizManagement = () => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [settings, setSettings] = useState<QuizSettings[]>([]);
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [quizDuration, setQuizDuration] = useState(30);
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answer: "A",
    category: "general",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchQuestions();
    fetchSettings();
    fetchResponses();
  }, []);

  const fetchQuestions = async () => {
    const { data, error } = await supabase.from("quiz_questions").select("*").order("created_at", { ascending: false });
    if (error) {
      toast({ title: "त्रुटी", description: "प्रश्न लोड करण्यात त्रुटी", variant: "destructive" });
    } else {
      setQuestions(data || []);
    }
  };

  const fetchSettings = async () => {
    const { data, error } = await supabase.from("quiz_settings").select("*");
    if (error) {
      toast({ title: "त्रुटी", description: "सेटिंग्स लोड करण्यात त्रुटी", variant: "destructive" });
    } else {
      setSettings(data || []);
      // Check if any quiz is active
      const activeSetting = data?.find(s => s.is_active);
      setIsQuizActive(!!activeSetting);
      if (activeSetting) {
        setQuizDuration(activeSetting.duration_minutes || 30);
      }
    }
  };

  const fetchResponses = async () => {
    const { data, error } = await supabase.from("quiz_responses").select("*").order("score", { ascending: false });
    if (error) {
      toast({ title: "त्रुटी", description: "प्रतिसाद लोड करण्यात त्रुटी", variant: "destructive" });
    } else {
      setResponses(data || []);
    }
  };

  const handleAddQuestion = async () => {
    const { error } = await supabase.from("quiz_questions").insert([newQuestion]);
    if (error) {
      toast({ title: "त्रुटी", description: "प्रश्न जोडण्यात त्रुटी", variant: "destructive" });
    } else {
      toast({ title: "यशस्वी", description: "प्रश्न जोडला गेला" });
      setNewQuestion({ question: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_answer: "A", category: "general" });
      setIsAddingQuestion(false);
      fetchQuestions();
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    const { error } = await supabase.from("quiz_questions").delete().eq("id", id);
    if (error) {
      toast({ title: "त्रुटी", description: "प्रश्न हटवण्यात त्रुटी", variant: "destructive" });
    } else {
      toast({ title: "यशस्वी", description: "प्रश्न हटवला गेला" });
      fetchQuestions();
    }
  };

  const toggleQuizActive = async () => {
    const newStatus = !isQuizActive;
    
    // First check if we have a general setting
    const generalSetting = settings.find(s => s.category === "general");
    
    if (generalSetting) {
      // Update all settings to match the new status
      const { error } = await supabase
        .from("quiz_settings")
        .update({ is_active: newStatus, duration_minutes: quizDuration })
        .eq("id", generalSetting.id);
      
      if (error) {
        toast({ title: "त्रुटी", description: "स्थिती अपडेट करण्यात त्रुटी", variant: "destructive" });
        return;
      }
    } else {
      // Create new general setting
      const { error } = await supabase
        .from("quiz_settings")
        .insert([{ category: "general", is_active: newStatus, duration_minutes: quizDuration }]);
      
      if (error) {
        toast({ title: "त्रुटी", description: "सेटिंग तयार करण्यात त्रुटी", variant: "destructive" });
        return;
      }
    }
    
    setIsQuizActive(newStatus);
    toast({ 
      title: "यशस्वी", 
      description: newStatus ? "क्विझ सक्रिय केला" : "क्विझ निष्क्रिय केला" 
    });
    fetchSettings();
  };

  const updateDuration = async () => {
    const generalSetting = settings.find(s => s.category === "general");
    
    if (generalSetting) {
      const { error } = await supabase
        .from("quiz_settings")
        .update({ duration_minutes: quizDuration })
        .eq("id", generalSetting.id);
      
      if (error) {
        toast({ title: "त्रुटी", description: "वेळ अपडेट करण्यात त्रुटी", variant: "destructive" });
      } else {
        toast({ title: "यशस्वी", description: "वेळ अपडेट केला" });
      }
    }
  };

  // Download detailed report as CSV with answers
  const downloadReport = async () => {
    if (responses.length === 0) {
      toast({ title: "माहिती नाही", description: "डाउनलोड करण्यासाठी प्रतिसाद नाहीत", variant: "destructive" });
      return;
    }

    // Fetch all answers
    const { data: allAnswers, error: answersError } = await supabase
      .from("quiz_answers")
      .select("*");

    if (answersError) {
      toast({ title: "त्रुटी", description: "उत्तरे लोड करण्यात त्रुटी", variant: "destructive" });
      return;
    }

    // Sort by score descending
    const sortedResponses = [...responses].sort((a, b) => b.score - a.score);

    // Create question lookup for column headers
    const questionMap = new Map(questions.map(q => [q.id, q]));

    // Create CSV content with answers
    const baseHeaders = ["क्रमांक", "नाव", "गुण", "एकूण प्रश्न", "टक्केवारी", "टॅब स्विच", "वेळ"];
    const questionHeaders = questions.map((q, idx) => `प्रश्न ${idx + 1}`);
    const correctAnswerHeaders = questions.map((q, idx) => `बरोबर ${idx + 1}`);
    const headers = [...baseHeaders, ...questionHeaders, ...correctAnswerHeaders];

    const rows = sortedResponses.map((r, index) => {
      const percentage = Math.round((r.score / r.total_questions) * 100);
      const userAnswers = (allAnswers || []).filter(a => a.response_id === r.id);
      
      // Get selected answers in question order
      const selectedAnswerCells = questions.map(q => {
        const answer = userAnswers.find(a => a.question_id === q.id);
        return answer ? answer.selected_answer || "उत्तर नाही" : "उत्तर नाही";
      });

      // Get correctness indicator
      const correctnessCells = questions.map(q => {
        const answer = userAnswers.find(a => a.question_id === q.id);
        return answer ? (answer.is_correct ? "✓" : "✗") : "✗";
      });

      return [
        index + 1,
        r.participant_name,
        r.score,
        r.total_questions,
        `${percentage}%`,
        r.tab_switches || 0,
        new Date(r.submitted_at).toLocaleString("mr-IN"),
        ...selectedAnswerCells,
        ...correctnessCells,
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Add BOM for UTF-8 support in Excel
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `quiz_report_detailed_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: "यशस्वी", description: "रिपोर्ट डाउनलोड झाला" });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="questions">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="questions">प्रश्न</TabsTrigger>
          <TabsTrigger value="settings">सेटिंग्स</TabsTrigger>
          <TabsTrigger value="responses">प्रतिसाद</TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">प्रश्न व्यवस्थापन ({questions.length} प्रश्न)</h3>
            <Button onClick={() => setIsAddingQuestion(true)} disabled={isAddingQuestion}>
              <Plus className="h-4 w-4 mr-2" /> नवीन प्रश्न
            </Button>
          </div>

          {isAddingQuestion && (
            <Card>
              <CardHeader>
                <CardTitle>नवीन प्रश्न जोडा</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>प्रश्न</Label>
                  <Input value={newQuestion.question} onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>पर्याय A</Label>
                    <Input value={newQuestion.option_a} onChange={(e) => setNewQuestion({ ...newQuestion, option_a: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>पर्याय B</Label>
                    <Input value={newQuestion.option_b} onChange={(e) => setNewQuestion({ ...newQuestion, option_b: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>पर्याय C</Label>
                    <Input value={newQuestion.option_c} onChange={(e) => setNewQuestion({ ...newQuestion, option_c: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>पर्याय D</Label>
                    <Input value={newQuestion.option_d} onChange={(e) => setNewQuestion({ ...newQuestion, option_d: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>बरोबर उत्तर</Label>
                  <select
                    className="w-full border rounded-md p-2"
                    value={newQuestion.correct_answer}
                    onChange={(e) => setNewQuestion({ ...newQuestion, correct_answer: e.target.value })}
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddQuestion}>
                    <Save className="h-4 w-4 mr-2" /> जतन करा
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingQuestion(false)}>
                    <X className="h-4 w-4 mr-2" /> रद्द करा
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>क्र.</TableHead>
                <TableHead>प्रश्न</TableHead>
                <TableHead>बरोबर उत्तर</TableHead>
                <TableHead>क्रिया</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((q, index) => (
                <TableRow key={q.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="max-w-md truncate">{q.question}</TableCell>
                  <TableCell>{q.correct_answer}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(q.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <h3 className="text-lg font-semibold">क्विझ सेटिंग्स</h3>
          
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-lg">क्विझ स्थिती</p>
                  <p className="text-sm text-muted-foreground">
                    {isQuizActive ? "क्विझ सध्या सक्रिय आहे - विद्यार्थी भाग घेऊ शकतात" : "क्विझ निष्क्रिय आहे"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-sm font-medium ${isQuizActive ? "text-green-600" : "text-muted-foreground"}`}>
                    {isQuizActive ? "सक्रिय" : "निष्क्रिय"}
                  </span>
                  <Switch checked={isQuizActive} onCheckedChange={toggleQuizActive} />
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">वेळ मर्यादा (मिनिटे)</p>
                  <p className="text-sm text-muted-foreground">क्विझसाठी एकूण वेळ</p>
                </div>
                <Input
                  type="number"
                  value={quizDuration}
                  onChange={(e) => setQuizDuration(parseInt(e.target.value) || 30)}
                  className="w-24"
                />
                <Button onClick={updateDuration}>अपडेट</Button>
              </div>

              <div className="p-4 bg-accent/10 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>सूचना:</strong> क्विझ सक्रिय केल्यावर सर्व प्रश्न ({questions.length}) विद्यार्थ्यांना दिसतील. 
                  सर्व वर्गांना सारखेच प्रश्न असतील.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responses" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">प्रतिसाद ({responses.length})</h3>
            <Button onClick={downloadReport} className="gap-2" disabled={responses.length === 0}>
              <Download className="h-4 w-4" />
              रिपोर्ट डाउनलोड करा
            </Button>
          </div>

          {responses.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <FileSpreadsheet className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>अद्याप कोणताही प्रतिसाद नाही</p>
              </CardContent>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>क्रमांक</TableHead>
                  <TableHead>नाव</TableHead>
                  <TableHead>गुण</TableHead>
                  <TableHead>टक्केवारी</TableHead>
                  <TableHead>टॅब स्विच</TableHead>
                  <TableHead>वेळ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {responses.map((r, index) => {
                  const percentage = Math.round((r.score / r.total_questions) * 100);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{r.participant_name}</TableCell>
                      <TableCell>
                        <span className="font-semibold">{r.score}</span>/{r.total_questions}
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${percentage >= 60 ? "text-green-600" : "text-red-600"}`}>
                          {percentage}%
                        </span>
                      </TableCell>
                      <TableCell className={r.tab_switches && r.tab_switches > 2 ? "text-destructive font-medium" : ""}>
                        {r.tab_switches || 0}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(r.submitted_at).toLocaleString("mr-IN")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuizManagement;
