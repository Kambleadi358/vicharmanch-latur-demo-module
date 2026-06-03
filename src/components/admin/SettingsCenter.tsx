import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Settings as SettingsIcon, Shield, Image, BookOpen, CalendarDays, Bell, Archive, Save, Loader2, Key,
} from "lucide-react";
import AdminSettings from "./AdminSettings";
import AnnualArchiveManager from "./AnnualArchiveManager";

const SettingsCenter = () => {
  const { user } = useAuth();
  const [activeYear, setActiveYear] = useState("");
  const [anonAllowed, setAnonAllowed] = useState(true);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDuration, setQuizDuration] = useState(1800);
  const [publishKey, setPublishKey] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [newPwd, setNewPwd] = useState("");
  const [changingPwd, setChangingPwd] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: settings } = await supabase.from("app_settings").select("*");
      settings?.forEach((s: any) => {
        if (s.section === "event" && s.key === "active_year") setActiveYear(String(s.value).replace(/"/g, ""));
        if (s.section === "event" && s.key === "suggestions_anonymous_enabled") setAnonAllowed(!!s.value);
      });
      const { data: qc } = await supabase.from("quiz_config").select("*").maybeSingle();
      if (qc) {
        setQuizTitle(qc.title ?? "");
        setQuizDuration(qc.duration_seconds ?? 1800);
        setPublishKey(!!qc.publish_answer_key);
      }
    })();
  }, []);

  const upsertSetting = async (section: string, key: string, value: any) => {
    await supabase.from("app_settings").upsert({ section, key, value }, { onConflict: "section,key" });
  };

  const saveEvent = async () => {
    setSavingEvent(true);
    await upsertSetting("event", "active_year", activeYear);
    await upsertSetting("event", "suggestions_anonymous_enabled", anonAllowed);
    setSavingEvent(false);
    toast.success("सेटिंग्ज जतन");
  };

  const saveQuiz = async () => {
    setSavingQuiz(true);
    const { data: existing } = await supabase.from("quiz_config").select("id").maybeSingle();
    const payload = { title: quizTitle, duration_seconds: Number(quizDuration) || 1800, publish_answer_key: publishKey };
    if (existing) await supabase.from("quiz_config").update(payload).eq("id", existing.id);
    else await supabase.from("quiz_config").insert(payload);
    setSavingQuiz(false);
    toast.success("प्रश्नमंजुषा सेटिंग्ज जतन");
  };

  const changePassword = async () => {
    if (newPwd.length < 8) { toast.error("किमान ८ अक्षरांचा पासवर्ड"); return; }
    setChangingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setChangingPwd(false);
    if (error) toast.error(error.message);
    else { toast.success("पासवर्ड बदलला"); setNewPwd(""); }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2"><SettingsIcon className="h-5 w-5" /> सेटिंग्ज केंद्र</h1>
        <p className="text-sm text-muted-foreground">सर्व प्रशासकीय कॉन्फिगरेशन एका ठिकाणी</p>
      </div>

      <Tabs defaultValue="site" className="w-full">
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full h-auto sticky top-0 z-10 bg-background/95 backdrop-blur border">
          <TabsTrigger value="site" className="flex-col gap-1 py-2 text-[11px]"><Image className="h-4 w-4" />साइट</TabsTrigger>
          <TabsTrigger value="security" className="flex-col gap-1 py-2 text-[11px]"><Shield className="h-4 w-4" />सुरक्षा</TabsTrigger>
          <TabsTrigger value="quiz" className="flex-col gap-1 py-2 text-[11px]"><BookOpen className="h-4 w-4" />प्रश्नमंजुषा</TabsTrigger>
          <TabsTrigger value="event" className="flex-col gap-1 py-2 text-[11px]"><CalendarDays className="h-4 w-4" />कार्यक्रम</TabsTrigger>
          <TabsTrigger value="notification" className="flex-col gap-1 py-2 text-[11px]"><Bell className="h-4 w-4" />सूचना</TabsTrigger>
          <TabsTrigger value="backup" className="flex-col gap-1 py-2 text-[11px]"><Archive className="h-4 w-4" />बॅकअप</TabsTrigger>
        </TabsList>

        <TabsContent value="site" className="mt-4">
          <AdminSettings />
        </TabsContent>

        <TabsContent value="security" className="mt-4 space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Key className="h-4 w-4" /> पासवर्ड बदला</CardTitle>
              <CardDescription>लॉग इन: {user?.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input type="password" placeholder="नवीन पासवर्ड (किमान ८ अक्षरे)" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
              <Button onClick={changePassword} disabled={changingPwd}>
                {changingPwd && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} पासवर्ड बदला
              </Button>
            </CardContent>
          </Card>
          <Card className="border-amber-300/40 bg-amber-50/50 dark:bg-amber-500/5">
            <CardContent className="p-4 text-xs text-amber-900 dark:text-amber-200">
              🔐 Microsoft Authenticator / TOTP द्वि-घटक प्रमाणीकरण भविष्यातील आवृत्तीत जोडले जाईल.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quiz" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">प्रश्नमंजुषा सेटिंग्ज</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">शीर्षक</Label>
                <Input value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">कालावधी (सेकंद)</Label>
                <Input type="number" value={quizDuration} onChange={(e) => setQuizDuration(Number(e.target.value))} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label className="text-xs">उत्तर सूची प्रकाशित करा</Label>
                <Switch checked={publishKey} onCheckedChange={setPublishKey} />
              </div>
              <Button onClick={saveQuiz} disabled={savingQuiz}>
                {savingQuiz ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} जतन
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="event" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">कार्यक्रम सेटिंग्ज</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">सक्रिय वर्ष</Label>
                <Input value={activeYear} onChange={(e) => setActiveYear(e.target.value.replace(/\D/g, "").slice(0, 4))} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label className="text-xs font-semibold">सुझाव पेटीत अनामिक संदेश परवानगी</Label>
                  <p className="text-[10px] text-muted-foreground">वापरकर्ते आपले नाव लपवू शकतात</p>
                </div>
                <Switch checked={anonAllowed} onCheckedChange={setAnonAllowed} />
              </div>
              <Button onClick={saveEvent} disabled={savingEvent}>
                {savingEvent ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} जतन
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notification" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">सूचना सेटिंग्ज</CardTitle>
              <CardDescription>SMS व ईमेल पाठवणी (भविष्यातील)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                सध्या WhatsApp व SMS हे डिव्हाइसवरून पाठवले जातात (wa.me / sms: लिंक).<br />
                स्वयंचलित बल्क पाठवणी पुढील आवृत्तीत जोडली जाईल.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="mt-4">
          <AnnualArchiveManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsCenter;
