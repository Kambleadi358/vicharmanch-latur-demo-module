import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Send, Bell, Trash2, Loader2 } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface NotificationRow {
  id: string;
  title: string;
  body: string;
  link: string | null;
  category: string;
  created_at: string;
}

const CATEGORIES = [
  { value: "general", label: "सामान्य" },
  { value: "notice", label: "सूचना" },
  { value: "program", label: "कार्यक्रम" },
  { value: "quiz", label: "प्रश्नमंजुषा" },
  { value: "accounts", label: "खाते" },
  { value: "spardha", label: "स्पर्धा" },
];

const QUICK_LINKS = [
  { path: "/", label: "मुख्य पृष्ठ" },
  { path: "/programs", label: "कार्यक्रम" },
  { path: "/quiz", label: "प्रश्नमंजुषा" },
  { path: "/accounts", label: "खाते माहिती" },
  { path: "/suggestion", label: "सुझाव पेटी" },
  { path: "/spardha", label: "स्पर्धा" },
  { path: "/ahval", label: "वार्षिक अहवाल" },
];

const NotificationManagement = () => {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body: "",
    link: "",
    category: "general",
  });
  const { toast } = useToast();
  const push = usePushNotifications();
  const [testing, setTesting] = useState(false);

  const refresh = async () => {
    const [{ data: notifs }, { data: subs }] = await Promise.all([
      supabase
        .from("notifications")
        .select("id,title,body,link,category,created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("push_subscriptions").select("id", { count: "exact", head: true }),
    ]);
    if (notifs) setItems(notifs as NotificationRow[]);
    setSubscriberCount(subs?.length ?? 0);
  };

  useEffect(() => { refresh(); }, []);

  const testThisDevice = async () => {
    if (!('Notification' in window)) {
      toast({ title: "सूचना उपलब्ध नाहीत", description: "या ब्राउझरमध्ये सूचना समर्थित नाहीत.", variant: "destructive" });
      return;
    }
    if (Notification.permission === "denied") {
      toast({ title: "सूचना परवानगी नाकारली", description: "कृपया Browser/App Settings मधून सूचना सुरू करा.", variant: "destructive" });
      return;
    }
    setTesting(true);
    try {
      const registration = await push.register();
      if (registration.status !== "registered") {
        const messages: Record<string, string> = {
          "open-in-new-tab": "पूर्वावलोकन स्वतंत्र टॅबमध्ये उघडा किंवा प्रकाशित अॅप वापरा.",
          denied: "कृपया Browser/App Settings मधून सूचना सुरू करा.",
          unsupported: push.registrationError || "या उपकरणावर सूचना समर्थित नाहीत.",
          "not-configured": "सूचना सेवा सध्या जोडलेली नाही.",
        };
        toast({ title: "सूचना चाचणी अयशस्वी", description: messages[registration.status], variant: "destructive" });
        return;
      }
      const { data, error } = await supabase.functions.invoke("send-push-notification", { body: { mode: "test", token: registration.token } });
      if (error) {
        const details = (data as { details?: string; error?: string } | null)?.details || error.message;
        toast({ title: "चाचणी सूचना पाठवता आली नाही", description: details, variant: "destructive" });
        return;
      }
      const result = data as { ok?: boolean; pushed?: number; failed?: number; provider_error?: { status: number; details: string } | null };
      if (!result?.ok || result.pushed !== 1 || result.failed) {
        toast({ title: "चाचणी सूचना पोहोचवता आली नाही", description: result?.provider_error?.details || "सूचना सेवा वितरणाची पुष्टी करू शकली नाही.", variant: "destructive" });
      } else {
        toast({ title: "चाचणी सूचना पाठवली", description: "सूचना सेवेकडून या उपकरणासाठी स्वीकारली गेली. प्रत्यक्ष प्रदर्शनासाठी उपकरणाची सूचना परवानगी सुरू असणे आवश्यक आहे." });
      }
    } catch (error) {
      toast({ title: "चाचणी सूचना अयशस्वी", description: error instanceof Error ? error.message : "सूचना चाचणी पूर्ण करता आली नाही.", variant: "destructive" });
    } finally {
      setTesting(false);
      await refresh();
    }
  };

  const send = async () => {
    if (!form.title.trim()) {
      toast({ title: "शीर्षक आवश्यक आहे", variant: "destructive" });
      return;
    }
    setSending(true);
    const { data, error } = await supabase.functions.invoke("send-push-notification", {
      body: {
        title: form.title.trim(),
        body: form.body.trim(),
        link: form.link.trim() || null,
        category: form.category,
      },
    });
    setSending(false);
    if (error) {
      toast({ title: "पाठवण्यात अयशस्वी", description: error.message, variant: "destructive" });
      return;
    }
    const r = data as { pushed?: number; failed?: number; total_subscribers?: number };
    toast({
      title: "सूचना पाठवली",
      description: `${r.pushed ?? 0} उपकरणांवर पोहोचली${r.failed ? `, ${r.failed} अयशस्वी` : ""}`,
    });
    setForm({ title: "", body: "", link: "", category: "general" });
    refresh();
  };

  const remove = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    refresh();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> या उपकरणावर सूचना तपासा</CardTitle>
          <CardDescription>
            परवानगी: {typeof Notification === "undefined" ? "उपलब्ध नाही" : Notification.permission === "granted" ? "मंजूर" : Notification.permission === "denied" ? "नाकारली" : "विनंती बाकी"} · चाचणी फक्त या उपकरणावर पाठवली जाईल. Android वेब-अॅपमध्ये सूचना मिळणे वापरलेल्या APK रूपांतरकाच्या WebView/FCM समर्थनावर अवलंबून आहे.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={testThisDevice} disabled={testing}>
            {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bell className="h-4 w-4 mr-2" />}
            चाचणी सूचना पाठवा
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" /> नवीन सूचना पाठवा
          </CardTitle>
          <CardDescription>
            सर्व नोंदणीकृत उपकरणांवर पुश सूचना पाठवा. सध्या{" "}
            <Badge variant="secondary">{subscriberCount} उपकरणे</Badge> सक्रिय.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>शीर्षक</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="सूचना शीर्षक"
                maxLength={100}
              />
            </div>
            <div className="space-y-1.5">
              <Label>वर्ग</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>संदेश</Label>
            <Textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="सूचनेचा सविस्तर संदेश"
              rows={3}
              maxLength={500}
            />
          </div>
          <div className="space-y-1.5">
            <Label>दुवा (क्लिक केल्यावर हे पृष्ठ उघडेल)</Label>
            <div className="flex gap-2">
              <Input
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                placeholder="/programs"
              />
              <Select
                value=""
                onValueChange={(v) => setForm({ ...form, link: v })}
              >
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="द्रुत दुवे" /></SelectTrigger>
                <SelectContent>
                  {QUICK_LINKS.map((q) => (
                    <SelectItem key={q.path} value={q.path}>{q.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={send} disabled={sending} className="w-full sm:w-auto">
            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            पाठवा
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" /> अलीकडील सूचना
          </CardTitle>
          <CardDescription>पाठवलेल्या सूचनांचा इतिहास</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              कोणतीही सूचना पाठवली नाही
            </p>
          ) : (
            <ul className="divide-y">
              {items.map((n) => (
                <li key={n.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{CATEGORIES.find((c) => c.value === n.category)?.label ?? n.category}</Badge>
                      {n.link && <span className="text-[11px] text-muted-foreground">→ {n.link}</span>}
                    </div>
                    <p className="text-sm font-medium mt-1">{n.title}</p>
                    {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(n.created_at).toLocaleString("mr-IN")}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => remove(n.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationManagement;
