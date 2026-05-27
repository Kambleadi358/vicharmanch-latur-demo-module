import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, Trash2, FileText, Upload, Pencil } from "lucide-react";

interface AnnualReport {
  id: string;
  year: string;
  title: string;
  pdf_url: string | null;
  pdf_path: string | null;
  remark: string | null;
  total_jama: number;
  total_expense: number;
}

const AnnualReportManagement = () => {
  const [reports, setReports] = useState<AnnualReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [year, setYear] = useState("");
  const [remark, setRemark] = useState("");
  const [jama, setJama] = useState("");
  const [expense, setExpense] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("annual_reports")
      .select("*")
      .order("year", { ascending: false });
    if (error) toast({ title: "त्रुटी", description: error.message, variant: "destructive" });
    else setReports((data as AnnualReport[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const reset = () => {
    setEditingId(null); setYear(""); setRemark(""); setJama(""); setExpense(""); setFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!year.trim()) { toast({ title: "वर्ष आवश्यक", variant: "destructive" }); return; }
    if (!/^\d{4}$/.test(year.trim())) { toast({ title: "वर्ष ४ अंकी असावे", variant: "destructive" }); return; }

    setSaving(true);
    try {
      let pdf_url: string | null = null;
      let pdf_path: string | null = null;

      if (file) {
        if (file.type !== "application/pdf") throw new Error("फक्त PDF फाइल अपलोड करा");
        if (file.size > 20 * 1024 * 1024) throw new Error("फाइल २०MB पेक्षा कमी असावी");
        const path = `${year}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("annual-reports").upload(path, file, { upsert: true });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("annual-reports").getPublicUrl(path);
        pdf_url = pub.publicUrl;
        pdf_path = path;
      }

      const payload: any = {
        year: year.trim(),
        title: `भीम जयंती ${year.trim()}`,
        remark: remark.trim() || null,
        total_jama: Number(jama) || 0,
        total_expense: Number(expense) || 0,
      };
      if (pdf_url) { payload.pdf_url = pdf_url; payload.pdf_path = pdf_path; }

      if (editingId) {
        const { error } = await supabase.from("annual_reports").update(payload).eq("id", editingId);
        if (error) throw error;
        toast({ title: "अहवाल अद्ययावत झाला" });
      } else {
        const { error } = await supabase.from("annual_reports").insert(payload);
        if (error) throw error;
        toast({ title: "अहवाल जतन झाला" });
      }
      reset();
      fetch();
    } catch (err: any) {
      toast({ title: "त्रुटी", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (r: AnnualReport) => {
    setEditingId(r.id);
    setYear(r.year);
    setRemark(r.remark || "");
    setJama(String(r.total_jama));
    setExpense(String(r.total_expense));
    setFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (r: AnnualReport) => {
    if (!confirm(`${r.title} हटवायचे?`)) return;
    if (r.pdf_path) await supabase.storage.from("annual-reports").remove([r.pdf_path]);
    const { error } = await supabase.from("annual_reports").delete().eq("id", r.id);
    if (error) toast({ title: "त्रुटी", description: error.message, variant: "destructive" });
    else { toast({ title: "हटवले" }); fetch(); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> वार्षिक अहवाल व्यवस्थापन</CardTitle>
        <CardDescription>वर्षनिहाय भीम जयंती अहवाल जतन करा (PDF, जमा, खर्च)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="grid gap-4 p-4 border rounded-lg bg-muted/30">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>वर्ष *</Label>
              <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="2025" maxLength={4} disabled={!!editingId} />
              {year && <p className="text-xs text-muted-foreground mt-1">शीर्षक: <strong>भीम जयंती {year}</strong></p>}
            </div>
            <div>
              <Label>PDF फाइल {editingId && "(बदलण्यासाठीच निवडा)"}</Label>
              <Input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <Label>एकूण जमा (₹)</Label>
              <Input type="number" value={jama} onChange={(e) => setJama(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>एकूण खर्च (₹)</Label>
              <Input type="number" value={expense} onChange={(e) => setExpense(e.target.value)} placeholder="0" />
            </div>
          </div>
          <div>
            <Label>शेरा / Remark</Label>
            <Textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={3} placeholder="अहवालाबद्दल टिप्पणी..." />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              {editingId ? "अद्ययावत करा" : "जतन करा"}
            </Button>
            {editingId && <Button type="button" variant="outline" onClick={reset}>रद्द करा</Button>}
          </div>
        </form>

        <div className="space-y-3">
          <h3 className="font-semibold">जतन केलेले अहवाल</h3>
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : reports.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">कोणताही अहवाल नाही</p>
          ) : (
            <div className="space-y-2">
              {reports.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 p-3 border rounded-lg bg-card">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground">
                      जमा: ₹{Number(r.total_jama).toLocaleString("en-IN")} · खर्च: ₹{Number(r.total_expense).toLocaleString("en-IN")}
                    </p>
                    {r.remark && <p className="text-xs mt-1 line-clamp-2">{r.remark}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    {r.pdf_url && (
                      <a href={r.pdf_url} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline"><FileText className="h-4 w-4" /></Button>
                      </a>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleEdit(r)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(r)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AnnualReportManagement;
