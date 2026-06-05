import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Loader2, Trophy } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Competition { id: string; name: string; }
interface Entry { id: string; competition_id: string; entry_code: string; category: string; participant_name: string; }
interface Vote { competition_id: string; first_entry_id: string | null; second_entry_id: string | null; third_entry_id: string | null; }

const CAT_LABEL: Record<string, string> = { chota: "छोटा गट", motha: "मोठा गट", khula: "खुला गट" };

const VoteResults = () => {
  const [comps, setComps] = useState<Competition[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [compId, setCompId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [c, e, v] = await Promise.all([
        supabase.from("competitions").select("id, name").order("name"),
        supabase.from("competition_entries").select("id, competition_id, entry_code, category, participant_name"),
        supabase.from("public_votes").select("competition_id, first_entry_id, second_entry_id, third_entry_id"),
      ]);
      setComps((c.data as any) || []);
      setEntries((e.data as any) || []);
      setVotes((v.data as any) || []);
      if (c.data && c.data.length && !compId) setCompId(c.data[0].id);
      setLoading(false);
    })();
  }, []);

  const rows = useMemo(() => {
    if (!compId) return [];
    const compEntries = entries.filter((x) => x.competition_id === compId);
    const compVotes = votes.filter((x) => x.competition_id === compId);
    return compEntries
      .map((entry) => {
        let first = 0, second = 0, third = 0;
        compVotes.forEach((v) => {
          if (v.first_entry_id === entry.id) first++;
          if (v.second_entry_id === entry.id) second++;
          if (v.third_entry_id === entry.id) third++;
        });
        const total = first + second + third;
        const weighted = first * 3 + second * 2 + third * 1;
        return { ...entry, first, second, third, total, weighted };
      })
      .sort((a, b) => b.weighted - a.weighted || b.total - a.total);
  }, [compId, entries, votes]);

  const chartData = rows.slice(0, 20).map((r) => ({
    name: r.entry_code,
    total: r.total,
    weighted: r.weighted,
  }));

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> मतदान निकाल
            </CardTitle>
            <Select value={compId} onValueChange={setCompId}>
              <SelectTrigger className="h-9 w-64"><SelectValue placeholder="स्पर्धा निवडा" /></SelectTrigger>
              <SelectContent>
                {comps.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin inline" /></div>
          ) : rows.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">मतदान नोंदी नाहीत</div>
          ) : (
            <>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="weighted" fill="hsl(var(--primary))" name="गुण" />
                    <Bar dataKey="total" fill="hsl(var(--accent))" name="एकूण मते" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs">
                    <tr>
                      <th className="text-left p-2">क्रम</th>
                      <th className="text-left p-2">ID</th>
                      <th className="text-left p-2">गट</th>
                      <th className="text-left p-2">सहभागी</th>
                      <th className="text-right p-2">१ ले</th>
                      <th className="text-right p-2">२ रे</th>
                      <th className="text-right p-2">३ रे</th>
                      <th className="text-right p-2">एकूण</th>
                      <th className="text-right p-2">गुण</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rows.map((r, i) => (
                      <tr key={r.id} className={i < 3 ? "bg-amber-500/5" : ""}>
                        <td className="p-2">
                          {i < 3 ? <Trophy className={`h-4 w-4 inline ${i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : "text-amber-700"}`} /> : null} {i + 1}
                        </td>
                        <td className="p-2 font-mono font-semibold">{r.entry_code}</td>
                        <td className="p-2"><Badge variant="outline" className="text-[10px]">{CAT_LABEL[r.category] || r.category}</Badge></td>
                        <td className="p-2 truncate max-w-[200px]">{r.participant_name}</td>
                        <td className="p-2 text-right">{r.first}</td>
                        <td className="p-2 text-right">{r.second}</td>
                        <td className="p-2 text-right">{r.third}</td>
                        <td className="p-2 text-right font-semibold">{r.total}</td>
                        <td className="p-2 text-right font-bold text-primary">{r.weighted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">गुण = (१ले×३) + (२रे×२) + (३रे×१)</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VoteResults;
