import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { MessageSquare, Phone, Search, CheckCircle2, XCircle, Clock, Copy, MessageCircle, Loader2 } from "lucide-react";
import { logAdminAction } from "@/lib/activityLog";

type Status = "new" | "accepted" | "rejected" | "resolved";
type Category = "suggestion" | "complaint" | "feedback" | "other";

interface Suggestion {
  id: string;
  name: string;
  mobile: string | null;
  category: Category;
  message: string;
  status: Status;
  is_anonymous: boolean;
  admin_response: string | null;
  resolved_at: string | null;
  created_at: string;
}

const CAT_LABEL: Record<Category, string> = {
  suggestion: "सुझाव", complaint: "तक्रार", feedback: "अभिप्राय", other: "इतर",
};
const STATUS_LABEL: Record<Status, string> = {
  new: "नवीन", accepted: "स्वीकारले", rejected: "नाकारले", resolved: "निरसन",
};
const STATUS_STYLE: Record<Status, string> = {
  new: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  accepted: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  rejected: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  resolved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
};

const SuggestionManagement = () => {
  const [list, setList] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [detail, setDetail] = useState<Suggestion | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("suggestions").select("*").order("created_at", { ascending: false });
    setList((data as any) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () =>
      list.filter((s) => {
        if (statusFilter !== "all" && s.status !== statusFilter) return false;
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return s.name.toLowerCase().includes(q) || (s.mobile || "").includes(q) || s.message.toLowerCase().includes(q);
      }),
    [list, search, statusFilter],
  );

  const counts = useMemo(() => {
    const c: Record<Status, number> = { new: 0, accepted: 0, rejected: 0, resolved: 0 };
    list.forEach((s) => { c[s.status]++; });
    return c;
  }, [list]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["new", "accepted", "resolved", "rejected"] as Status[]).map((s) => (
          <Card key={s} className="border-0 shadow-sm">
            <CardContent className="p-3">
              <p className="text-[11px] text-muted-foreground">{STATUS_LABEL[s]}</p>
              <p className="text-2xl font-bold">{counts[s]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" /> सुझाव पेटी
              <Badge variant="outline">{filtered.length}</Badge>
            </CardTitle>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">सर्व</SelectItem>
                <SelectItem value="new">नवीन</SelectItem>
                <SelectItem value="accepted">स्वीकारले</SelectItem>
                <SelectItem value="resolved">निरसन</SelectItem>
                <SelectItem value="rejected">नाकारले</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="relative mt-2">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9 h-10" placeholder="नाव, मोबाईल किंवा संदेशाने शोधा..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">लोड होत आहे...</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">कोणतेही संदेश नाहीत</div>
          ) : (
            <div className="divide-y">
              {filtered.map((s) => (
                <button key={s.id} onClick={() => setDetail(s)} className="w-full text-left py-3 hover:bg-muted/40 -mx-2 px-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-sm">{s.name}</span>
                    <Badge variant="outline" className="text-[10px]">{CAT_LABEL[s.category]}</Badge>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_STYLE[s.status]}`}>{STATUS_LABEL[s.status]}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{new Date(s.created_at).toLocaleDateString("mr-IN")}</span>
                  </div>
                  {s.mobile && (
                    <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1"><Phone className="h-3 w-3" />{s.mobile}</p>
                  )}
                  <p className="text-sm text-foreground/90 line-clamp-2 mt-1">{s.message}</p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {detail && <SuggestionDetailDialog suggestion={detail} onClose={() => setDetail(null)} onChanged={load} />}
    </div>
  );
};

const SuggestionDetailDialog = ({ suggestion, onClose, onChanged }: {
  suggestion: Suggestion; onClose: () => void; onChanged: () => void;
}) => {
  const [response, setResponse] = useState(suggestion.admin_response || "");
  const [saving, setSaving] = useState(false);

  const setStatus = async (status: Status) => {
    setSaving(true);
    const payload: any = { status };
    if (status === "resolved") {
      payload.admin_response = response.trim() || null;
      payload.resolved_at = new Date().toISOString();
    }
    const { error } = await supabase.from("suggestions").update(payload).eq("id", suggestion.id);
    setSaving(false);
    if (error) { toast.error("त्रुटी: " + error.message); return; }
    logAdminAction(`suggestion.${status}`, "suggestion", suggestion.id);
    toast.success("स्थिती अद्ययावत");
    onChanged();
    onClose();
  };

  const draftMsg = `नमस्कार ${suggestion.name},\n\nआपण पाठवलेल्या संदेशाबद्दल धन्यवाद. ${response || "आम्ही आपल्या सूचनेवर विचार केला असून योग्य कार्यवाही करण्यात आली आहे."}\n\nधन्यवाद.\nभारतरत्न डॉ. बाबासाहेब आंबेडकर विचारमंच\nबौद्ध नगर, लातूर`;
  const waLink = suggestion.mobile ? `https://wa.me/91${suggestion.mobile}?text=${encodeURIComponent(draftMsg)}` : null;

  return (
    <Dialog open onOpenChange={(b) => !b && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> संदेश तपशील
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><b>पाठवणारा:</b> {suggestion.name}</div>
            <div><b>प्रकार:</b> {CAT_LABEL[suggestion.category]}</div>
            {suggestion.mobile && <div className="col-span-2"><b>मोबाईल:</b> {suggestion.mobile}</div>}
            <div className="col-span-2"><b>दिनांक:</b> {new Date(suggestion.created_at).toLocaleString("mr-IN")}</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3 whitespace-pre-wrap">{suggestion.message}</div>

          <div className="space-y-1.5">
            <Label className="text-xs">प्रशासकीय उत्तर (निरसनसाठी)</Label>
            <Textarea rows={3} value={response} onChange={(e) => setResponse(e.target.value)} placeholder="आपले उत्तर लिहा..." />
          </div>

          {waLink && (
            <div className="rounded-lg border p-2 bg-card">
              <div className="flex items-center justify-between mb-1">
                <Label className="text-[11px] font-semibold">उत्तर संदेश</Label>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(draftMsg); toast.success("कॉपी झाले"); }}>
                    <Copy className="h-3 w-3 mr-1" /> कॉपी
                  </Button>
                  <Button size="sm" asChild className="bg-green-600 hover:bg-green-700 text-white">
                    <a href={waLink} target="_blank" rel="noreferrer"><MessageCircle className="h-3 w-3 mr-1" /> WhatsApp</a>
                  </Button>
                </div>
              </div>
              <pre className="text-[10px] whitespace-pre-wrap bg-muted/40 rounded p-2 max-h-32 overflow-y-auto">{draftMsg}</pre>
            </div>
          )}
        </div>
        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={onClose}>बंद</Button>
          {suggestion.status !== "rejected" && (
            <Button variant="outline" disabled={saving} onClick={() => setStatus("rejected")} className="border-rose-300 text-rose-700 hover:bg-rose-50">
              <XCircle className="h-4 w-4 mr-1" /> नाकारा
            </Button>
          )}
          {suggestion.status === "new" && (
            <Button variant="outline" disabled={saving} onClick={() => setStatus("accepted")} className="border-amber-300 text-amber-700 hover:bg-amber-50">
              <Clock className="h-4 w-4 mr-1" /> स्वीकारा
            </Button>
          )}
          {suggestion.status !== "resolved" && (
            <Button disabled={saving} onClick={() => setStatus("resolved")} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} <CheckCircle2 className="h-4 w-4 mr-1" /> निरसन
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SuggestionManagement;
