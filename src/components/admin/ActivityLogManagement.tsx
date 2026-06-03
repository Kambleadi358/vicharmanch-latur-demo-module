import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Search, ShieldCheck } from "lucide-react";

interface Log {
  id: string;
  actor_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

const ActivityLogManagement = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState<string>("all");

  useEffect(() => {
    setLoading(true);
    supabase
      .from("admin_activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500)
      .then(({ data }) => {
        setLogs((data as any) ?? []);
        setLoading(false);
      });
  }, []);

  const entityTypes = useMemo(() => {
    const s = new Set<string>();
    logs.forEach((l) => { if (l.entity_type) s.add(l.entity_type); });
    return Array.from(s).sort();
  }, [logs]);

  const filtered = useMemo(
    () => logs.filter((l) => {
      if (entityFilter !== "all" && l.entity_type !== entityFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return l.action.toLowerCase().includes(q)
        || (l.actor_email || "").toLowerCase().includes(q)
        || (l.entity_type || "").toLowerCase().includes(q);
    }),
    [logs, search, entityFilter],
  );

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-primary" /> क्रियाकलाप नोंदी
          <Badge variant="outline">{filtered.length}</Badge>
        </CardTitle>
        <div className="flex gap-2 mt-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9 h-9" placeholder="शोध..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">सर्व प्रकार</SelectItem>
              {entityTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="mt-2 rounded-md border border-amber-300/50 bg-amber-50/60 dark:bg-amber-500/10 text-amber-900 dark:text-amber-200 px-3 py-2 text-[11px] flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5" /> Microsoft Authenticator / TOTP द्वि-घटक प्रमाणीकरण भविष्यातील आवृत्तीत जोडले जाईल.
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">लोड होत आहे...</div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">कोणत्याही नोंदी नाहीत</div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left p-2">दिनांक</th>
                  <th className="text-left p-2">कर्ता</th>
                  <th className="text-left p-2">कृती</th>
                  <th className="text-left p-2">घटक</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-muted/30">
                    <td className="p-2 whitespace-nowrap">{new Date(l.created_at).toLocaleString("mr-IN")}</td>
                    <td className="p-2 truncate max-w-[160px]">{l.actor_email || "—"}</td>
                    <td className="p-2 font-mono">{l.action}</td>
                    <td className="p-2 text-muted-foreground">{l.entity_type || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityLogManagement;
