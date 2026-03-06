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
import { toast } from "sonner";
import { Key, User, Shield, RefreshCw, Images, Save } from "lucide-react";
import YearLockManager from "./YearLockManager";

const passwordSchema = z.object({
  currentPassword: z.string().min(6, "सध्याचा पासवर्ड आवश्यक आहे"),
  newPassword: z.string().min(6, "नवीन पासवर्ड किमान ६ अक्षरांचा असावा"),
  confirmPassword: z.string().min(6, "पासवर्ड पुष्टी आवश्यक आहे"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "पासवर्ड जुळत नाहीत",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

const AdminSettings = () => {
  const { user } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isResettingQuiz, setIsResettingQuiz] = useState(false);
  const [mediaLink, setMediaLink] = useState("");
  const [isSavingMedia, setIsSavingMedia] = useState(false);

  useEffect(() => {
    const fetchMediaLink = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "media_gallery_link")
        .maybeSingle();
      if (data) setMediaLink(data.setting_value);
    };
    fetchMediaLink();
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
        await supabase
          .from("site_settings")
          .update({ setting_value: mediaLink })
          .eq("setting_key", "media_gallery_link");
      } else {
        await supabase
          .from("site_settings")
          .insert({ setting_key: "media_gallery_link", setting_value: mediaLink });
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
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handlePasswordChange = async (values: PasswordFormValues) => {
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (error) {
        toast.error("पासवर्ड बदलण्यात त्रुटी: " + error.message);
      } else {
        toast.success("पासवर्ड यशस्वीरित्या बदलला गेला!");
        passwordForm.reset();
      }
    } catch (error) {
      toast.error("पासवर्ड बदलण्यात त्रुटी आली");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleResetAllQuizResponses = async () => {
    if (!confirm("तुम्हाला खात्री आहे का? सर्व क्विझ प्रतिसाद हटवले जातील. ही क्रिया पूर्ववत करता येणार नाही.")) {
      return;
    }

    setIsResettingQuiz(true);
    try {
      // Delete all quiz answers first (foreign key constraint)
      const { error: answersError } = await supabase
        .from("quiz_answers")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (answersError) {
        toast.error("उत्तरे हटवण्यात त्रुटी: " + answersError.message);
        return;
      }

      // Delete all quiz responses
      const { error: responsesError } = await supabase
        .from("quiz_responses")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (responsesError) {
        toast.error("प्रतिसाद हटवण्यात त्रुटी: " + responsesError.message);
        return;
      }

      toast.success("सर्व क्विझ प्रतिसाद यशस्वीरित्या हटवले गेले!");
    } catch (error) {
      toast.error("प्रतिसाद हटवण्यात त्रुटी आली");
    } finally {
      setIsResettingQuiz(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            खाते माहिती
          </CardTitle>
          <CardDescription>तुमची खाते माहिती</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">ईमेल:</span>
              <span className="text-muted-foreground">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">प्रशासक</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            पासवर्ड बदला
          </CardTitle>
          <CardDescription>तुमचा खाते पासवर्ड अपडेट करा</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>सध्याचा पासवर्ड</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="सध्याचा पासवर्ड टाका" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>नवीन पासवर्ड</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="नवीन पासवर्ड टाका" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>पासवर्ड पुष्टी करा</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="नवीन पासवर्ड पुन्हा टाका" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? "बदलत आहे..." : "पासवर्ड बदला"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            जलद क्रिया
          </CardTitle>
          <CardDescription>प्रशासकीय क्रिया</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">सर्व क्विझ प्रतिसाद रीसेट करा</h4>
              <p className="text-sm text-muted-foreground">
                सर्व विद्यार्थ्यांचे क्विझ प्रतिसाद आणि उत्तरे हटवा
              </p>
            </div>
            <Button 
              variant="destructive" 
              onClick={handleResetAllQuizResponses}
              disabled={isResettingQuiz}
            >
              {isResettingQuiz ? "हटवत आहे..." : "रीसेट करा"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Media Gallery Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Images className="h-5 w-5" />
            मीडिया गॅलरी (Google Drive)
          </CardTitle>
          <CardDescription>मुख्यपृष्ठावर दिसणारी मीडिया गॅलरी लिंक</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Google Drive फोल्डर लिंक</Label>
              <Input
                value={mediaLink}
                onChange={(e) => setMediaLink(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
              />
            </div>
            <Button onClick={handleSaveMediaLink} disabled={isSavingMedia} className="gap-2">
              <Save className="h-4 w-4" />
              {isSavingMedia ? "जतन..." : "जतन करा"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Year Lock Section */}
      <YearLockManager />
    </div>
  );
};

export default AdminSettings;
