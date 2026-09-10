import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Settings as SettingsIcon, ShieldCheck, Images, Archive, CalendarDays,
  Trash2, Wrench, Save, Loader2, Key, Lock, MapPin, Mail, Info,
} from "lucide-react";
import AnnualArchiveManager from "./AnnualArchiveManager";
import SystemHealthEngine from "./SystemHealthEngine";
import PermissionManager from "./PermissionManager";
import SecurityQuestions from "./SecurityQuestions";

import { logAdminAction } from "@/lib/activityLog";
import logo from "@/assets/vicharmanch-stamp.png";

const SettingsCenter = () => {
  const { user } = useAuth();
  const [activeYear, setActiveYear] = useState("");
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(true);
  const [mediaLink, setMediaLink] = useState("");
  const [maintenance, setMaintenance] = useState(false);
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [cleanupConfirm, setCleanupConfirm] = useState("");

  useEffect(() => {
    (async () => {
      const { data: settings } = await supabase.from("app_settings").select("*");
      settings?.forEach((s: any) => {
        if (s.section === "event" && s.key === "active_year") setActiveYear(String(s.value).replace(/"/g, ""));
        if (s.section === "event" && s.key === "suggestions_enabled") setSuggestionsEnabled(s.value !== false);
        if (s.section === "system" && s.key === "maintenance_mode") setMaintenance(!!s.value);
      });
      const { data: site } = await supabase
        .from("site_settings").select("setting_value")
        .eq("setting_key", "media_gallery_link").maybeSingle();
      if (site) setMediaLink(site.setting_value);
    })();
  }, []);

  const upsertSetting = async (section: string, key: string, value: any) => {
    await supabase.from("app_settings").upsert({ section, key, value }, { onConflict: "section,key" });
  };

  const saveMedia = async () => {
    setSaving("media");
    const { data: existing } = await supabase
      .from("site_settings").select("id").eq("setting_key", "media_gallery_link").maybeSingle();
    if (existing) await supabase.from("site_settings").update({ setting_value: mediaLink }).eq("setting_key", "media_gallery_link");
    else await supabase.from("site_settings").insert({ setting_key: "media_gallery_link", setting_value: mediaLink });
    setSaving(null);
    toast.success("मीडिया लिंक जतन केली");
  };

  const saveEvent = async () => {
    setSaving("event");
    await upsertSetting("event", "active_year", activeYear);
    await upsertSetting("event", "suggestions_enabled", suggestionsEnabled);
    setSaving(null);
    toast.success("कार्यक्रम सेटिंग्ज जतन");
  };

  const changePassword = async () => {
    if (newPwd.length < 8) return toast.error("किमान ८ अक्षरांचा पासवर्ड");
    if (newPwd !== confirmPwd) return toast.error("पासवर्ड जुळत नाहीत");
    setSaving("pwd");
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setSaving(null);
    if (error) return toast.error(error.message);
    setNewPwd(""); setConfirmPwd("");
    toast.success("पासवर्ड बदलला");
    logAdminAction("change_password", "auth", user?.id);
  };

  const toggleMaintenance = async (v: boolean) => {
    setMaintenance(v);
    await upsertSetting("system", "maintenance_mode", v);
    await logAdminAction(v ? "maintenance_on" : "maintenance_off", "system");
    toast.success(v ? "🛑 मेंटेनन्स मोड सुरू" : "✅ मेंटेनन्स मोड बंद");
  };

  const runCleanup = async () => {
    if (cleanupConfirm !== "CLEANUP") return toast.error("पुष्टीकरणासाठी CLEANUP टाईप करा");
    setSaving("cleanup");
    // Preserve archives; wipe operational data
    const wipeTables = [
      "donation_payments", "household_year_assignments", "ledger_expenses", "account_expenses",
      "public_votes", "judge_scores", "competition_entries", "participants",
      "program_winners", "prize_allocations", "prize_items",
      "quiz_answers", "quiz_sessions", "quiz_cheating_logs",
      "suggestions", "failed_participation_searches", "home_donations",
    ] as const;
    for (const t of wipeTables) {
      await supabase.from(t as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    }
    await logAdminAction("system_cleanup", "system", undefined, { tables: wipeTables });
    setSaving(null);
    setCleanupConfirm("");
    toast.success("प्रणाली स्वच्छ केली · अभिलेखागार जतन");
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-5 w-5" /> सेटिंग्ज केंद्र
        </h1>
        <p className="text-sm text-muted-foreground">सर्व प्रशासकीय कॉन्फिगरेशन एका ठिकाणी</p>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <div className="overflow-x-auto -mx-2 px-2">
          <TabsList className="inline-flex w-max gap-1 h-auto p-1 bg-muted sticky top-0 z-10 backdrop-blur">
            <TabsTrigger value="info" className="gap-1.5 py-2 px-3 text-xs"><Info className="h-4 w-4" />खाते माहिती</TabsTrigger>
            <TabsTrigger value="security" className="gap-1.5 py-2 px-3 text-xs"><ShieldCheck className="h-4 w-4" />सुरक्षा</TabsTrigger>
            <TabsTrigger value="media" className="gap-1.5 py-2 px-3 text-xs"><Images className="h-4 w-4" />मीडिया</TabsTrigger>
            <TabsTrigger value="archive" className="gap-1.5 py-2 px-3 text-xs"><Archive className="h-4 w-4" />अभिलेखागार</TabsTrigger>
            <TabsTrigger value="event" className="gap-1.5 py-2 px-3 text-xs"><CalendarDays className="h-4 w-4" />कार्यक्रम</TabsTrigger>
            <TabsTrigger value="cleanup" className="gap-1.5 py-2 px-3 text-xs"><Trash2 className="h-4 w-4" />स्वच्छता</TabsTrigger>
            <TabsTrigger value="maintenance" className="gap-1.5 py-2 px-3 text-xs"><Wrench className="h-4 w-4" />मेंटेनन्स</TabsTrigger>
          </TabsList>
        </div>

        {/* 1. Info */}
        <TabsContent value="info" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">संस्थेची माहिती</CardTitle>
              <CardDescription>अधिकृत संपर्क तपशील</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
                <img src={logo} alt="logo" className="h-16 w-16 object-contain" />
                <div>
                  <p className="font-bold text-primary leading-tight">भारतरत्न डॉ. बाबासाहेब आंबेडकर विचारमंच</p>
                  <p className="text-xs text-muted-foreground">बौद्ध नगर, लातूर</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <Mail className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">ईमेल</p>
                    <p className="text-sm font-medium break-all">vicharmanch1956@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <MapPin className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">स्थान</p>
                    <p className="text-sm font-medium">बौद्ध नगर, लातूर</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border p-3 sm:col-span-2 bg-primary/5">
                  <Lock className="h-4 w-4 text-primary" />
                  <div className="flex-1">
                    <p className="text-[10px] text-muted-foreground uppercase">भूमिका</p>
                    <p className="text-sm font-medium">प्रशासक · {user?.email}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Security */}
        <TabsContent value="security" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Key className="h-4 w-4" /> पासवर्ड बदला</CardTitle>
              <CardDescription>किमान ८ अक्षरे</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">नवीन पासवर्ड</Label>
                <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">पुष्टी करा</Label>
                <Input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />
              </div>
              <Button onClick={changePassword} disabled={saving === "pwd"} className="w-full">
                {saving === "pwd" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                पासवर्ड बदला
              </Button>
            </CardContent>
          </Card>
          <SecurityQuestions />
        </TabsContent>


        {/* 3. Media */}
        <TabsContent value="media" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">मीडिया गॅलरी</CardTitle>
              <CardDescription>Google Drive फोल्डर लिंक — मुख्यपृष्ठावर बटणद्वारे उघडेल</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Google Drive लिंक</Label>
                <Input value={mediaLink} onChange={(e) => setMediaLink(e.target.value)} placeholder="https://drive.google.com/drive/folders/..." />
              </div>
              <Button onClick={saveMedia} disabled={saving === "media"} className="w-full">
                {saving === "media" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                जतन करा
              </Button>
              <p className="text-[11px] text-muted-foreground">
                टीप: लिंक जतन केल्यावर मुख्यपृष्ठावर “मीडिया गॅलरी उघडा” बटण दिसेल.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Archive */}
        <TabsContent value="archive" className="mt-4">
          <AnnualArchiveManager />
        </TabsContent>

        {/* 5. Event */}
        <TabsContent value="event" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">कार्यक्रम सेटिंग्ज</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">सक्रिय वर्ष</Label>
                <Input
                  value={activeYear}
                  onChange={(e) => setActiveYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="2026"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label className="text-xs font-semibold">सुझाव पेटी सक्रिय</Label>
                  <p className="text-[10px] text-muted-foreground">सार्वजनिक सुझाव स्वीकारा</p>
                </div>
                <Switch checked={suggestionsEnabled} onCheckedChange={setSuggestionsEnabled} />
              </div>
              <Button onClick={saveEvent} disabled={saving === "event"} className="w-full">
                {saving === "event" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                जतन करा
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6. Cleanup */}
        <TabsContent value="cleanup" className="mt-4">
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-destructive">
                <Trash2 className="h-4 w-4" /> प्रणाली स्वच्छता
              </CardTitle>
              <CardDescription>
                सर्व चालू डेटा (देणगी, खर्च, स्पर्धा, मते, प्रश्नमंजुषा नोंदी) कायमस्वरूपी हटवा.
                <b className="text-foreground"> वार्षिक अभिलेखागार सुरक्षित राहील.</b>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                ⚠️ ही क्रिया परत घेता येत नाही. कृपया आधी अभिलेखागार तयार असल्याची खात्री करा.
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" /> स्वच्छता सुरू करा
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>अंतिम पुष्टीकरण</AlertDialogTitle>
                    <AlertDialogDescription>
                      सर्व चालू डेटा हटवण्यासाठी खाली <b>CLEANUP</b> टाईप करा.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Input
                    value={cleanupConfirm}
                    onChange={(e) => setCleanupConfirm(e.target.value)}
                    placeholder="CLEANUP"
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setCleanupConfirm("")}>रद्द</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={runCleanup}
                      disabled={saving === "cleanup" || cleanupConfirm !== "CLEANUP"}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {saving === "cleanup" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      कायम हटवा
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 7. Maintenance */}
        <TabsContent value="maintenance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="h-4 w-4" /> मेंटेनन्स मोड
              </CardTitle>
              <CardDescription>
                सक्षम असताना सार्वजनिक वापरकर्त्यांना मेंटेनन्स पृष्ठ दिसेल. प्रशासकांना पूर्ण प्रवेश असेल.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label className="text-sm font-semibold">मेंटेनन्स मोड</Label>
                  <p className="text-[11px] text-muted-foreground">
                    {maintenance ? "🛑 सुरू — सार्वजनिक सिस्टम बंद" : "✅ बंद — सार्वजनिक सिस्टम चालू"}
                  </p>
                </div>
                <Switch checked={maintenance} onCheckedChange={toggleMaintenance} />
              </div>
              <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                प्रत्येक ON/OFF क्रिया प्रशासकीय क्रियाकलाप लॉगमध्ये नोंदवली जाते.
              </div>
            </CardContent>
          </Card>

          {/* Permission Manager */}
          <div className="mt-4">
            <PermissionManager />
          </div>

          {/* System Health Engine */}
          <div className="mt-4">
            <SystemHealthEngine />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsCenter;
