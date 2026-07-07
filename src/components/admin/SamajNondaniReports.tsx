import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Printer, Loader2 } from "lucide-react";
import logo from "@/assets/vicharmanch-logo.jpeg";

type Gender = "male" | "female" | "other";
type Edu =
  | "school_not_eligible" | "balwadi"
  | "class_1" | "class_2" | "class_3" | "class_4" | "class_5" | "class_6"
  | "class_7" | "class_8" | "class_9" | "class_10" | "class_11" | "class_12"
  | "diploma" | "degree" | "other";

const EDU_LABELS: Record<Edu, string> = {
  school_not_eligible: "शाळेत जाण्यायोग्य नाही", balwadi: "बालवाडी",
  class_1: "१ ली", class_2: "२ री", class_3: "३ री", class_4: "४ थी",
  class_5: "५ वी", class_6: "६ वी", class_7: "७ वी", class_8: "८ वी",
  class_9: "९ वी", class_10: "१० वी", class_11: "११ वी", class_12: "१२ वी",
  diploma: "डिप्लोमा", degree: "पदवी", other: "इतर",
};
const EDU_ORDER: Edu[] = [
  "school_not_eligible","balwadi","class_1","class_2","class_3","class_4","class_5",
  "class_6","class_7","class_8","class_9","class_10","class_11","class_12",
  "diploma","degree","other",
];
const GENDER_LABELS: Record<Gender, string> = { male: "पुरुष", female: "महिला", other: "इतर" };

const CHOTA: Edu[] = ["school_not_eligible","balwadi","class_1","class_2","class_3","class_4"];
const MOTHA: Edu[] = ["class_5","class_6","class_7","class_8","class_9","class_10"];
const KHULA: Edu[] = ["class_11","class_12","diploma","degree","other"];

type ReportType = "education" | "household" | "gender" | "group" | "custom";

function esc(s: any) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]!));
}

