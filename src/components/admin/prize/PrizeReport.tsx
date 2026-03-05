import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Package, AlertTriangle } from "lucide-react";

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

  // Calculate stock
  const getAllocatedCount = (itemId: string) => allocations?.filter((a: any) => a.prize_item_id === itemId).length || 0;

  const rankOrder: Record<string, number> = { "प्रथम": 1, "द्वितीय": 2, "तृतीय": 3 };

  return (
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
  );
};

export default PrizeReport;
