import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Package, AlertTriangle, Printer } from "lucide-react";

const PrizeReport = () => {
  const { data: allocations } = useQuery({
    queryKey: ["prize-allocations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prize_allocations")
        .select("*, programs(name, date), prize_items(item_name)")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: prizeItems } = useQuery({
    queryKey: ["prize-items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("prize_items").select("*").order("item_name");
      if (error) throw error;
      return data;
    },
  });

  // Group allocations by program
  const grouped: Record<string, { name: string; date: string; groups: Record<string, Array<{ winner_name: string; rank: string; item_name: string }>> }> = {};
  allocations?.forEach((a: any) => {
    const pid = a.program_id;
    if (!grouped[pid]) {
      grouped[pid] = { name: a.programs?.name || "", date: a.programs?.date || "", groups: {} };
    }
    if (!grouped[pid].groups[a.group_name]) {
      grouped[pid].groups[a.group_name] = [];
    }
    grouped[pid].groups[a.group_name].push({
      winner_name: a.winner_name,
      rank: a.rank,
      item_name: a.prize_items?.item_name || "",
    });
  });

  const getAllocatedCount = (itemId: string) => allocations?.filter((a: any) => a.prize_item_id === itemId).length || 0;

  const rankOrder: Record<string, number> = { "प्रथम": 1, "द्वितीय": 2, "तृतीय": 3 };

  const handlePrintAll = () => {
    // Build complete stock summary
    const stockRows = prizeItems?.map((item) => {
      const allocated = getAllocatedCount(item.id);
      const remaining = item.quantity - allocated;
      return `<tr style="${remaining <= 0 ? 'background:#fef2f2;' : ''}">
        <td style="padding:6px 10px;border:1px solid #e5e7eb;">${item.item_name}${remaining <= 0 ? ' ⚠️' : ''}</td>
        <td style="padding:6px 10px;border:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
        <td style="padding:6px 10px;border:1px solid #e5e7eb;text-align:center;">${allocated}</td>
        <td style="padding:6px 10px;border:1px solid #e5e7eb;text-align:center;font-weight:bold;color:${remaining <= 0 ? '#dc2626' : '#16a34a'}">${remaining}</td>
      </tr>`;
    }).join("") || "";

    // Build distribution sections
    const programSections = Object.entries(grouped).map(([, prog]) => {
      const groupSections = Object.entries(prog.groups).map(([groupName, winners]) => {
        const sortedWinners = [...winners].sort((a, b) => (rankOrder[a.rank] || 99) - (rankOrder[b.rank] || 99));
        const winnerRows = sortedWinners.map((w) =>
          `<div style="display:flex;gap:8px;align-items:center;padding:3px 0;font-size:13px;">
            <span style="min-width:70px;text-align:center;border:1px solid #d1d5db;border-radius:4px;padding:2px 6px;font-size:11px;background:#f9fafb;">
              ${w.rank === "प्रथम" ? "🥇" : w.rank === "द्वितीय" ? "🥈" : "🥉"} ${w.rank}
            </span>
            <span style="font-weight:500;">${w.winner_name}</span>
            <span style="color:#9ca3af;">→</span>
            <span style="color:#0284c7;font-weight:500;">${w.item_name}</span>
          </div>`
        ).join("");
        return `<div style="margin-bottom:8px;">
          <h4 style="font-size:13px;font-weight:600;color:#0ea5e9;margin-bottom:4px;">${groupName}</h4>
          <div style="padding-left:8px;">${winnerRows}</div>
        </div>`;
      }).join("");

      return `<div style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:16px;">
        <div style="background:#eff6ff;padding:10px 14px;">
          <h3 style="font-weight:700;font-size:15px;margin:0;">${prog.name}</h3>
          <p style="font-size:11px;color:#6b7280;margin:2px 0 0 0;">दिनांक: ${prog.date}</p>
        </div>
        <div style="padding:12px 14px;">${groupSections}</div>
      </div>`;
    }).join("");

    const printHTML = `<!DOCTYPE html>
<html lang="mr">
<head>
<meta charset="UTF-8">
<title>बक्षीस वितरण अहवाल</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
@page{size:A4 portrait;margin:15mm;}
body{font-family:'Noto Sans Devanagari',sans-serif;background:white;color:#1a1a1a;padding:10px;}
h1{text-align:center;font-size:20px;margin-bottom:4px;}
.subtitle{text-align:center;font-size:12px;color:#6b7280;margin-bottom:20px;}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
table{width:100%;border-collapse:collapse;font-size:13px;}
th{background:#0ea5e9;color:white;padding:8px 10px;text-align:left;border:1px solid #0ea5e9;}
th.center{text-align:center;}
@media print{body{padding:0;}}
</style>
</head>
<body>
<h1>बक्षीस वितरण अहवाल</h1>
<p class="subtitle">भारतरत्न डॉ. बाबासाहेब आंबेडकर विचारमंच</p>

<div class="two-col">
  <div>
    <h2 style="font-size:16px;margin-bottom:10px;display:flex;align-items:center;gap:6px;">📋 बक्षीस वितरण</h2>
    ${programSections || '<p style="text-align:center;color:#9ca3af;padding:20px;">कोणताही डेटा नाही</p>'}
  </div>
  <div>
    <h2 style="font-size:16px;margin-bottom:10px;display:flex;align-items:center;gap:6px;">📦 वस्तू स्टॉक सारांश</h2>
    <table>
      <thead>
        <tr>
          <th>वस्तू</th>
          <th class="center">खरेदी</th>
          <th class="center">वाटप</th>
          <th class="center">शिल्लक</th>
        </tr>
      </thead>
      <tbody>
        ${stockRows || '<tr><td colspan="4" style="text-align:center;padding:16px;color:#9ca3af;">कोणत्याही वस्तू नाहीत</td></tr>'}
      </tbody>
    </table>
  </div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print();},600);};</script>
</body>
</html>`;

    const w = window.open("", "_blank");
    if (w) {
      w.document.write(printHTML);
      w.document.close();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handlePrintAll} className="gap-2">
          <Printer className="h-4 w-4" />
          संपूर्ण अहवाल PDF प्रिंट करा
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Distribution Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              बक्षीस वितरण अहवाल
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6" id="prize-report">
            {Object.keys(grouped).length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">कोणताही डेटा नाही</p>
            ) : (
              Object.entries(grouped).map(([pid, prog]) => (
                <div key={pid} className="border rounded-lg overflow-hidden">
                  <div className="bg-primary/10 px-4 py-3">
                    <h3 className="font-bold text-foreground">{prog.name}</h3>
                    <p className="text-xs text-muted-foreground">दिनांक: {prog.date}</p>
                  </div>
                  <div className="p-4 space-y-3">
                    {Object.entries(prog.groups).map(([groupName, winners]) => (
                      <div key={groupName}>
                        <h4 className="font-semibold text-sm text-accent mb-2">{groupName}</h4>
                        <div className="space-y-1 pl-2">
                          {winners
                            .sort((a, b) => (rankOrder[a.rank] || 99) - (rankOrder[b.rank] || 99))
                            .map((w, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <Badge variant="outline" className="text-xs min-w-[50px] justify-center">
                                  {w.rank === "प्रथम" ? "🥇" : w.rank === "द्वितीय" ? "🥈" : "🥉"} {w.rank}
                                </Badge>
                                <span className="font-medium">{w.winner_name}</span>
                                <span className="text-muted-foreground">→</span>
                                <span className="text-accent font-medium">{w.item_name}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Column 2: Item Stock Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" />
              वस्तू स्टॉक सारांश
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>वस्तू</TableHead>
                    <TableHead className="text-center">खरेदी</TableHead>
                    <TableHead className="text-center">वाटप</TableHead>
                    <TableHead className="text-center">शिल्लक</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prizeItems?.map((item) => {
                    const allocated = getAllocatedCount(item.id);
                    const remaining = item.quantity - allocated;
                    const isShortage = remaining <= 0;
                    return (
                      <TableRow key={item.id} className={isShortage ? "bg-destructive/10" : ""}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {item.item_name}
                            {isShortage && <AlertTriangle className="h-4 w-4 text-destructive" />}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-center">{allocated}</TableCell>
                        <TableCell className={`text-center font-bold ${isShortage ? "text-destructive" : "text-green-600"}`}>
                          {remaining}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!prizeItems || prizeItems.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        कोणत्याही वस्तू नाहीत
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrizeReport;
