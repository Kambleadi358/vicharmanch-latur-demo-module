import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Key, User, Shield, Images, Save, Lock, Calendar } from "lucide-react";
import YearLockManager from "./YearLockManager";

const passwordSchema = z.object({
  newPassword: z.string().min(8, "नवीन पासवर्ड किमान ८ अक्षरांचा असावा"),
  confirmPassword: z.string().min(8, "पासवर्ड पुष्टी आवश्यक आहे"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "पासवर्ड जुळत नाहीत",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

const AdminSettings = () => {
  const { user } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [mediaLink, setMediaLink] = useState("");
  const [isSavingMedia, setIsSavingMedia] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "media_gallery_link")
        .maybeSingle();
      if (data) setMediaLink(data.setting_value);
    })();
  }, []);

  const handleSaveMediaLink = async () => {
    setIsSavingMedia(true);
    try {
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("setting_key", "media_gallery_link")
        .maybeSingle();
      if (existing) {
        await supabase.from("site_settings").update({ setting_value: mediaLink }).eq("setting_key", "media_gallery_link");
      } else {
        await supabase.from("site_settings").insert({ setting_key: "media_gallery_link", setting_value: mediaLink });
      }
      toast.success("मीडिया गॅलरी लिंक जतन केली!");
    } catch {
      toast.error("लिंक जतन करण्यात त्रुटी");
    } finally {
      setIsSavingMedia(false);
    }
  };

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const handlePasswordChange = async (values: PasswordFormValues) => {
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: values.newPassword });
      if (error) toast.error("त्रुटी: " + error.message);
      else {
        toast.success("पासवर्ड बदलला!");
        passwordForm.reset();
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 pb-10">
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-bold">सेटिंग्ज</h1>
        <p className="text-sm text-muted-foreground">खाते, सुरक्षा व साईट कॉन्फिगरेशन</p>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid grid-cols-4 w-full h-auto sticky top-0 z-10 bg-background/95 backdrop-blur border">
          <TabsTrigger value="account" className="flex-col gap-1 py-2 text-xs"><User className="h-4 w-4" />खाते</TabsTrigger>
          <TabsTrigger value="security" className="flex-col gap-1 py-2 text-xs"><Lock className="h-4 w-4" />सुरक्षा</TabsTrigger>
          <TabsTrigger value="site" className="flex-col gap-1 py-2 text-xs"><Images className="h-4 w-4" />साईट</TabsTrigger>
          <TabsTrigger value="year" className="flex-col gap-1 py-2 text-xs"><Calendar className="h-4 w-4" />वर्ष</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><User className="h-5 w-5" />खाते माहिती</CardTitle>
              <CardDescription>लॉग-इन केलेले प्रशासक खाते</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border p-3 bg-muted/30 break-all">
                <div className="text-xs text-muted-foreground mb-1">ईमेल</div>
                <div className="font-medium text-sm">{user?.email}</div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border p-3">
                <Shield className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium text-primary">प्रशासक प्रवेश सक्रिय</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Key className="h-5 w-5" />पासवर्ड बदला</CardTitle>
              <CardDescription>किमान ८ अक्षरांचा सुरक्षित पासवर्ड वापरा</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                  <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel>नवीन पासवर्ड</FormLabel>
                      <FormControl><Input type="password" autoComplete="new-password" className="h-11" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel>पुन्हा टाका</FormLabel>
                      <FormControl><Input type="password" autoComplete="new-password" className="h-11" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" disabled={isChangingPassword} className="w-full h-11">
                    {isChangingPassword ? "बदलत आहे..." : "पासवर्ड बदला"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="site" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Images className="h-5 w-5" />मीडिया गॅलरी</CardTitle>
              <CardDescription>मुख्यपृष्ठावरील Google Drive फोल्डर लिंक</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">Google Drive फोल्डर लिंक</Label>
                <Input value={mediaLink} onChange={(e) => setMediaLink(e.target.value)} placeholder="https://drive.google.com/drive/folders/..." className="h-11" />
              </div>
              <Button onClick={handleSaveMediaLink} disabled={isSavingMedia} className="w-full h-11 gap-2">
                <Save className="h-4 w-4" />
                {isSavingMedia ? "जतन..." : "जतन करा"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="year" className="mt-4">
          <YearLockManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
