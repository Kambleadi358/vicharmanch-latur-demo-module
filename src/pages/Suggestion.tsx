import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Home, MessageSquarePlus, Loader2, CheckCircle2 } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(1, "नाव आवश्यक").max(100),
  mobile: z.string().trim().max(15).optional().or(z.literal("")),
  category: z.enum(["suggestion", "complaint", "feedback", "other"]),
  message: z.string().trim().min(5, "संदेश किमान ५ अक्षरांचा हवा").max(2000),
});

const Suggestion = () => {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [category, setCategory] = useState<"suggestion" | "complaint" | "feedback" | "other">("suggestion");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ name, mobile, category, message });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "वैध माहिती भरा");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("suggestions").insert({
      name: parsed.data.name,
      mobile: parsed.data.mobile || null,
      category: parsed.data.category,
      message: parsed.data.message,
      is_anonymous: false,
    });
    setSubmitting(false);
    if (error) {
      toast.error("त्रुटी: " + error.message);
      return;
    }
    setSubmitted(true);
    toast.success("आपला संदेश यशस्वी पाठविला!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/30">
      <header className="bg-gradient-to-r from-primary via-[hsl(217,80%,30%)] to-[hsl(220,15%,15%)] text-primary-foreground shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5" />
            <h1 className="font-bold text-base sm:text-lg">सुझाव पेटी</h1>
          </div>
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
              <Home className="h-4 w-4 mr-1" /> मुख्यपृष्ठ
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 sm:p-6">
        {submitted ? (
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardContent className="py-10 text-center space-y-3">
              <CheckCircle2 className="h-14 w-14 mx-auto text-emerald-600" />
              <h2 className="text-xl font-bold">धन्यवाद!</h2>
              <p className="text-sm text-muted-foreground">
                आपला संदेश विचारमंचापर्यंत पोचला आहे. आम्ही लवकरच त्यावर विचार करू.
              </p>
              <Button onClick={() => { setSubmitted(false); setName(""); setMobile(""); setMessage(""); setCategory("suggestion"); }}>
                आणखी एक संदेश पाठवा
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">आपला संदेश आम्हाला महत्त्वाचा आहे</CardTitle>
              <p className="text-xs text-muted-foreground pt-1">
                सुझाव, तक्रार, अभिप्राय किंवा इतर कोणतीही बाब आम्हाला कळवा.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">नाव *</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="आपले नाव" maxLength={100} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">मोबाईल (वैकल्पिक)</Label>
                    <Input value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="९८XXXXXXXX" inputMode="numeric" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">प्रकार *</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="suggestion">सुझाव</SelectItem>
                      <SelectItem value="complaint">तक्रार</SelectItem>
                      <SelectItem value="feedback">अभिप्राय</SelectItem>
                      <SelectItem value="other">इतर</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">संदेश *</Label>
                  <Textarea rows={5} maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="आपला संदेश सविस्तर लिहा..." />
                  <p className="text-[10px] text-muted-foreground text-right">{message.length}/2000</p>
                </div>

                <Button type="submit" disabled={submitting} className="w-full" size="lg">
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} पाठवा
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Suggestion;