const SamajNondaniReports = () => {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ReportType>("education");
  const [loading, setLoading] = useState(false);

  // Custom filter state
  const [customGenders, setCustomGenders] = useState<Record<Gender, boolean>>({ male: true, female: true, other: false });
  const [customEdus, setCustomEdus] = useState<Record<Edu, boolean>>(
    EDU_ORDER.reduce((a, k) => ({ ...a, [k]: true }), {} as Record<Edu, boolean>)
  );

  const [activeYear, setActiveYear] = useState<string>(String(new Date().getFullYear()));

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("app_settings").select("value")
        .eq("section","event").eq("key","active_year").maybeSingle();
      if (data?.value) setActiveYear(String(data.value).replace(/"/g, ""));
    })();
  }, []);

  const generate = async () => {
    setLoading(true);
    const [{ data: hh }, { data: mm }] = await Promise.all([
      supabase.from("households").select("id, house_code, head_name, mobile").order("house_code"),
      supabase.from("household_members").select("id, household_id, name, gender, education_level, is_head"),
    ]);
    const households = (hh || []) as any[];
    const members = (mm || []) as any[];

    let body = "";
    let title = "";

    if (type === "education") {
      title = "शैक्षणिक स्तर अहवाल";
      body = EDU_ORDER.map((k) => {
        const list = members.filter((m) => m.education_level === k);
        if (list.length === 0) return "";
        return renderSection(EDU_LABELS[k], list.length,
          ["क्र.", "नाव", "लिंग"],
          list.map((m, i) => [String(i + 1), esc(m.name), GENDER_LABELS[m.gender as Gender] || "—"])
        );
      }).join("");
    } else if (type === "household") {
      title = "कुटुंब यादी अहवाल";
      const rows = households.map((h, i) => {
        const count = members.filter((m) => m.household_id === h.id).length;
        return [String(i + 1), `#${h.house_code}`, esc(h.head_name), esc(h.mobile), String(count)];
      });
      body = renderSection("एकूण कुटुंबे", households.length,
        ["क्र.", "घर क्र.", "घरमालक", "मोबाईल", "एकूण सदस्य"], rows);
    } else if (type === "gender") {
      title = "लिंग निहाय अहवाल";
      (["male","female"] as Gender[]).forEach((g) => {
        const list = members.filter((m) => m.gender === g);
        body += renderSection(GENDER_LABELS[g], list.length,
          ["क्र.", "नाव", "शैक्षणिक स्तर"],
          list.map((m, i) => [String(i + 1), esc(m.name), EDU_LABELS[m.education_level as Edu] || "—"])
        );
      });
    } else if (type === "group") {
      title = "गटनिहाय अहवाल";
      const groups: [string, Edu[]][] = [
        ["छोटा गट", CHOTA], ["मोठा गट", MOTHA], ["खुला गट", KHULA],
      ];
      groups.forEach(([label, edus]) => {
        const list = members.filter((m) => edus.includes(m.education_level as Edu));
        body += renderSection(label, list.length,
          ["क्र.", "नाव", "लिंग", "शैक्षणिक स्तर"],
          list.map((m, i) => [
            String(i + 1), esc(m.name),
            GENDER_LABELS[m.gender as Gender] || "—",
            EDU_LABELS[m.education_level as Edu] || "—",
          ])
        );
      });
    } else {
      title = "सानुकूल अहवाल";
      const selectedG = Object.entries(customGenders).filter(([,v]) => v).map(([k]) => k as Gender);
      const selectedE = Object.entries(customEdus).filter(([,v]) => v).map(([k]) => k as Edu);
      const list = members.filter((m) => selectedG.includes(m.gender) && selectedE.includes(m.education_level));
      body = renderSection("निवडलेले सदस्य", list.length,
        ["क्र.", "नाव", "लिंग", "शैक्षणिक स्तर"],
        list.map((m, i) => [
          String(i + 1), esc(m.name),
          GENDER_LABELS[m.gender as Gender] || "—",
          EDU_LABELS[m.education_level as Edu] || "—",
        ])
      );
    }

    const now = new Date();
    const html = `<!DOCTYPE html><html lang="mr"><head><meta charset="UTF-8" />
<title>${esc(title)}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  body { font-family: 'Tiro Devanagari Marathi', 'Noto Sans Devanagari', serif; color:#1e293b; margin:0; padding:0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .header { display:flex; align-items:center; gap:14px; border-bottom: 3px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 8px; }
  .header img { height:64px; width:64px; object-fit:contain; }
  .org h1 { margin:0; font-size:18px; color:#1e3a8a; }
  .org p { margin:2px 0 0; font-size:12px; color:#475569; }
  .title { text-align:center; margin: 10px 0 4px; font-size:18px; color:#1e3a8a; font-weight:700; }
  .subttl { text-align:center; font-size:12px; color:#64748b; margin-bottom: 14px; }
  .divider { height:4px; background: linear-gradient(90deg,#1e3a8a,#f59e0b,#1e3a8a); border-radius:2px; margin: 6px 0 14px; }
  .section { margin: 14px 0 18px; page-break-inside: avoid; }
  .section h2 { background:#1e3a8a; color:#fff; padding:6px 10px; margin:0 0 6px; font-size:14px; border-radius:4px; display:flex; justify-content:space-between; }
  .section h2 .count { background:#f59e0b; color:#111; padding:1px 8px; border-radius:10px; font-size:12px; }
  table { width:100%; border-collapse:collapse; font-size:12px; }
  th, td { border:1px solid #cbd5e1; padding:5px 8px; text-align:left; }
  th { background:#eff6ff; color:#1e3a8a; }
  tr:nth-child(even) td { background:#f8fafc; }
  footer { position: fixed; bottom: 6mm; left: 12mm; right: 12mm; display:flex; justify-content:space-between; font-size:10px; color:#64748b; border-top:1px solid #cbd5e1; padding-top:4px; }
  footer .mid { text-align:center; flex:1; font-weight:600; color:#1e3a8a; }
  @media print { .no-print { display:none; } }
</style></head>
<body>
  <div class="header">
    <img src="${logo}" alt="logo" />
    <div class="org">
      <h1>भारतरत्न डॉ. बाबासाहेब आंबेडकर विचारमंच</h1>
      <p>बौद्ध नगर, लातूर</p>
    </div>
  </div>
  <div class="divider"></div>
  <h2 class="title">${esc(title)}</h2>
  <p class="subttl">वर्ष: ${esc(activeYear)}</p>
  ${body || `<p style="text-align:center;color:#64748b;padding:24px;">कोणतीही नोंद नाही</p>`}
  <footer>
    <span>${now.toLocaleDateString("mr-IN")} · ${now.toLocaleTimeString("mr-IN")}</span>
    <span class="mid">समता · स्वातंत्र्य · बंधुता · न्याय</span>
    <span>वर्ष ${esc(activeYear)}</span>
  </footer>
  <p style="text-align:center;font-size:9px;color:#94a3b8;margin-top:8px;">Generated by Vicharmanch Community Operating System</p>
  <script>window.onload = () => setTimeout(() => window.print(), 300);</script>
</body></html>`;

    const w = window.open("", "_blank");
    setLoading(false);
    if (!w) { alert("Pop-up blocked"); return; }
    w.document.write(html); w.document.close();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <FileText className="h-4 w-4 mr-1" /> 📄 अहवाल तयार करा
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>समाज नोंदणी अहवाल</DialogTitle>
          <DialogDescription>अहवाल प्रकार निवडा आणि PDF तयार करा</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">अहवाल प्रकार</Label>
            <Select value={type} onValueChange={(v) => setType(v as ReportType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="education">शैक्षणिक स्तर</SelectItem>
                <SelectItem value="household">कुटुंब यादी</SelectItem>
                <SelectItem value="gender">लिंग निहाय</SelectItem>
                <SelectItem value="group">गटनिहाय</SelectItem>
                <SelectItem value="custom">सानुकूल फिल्टर</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {type === "custom" && (
            <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
              <div>
                <Label className="text-xs font-semibold">लिंग</Label>
                <div className="flex gap-4 mt-1.5">
                  {(["male","female","other"] as Gender[]).map((g) => (
                    <label key={g} className="flex items-center gap-1.5 text-sm">
                      <Checkbox checked={customGenders[g]} onCheckedChange={(v) => setCustomGenders({ ...customGenders, [g]: !!v })} />
                      {GENDER_LABELS[g]}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold">शैक्षणिक स्तर</Label>
                <div className="grid grid-cols-2 gap-1.5 mt-1.5 max-h-48 overflow-y-auto">
                  {EDU_ORDER.map((k) => (
                    <label key={k} className="flex items-center gap-1.5 text-xs">
                      <Checkbox checked={customEdus[k]} onCheckedChange={(v) => setCustomEdus({ ...customEdus, [k]: !!v })} />
                      {EDU_LABELS[k]}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>रद्द</Button>
          <Button onClick={generate} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Printer className="h-4 w-4 mr-1" />}
            PDF तयार करा
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

function renderSection(title: string, count: number, headers: string[], rows: string[][]) {
  if (count === 0) return "";
  return `<div class="section">
    <h2><span>${title}</span><span class="count">एकूण: ${count}</span></h2>
    <table>
      <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>
  </div>`;
}

export default SamajNondaniReports;
