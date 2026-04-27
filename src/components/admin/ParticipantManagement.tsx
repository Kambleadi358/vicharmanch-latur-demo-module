import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Printer, Trash2, Users, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const categoryLabels: Record<string, string> = {
  chota: "छोटा गट",
  motha: "मोठा गट",
  khula: "खुला गट",
};

interface Participant {
  id: string;
  name: string;
  category: string;
  competition_id: string;
  created_at: string;
  competition_name?: string;
}

const ParticipantManagement = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [comps, setComps] = useState<{ id: string; name: string }[]>([]);
  const [filterComp, setFilterComp] = useState<string>("all");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    // participants.competition_id stores either a competitions.id or (legacy) a programs.id.
    // Load both, build a unified id→name map so all rows display correctly.
    const [{ data: parts, error: pErr }, { data: comps }, { data: progs }] = await Promise.all([
      supabase
        .from("participants")
        .select("id, name, category, competition_id, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("competitions").select("id, name").order("name"),
      supabase.from("programs").select("id, name").order("name"),
    ]);
    if (pErr) {
      toast({ title: "त्रुटी", description: pErr.message, variant: "destructive" });
    }
    const nameMap = new Map<string, string>();
    (progs ?? []).forEach((p: any) => nameMap.set(p.id, p.name));
    (comps ?? []).forEach((c: any) => nameMap.set(c.id, c.name)); // competitions win
    const merged: Participant[] = (parts ?? []).map((p: any) => ({
      ...p,
      competition_name: nameMap.get(p.competition_id) ?? "—",
    }));
    setItems(merged);
    setComps((comps ?? []) as any);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("ही नोंदणी काढून टाकायची?")) return;
    const { error } = await supabase.from("participants").delete().eq("id", id);
    if (error) {
      toast({ title: "त्रुटी", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "काढले" });
    load();
  };

  const filtered = useMemo(() => {
    return items.filter((p) => {
      if (filterComp !== "all" && p.competition_id !== filterComp) return false;
      if (filterCat !== "all" && p.category !== filterCat) return false;
      if (search.trim() && !p.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [items, filterComp, filterCat, search]);

  const handlePrint = () => {
    const rows = filtered
      .map(
        (p, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${escapeHtml(p.name)}</td>
          <td>${categoryLabels[p.category] ?? p.category}</td>
          <td>${escapeHtml(p.competition_name ?? "—")}</td>
          <td>${new Date(p.created_at).toLocaleString("mr-IN")}</td>
        </tr>`
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="mr">
<head>
<meta charset="UTF-8" />
<title>सहभागी नोंदणी अहवाल</title>
<style>
  body { font-family: 'Tiro Devanagari Marathi', 'Noto Sans Devanagari', serif; padding: 24px; color: #1e293b; }
  h1 { text-align: center; margin: 0 0 4px; color: #1e3a8a; }
  .sub { text-align: center; color: #475569; margin-bottom: 16px; font-size: 13px; }
  .meta { display:flex; justify-content:space-between; font-size:12px; color:#475569; margin-bottom:12px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
  th { background: #1e3a8a; color: #fff; }
  tr:nth-child(even) td { background: #f8fafc; }
  .footer { text-align:center; margin-top: 24px; font-size: 11px; color: #64748b; }
  @media print { body { padding: 12px; } }
</style>
</head>
<body>
  <h1>सहभागी नोंदणी अहवाल</h1>
  <p class="sub">डॉ. बाबासाहेब आंबेडकर विचारमंच, लातूर</p>
  <div class="meta">
    <span>एकूण नोंदी: <strong>${filtered.length}</strong></span>
    <span>दिनांक: ${new Date().toLocaleString("mr-IN")}</span>
  </div>
  <table>
    <thead>
      <tr>
        <th>क्र.</th>
        <th>सहभागीचे नाव</th>
        <th>गट</th>
        <th>स्पर्धा / कार्यक्रम</th>
        <th>नोंदणी वेळ</th>
      </tr>
    </thead>
    <tbody>${rows || `<tr><td colspan="6" style="text-align:center;color:#64748b;padding:20px;">कोणतीही नोंद नाही</td></tr>`}</tbody>
  </table>
  <p class="footer">— विचारमंच लातूर —</p>
  <script>window.onload = () => { window.print(); };</script>
</body>
</html>`;

    const w = window.open("", "_blank");
    if (!w) {
      toast({ title: "Pop-up blocked", description: "Allow pop-ups to print.", variant: "destructive" });
      return;
    }
    w.document.write(html);
    w.document.close();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> सहभागी नोंदणी
            </CardTitle>
            <CardDescription>स्पर्धेसाठी नोंदणी केलेले सहभागी पहा व अहवाल छापा</CardDescription>
          </div>
          <Button onClick={handlePrint} disabled={filtered.length === 0}>
            <Printer className="h-4 w-4 mr-2" /> अहवाल छापा / PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="नाव शोधा..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterComp} onValueChange={setFilterComp}>
            <SelectTrigger><SelectValue placeholder="स्पर्धा फिल्टर" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">सर्व स्पर्धा</SelectItem>
              {comps.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger><SelectValue placeholder="गट फिल्टर" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">सर्व गट</SelectItem>
              <SelectItem value="chota">छोटा गट</SelectItem>
              <SelectItem value="motha">मोठा गट</SelectItem>
              <SelectItem value="khula">खुला गट</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>क्र.</TableHead>
                  <TableHead>नाव</TableHead>
                  <TableHead>गट</TableHead>
                  <TableHead>स्पर्धा</TableHead>
                  <TableHead>नोंदणी वेळ</TableHead>
                  <TableHead className="text-right">क्रिया</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">कोणतीही नोंद नाही</TableCell></TableRow>
                ) : filtered.map((p, i) => (
                  <TableRow key={p.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{categoryLabels[p.category] ?? p.category}</TableCell>
                    <TableCell>{p.competition_name ?? "—"}</TableCell>
                    <TableCell className="text-xs">{new Date(p.created_at).toLocaleString("mr-IN")}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <p className="text-xs text-muted-foreground">एकूण: {filtered.length} नोंदी</p>
      </CardContent>
    </Card>
  );
};

function escapeHtml(s: string) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export default ParticipantManagement;
