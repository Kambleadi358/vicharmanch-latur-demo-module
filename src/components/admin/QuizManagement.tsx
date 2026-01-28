import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, Save, X } from "lucide-react";
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

const QuizManagement = () => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [settings, setSettings] = useState<QuizSettings[]>([]);
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
    }
  };

  const fetchResponses = async () => {
    const { data, error } = await supabase.from("quiz_responses").select("*").order("submitted_at", { ascending: false });
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

  const toggleQuizActive = async (category: string, currentStatus: boolean) => {
    const existingSetting = settings.find((s) => s.category === category);
    if (existingSetting) {
      const { error } = await supabase.from("quiz_settings").update({ is_active: !currentStatus }).eq("id", existingSetting.id);
      if (error) {
        toast({ title: "त्रुटी", description: "स्थिती अपडेट करण्यात त्रुटी", variant: "destructive" });
      } else {
        fetchSettings();
      }
    } else {
      const { error } = await supabase.from("quiz_settings").insert([{ category, is_active: true, duration_minutes: 30 }]);
      if (error) {
        toast({ title: "त्रुटी", description: "सेटिंग तयार करण्यात त्रुटी", variant: "destructive" });
      } else {
        fetchSettings();
      }
    }
  };

  const categories = [...new Set(questions.map((q) => q.category))];

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
            <h3 className="text-lg font-semibold">प्रश्न व्यवस्थापन</h3>
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
                <div className="grid grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <Label>विभाग</Label>
                    <Input value={newQuestion.category} onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })} />
                  </div>
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
                <TableHead>प्रश्न</TableHead>
                <TableHead>विभाग</TableHead>
                <TableHead>बरोबर उत्तर</TableHead>
                <TableHead>क्रिया</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="max-w-md truncate">{q.question}</TableCell>
                  <TableCell>{q.category}</TableCell>
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
          <div className="grid gap-4">
            {categories.length > 0 ? (
              categories.map((category) => {
                const setting = settings.find((s) => s.category === category);
                return (
                  <Card key={category}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium">{category}</p>
                        <p className="text-sm text-muted-foreground">
                          {questions.filter((q) => q.category === category).length} प्रश्न
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm">{setting?.is_active ? "सक्रिय" : "निष्क्रिय"}</span>
                        <Switch checked={setting?.is_active || false} onCheckedChange={() => toggleQuizActive(category, setting?.is_active || false)} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <p className="text-muted-foreground">कोणतेही विभाग उपलब्ध नाहीत. प्रथम प्रश्न जोडा.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="responses" className="space-y-4">
          <h3 className="text-lg font-semibold">प्रतिसाद ({responses.length})</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>नाव</TableHead>
                <TableHead>विभाग</TableHead>
                <TableHead>गुण</TableHead>
                <TableHead>टॅब स्विच</TableHead>
                <TableHead>वेळ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {responses.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.participant_name}</TableCell>
                  <TableCell>{r.category}</TableCell>
                  <TableCell>
                    {r.score}/{r.total_questions}
                  </TableCell>
                  <TableCell className={r.tab_switches && r.tab_switches > 2 ? "text-destructive" : ""}>{r.tab_switches || 0}</TableCell>
                  <TableCell>{new Date(r.submitted_at).toLocaleString("mr-IN")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuizManagement;
