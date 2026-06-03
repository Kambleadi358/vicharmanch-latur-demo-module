import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Award, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

const CAT_LABEL: Record<string, string> = { chota: "छोटा गट", motha: "मोठा गट", khula: "खुला गट" };
const CAT_COLORS: Record<string, string> = { chota: "#3b82f6", motha: "#f59e0b", khula: "#10b981" };

const ParticipationAnalytics = () => {
  const [participants, setParticipants] = useState<any[]>([]);
  const [comps, setComps] = useState<any[]>([]);
  const [progs, setProgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [p, c, pg] = await Promise.all([
        supabase.from("participants").select("*"),
        supabase.from("competitions").select("id, name"),
        supabase.from("programs").select("id, name"),
      ]);
      setParticipants(p.data ?? []);
      setComps(c.data ?? []);
      setProgs(pg.data ?? []);
      setLoading(false);
    })();
  }, []);

  const nameMap = useMemo(() => {
    const m = new Map<string, string>();
    progs.forEach((p) => m.set(p.id, p.name));
    comps.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [comps, progs]);

  const total = participants.length;
  const byCategory = useMemo(() => {
    const m: Record<string, number> = { chota: 0, motha: 0, khula: 0 };
    participants.forEach((p) => { if (m[p.category] !== undefined) m[p.category]++; });
    return Object.entries(m).map(([k, v]) => ({ name: CAT_LABEL[k], value: v, fill: CAT_COLORS[k] }));
  }, [participants]);

  const byProgram = useMemo(() => {
    const m = new Map<string, number>();
    participants.forEach((p) => {
      const n = nameMap.get(p.competition_id) ?? "—";
      m.set(n, (m.get(n) ?? 0) + 1);
    });
    return Array.from(m, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [participants, nameMap]);

  const byYear = useMemo(() => {
    const m = new Map<string, number>();
    participants.forEach((p) => {
      const y = new Date(p.created_at).getFullYear().toString();
      m.set(y, (m.get(y) ?? 0) + 1);
    });
    return Array.from(m, ([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name));
  }, [participants]);

  const topProgram = byProgram[0];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: "एकूण सहभागी", v: total, c: "from-blue-500 to-indigo-600", I: Users },
          { l: "वर्षभरातील", v: byYear[byYear.length - 1]?.value ?? 0, c: "from-emerald-500 to-teal-600", I: TrendingUp },
          { l: "स्पर्धा", v: byProgram.length, c: "from-amber-500 to-orange-600", I: BarChart3 },
          { l: "लोकप्रिय", v: topProgram?.name ?? "—", c: "from-rose-500 to-pink-600", I: Award },
        ].map((s) => (
          <Card key={s.l} className="border-0 shadow-md overflow-hidden relative">
            <div className={`absolute inset-0 bg-gradient-to-br ${s.c} opacity-95`} />
            <CardContent className="relative p-3 text-white">
              <s.I className="h-4 w-4 opacity-80 mb-1" />
              <p className="text-[11px] opacity-90">{s.l}</p>
              <p className="text-lg font-bold tracking-tight truncate">{s.v}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" /> गट वितरण</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">लोड...</div> : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} label>
                    {byCategory.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> वर्ष-निहाय वाढ</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">लोड...</div> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byYear}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4" /> लोकप्रिय स्पर्धा (शीर्ष ८)
            <Badge variant="outline">{byProgram.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">लोड...</div> : (
            <ResponsiveContainer width="100%" height={Math.max(220, byProgram.length * 36)}>
              <BarChart data={byProgram} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" fontSize={11} />
                <YAxis type="category" dataKey="name" fontSize={11} width={150} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(217, 80%, 50%)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ParticipationAnalytics;
