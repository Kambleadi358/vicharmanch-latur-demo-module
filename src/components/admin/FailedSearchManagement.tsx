import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, UserX, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Row {
  id: string;
  entered_name: string;
  competition_name: string | null;
  created_at: string;
}

const FailedSearchManagement = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("failed_participation_searches")
      .select("id, entered_name, competition_name, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    setRows((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    const { error } = await supabase.from("failed_participation_searches").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("नोंद हटवली"); load(); }
  };

  const clearAll = async () => {
    if (!confirm("सर्व नोंदी हटवायच्या?")) return;
    const { error } = await supabase.from("failed_participation_searches").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) toast.error(error.message);
    else { toast.success("सर्व नोंदी हटवल्या"); load(); }
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserX className="h-4 w-4 text-amber-600" /> समाज नोंदणीमध्ये उपलब्ध नसलेली नावे
              <Badge variant="outline" className="ml-2">{rows.length}</Badge>
            </CardTitle>
            <CardDescription>
              सहभागी नोंदणी करताना समाज नोंदणीमध्ये न सापडलेली नावे — यांना नोंदणीत जोडा.
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={clearAll} disabled={rows.length === 0}>सर्व हटवा</Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">कोणतीही नोंद नाही 🎉</p>
        ) : (
          <div className="divide-y">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2.5 gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{r.entered_name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {r.competition_name ?? "—"} · {new Date(r.created_at).toLocaleString("mr-IN")}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(r.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FailedSearchManagement;
