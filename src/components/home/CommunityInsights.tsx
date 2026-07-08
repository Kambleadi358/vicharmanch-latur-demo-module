// Public Community Insights — aggregated, non-personal graphs & KPIs.
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Users, Home as HomeIcon, TrendingUp, TrendingDown, Sparkles, Trophy, GraduationCap, Calendar } from "lucide-react";

const EDU_LABEL: Record<string, string> = {
  balwadi: "बालवाडी", class_1: "इ. १ ली", class_2: "इ. २ री", class_3: "इ. ३ री",
  class_4: "इ. ४ थी", class_5: "इ. ५ वी", class_6: "इ. ६ वी", class_7: "इ. ७ वी",
  class_8: "इ. ८ वी", class_9: "इ. ९ वी", class_10: "इ. १० वी", class_11: "इ. ११ वी",
  class_12: "इ. १२ वी", diploma: "डिप्लोमा", degree: "पदवी", other: "इतर",
  school_not_eligible: "शाळेपूर्व",
};
const COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#0ea5e9", "#ec4899", "#14b8a6"];

const monthKey = (d: string | Date) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
};

const CommunityInsights = () => {
  const [loading, setLoading] = useState(true);
  const [d, setD] = useState<any>({
    households: [], members: [], payments: [], programs: [], competitions: [], participants: [],
  });

  useEffect(() => {
    (async () => {
      const q = (t: string, sel: string) => supabase.from(t as any).select(sel).then((r) => (r.data as any[]) || []);
      const [households, members, payments, programs, competitions, participants] = await Promise.all([
        q("households", "id, created_at"),
        q("household_members", "id, gender, education_level, created_at"),
        q("donation_payments", "id, amount, paid_at, created_at"),
        q("programs", "id, name, date"),
        q("competitions", "id, name"),
        q("participants", "id, competition_id, category, household_member_id"),
      ]);
      setD({ households, members, payments, programs, competitions, participants });
      setLoading(false);
    })();
  }, []);

  const kpis = useMemo(() => {
    const now = new Date();
    const yr = now.getFullYear();
    const lastYr = yr - 1;

    const memThisYr = d.members.filter((m: any) => new Date(m.created_at).getFullYear() === yr).length;
    const memPrevYr = d.members.filter((m: any) => new Date(m.created_at).getFullYear() === lastYr).length;
    const commGrowth = memPrevYr === 0 ? (memThisYr > 0 ? 100 : 0) : Math.round(((memThisYr - memPrevYr) / memPrevYr) * 100);

    const sumYr = (arr: any[], field: string, year: number) =>
      arr.filter((x) => new Date(x[field] || x.created_at).getFullYear() === year)
         .reduce((s, x) => s + Number(x.amount || 0), 0);
    const donThisYr = sumYr(d.payments, "paid_at", yr);
    const donPrevYr = sumYr(d.payments, "paid_at", lastYr);
    const donGrowth = donPrevYr === 0 ? (donThisYr > 0 ? 100 : 0) : Math.round(((donThisYr - donPrevYr) / donPrevYr) * 100);

    const women = d.members.filter((m: any) => m.gender === "female" || m.gender === "स्त्री").length;
    const womenPart = d.participants.filter((p: any) => {
      const mm = d.members.find((m: any) => m.id === p.household_member_id);
      return mm && (mm.gender === "female" || mm.gender === "स्त्री");
    }).length;
    const womenPct = d.participants.length === 0 ? 0 : Math.round((womenPart / d.participants.length) * 100);

    const compCounts = new Map<string, number>();
    d.participants.forEach((p: any) => compCounts.set(p.competition_id, (compCounts.get(p.competition_id) || 0) + 1));
    let topCompId = ""; let topCount = 0;
    compCounts.forEach((v, k) => { if (v > topCount) { topCount = v; topCompId = k; } });
    const topComp = d.competitions.find((c: any) => c.id === topCompId)?.name || "—";

    const catCount: Record<string, number> = { chota: 0, motha: 0, khula: 0 };
    d.participants.forEach((p: any) => { if (catCount[p.category] !== undefined) catCount[p.category]++; });
    const catTop = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0];
    const catLabel: Record<string, string> = { chota: "छोटा गट", motha: "मोठा गट", khula: "खुला गट" };

    return {
      commGrowth, donGrowth, womenPct,
      topComp, topCompCount: topCount,
      topGroup: catLabel[catTop || "chota"] || "—",
      households: d.households.length,
      members: d.members.length,
      programs: d.programs.length,
    };
  }, [d]);

  const donationTrend = useMemo(() => {
    const map = new Map<string, number>();
    d.payments.forEach((p: any) => {
      const k = monthKey(p.paid_at || p.created_at);
      map.set(k, (map.get(k) || 0) + Number(p.amount || 0));
    });
    return Array.from(map.entries()).sort().slice(-12).map(([k, v]) => ({ month: k.slice(2), amount: v }));
  }, [d.payments]);

  const participationTrend = useMemo(() => {
    const map = new Map<string, number>();
    d.participants.forEach((p: any) => {
      const mem = d.members.find((m: any) => m.id === p.household_member_id);
      if (!mem) return;
      const y = String(new Date(mem.created_at).getFullYear());
      map.set(y, (map.get(y) || 0) + 1);
    });
    return Array.from(map.entries()).sort().map(([k, v]) => ({ year: k, count: v }));
  }, [d.participants, d.members]);

  const eduDist = useMemo(() => {
    const map = new Map<string, number>();
    d.members.forEach((m: any) => {
      const k = EDU_LABEL[m.education_level] || m.education_level || "इतर";
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value).slice(0, 8);
  }, [d.members]);

  const compPopularity = useMemo(() => {
    const map = new Map<string, number>();
    d.participants.forEach((p: any) => {
      const c = d.competitions.find((x: any) => x.id === p.competition_id);
      const n = c?.name || "—";
      map.set(n, (map.get(n) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count).slice(0, 6);
  }, [d.participants, d.competitions]);

  if (loading) {
    return <div className="text-center py-16 text-muted-foreground">आकडेवारी लोड होत आहे...</div>;
  }

  const trendBadge = (n: number) => n >= 0
    ? <span className="inline-flex items-center gap-1 text-emerald-600 font-bold"><TrendingUp className="h-4 w-4" /> +{n}%</span>
    : <span className="inline-flex items-center gap-1 text-rose-600 font-bold"><TrendingDown className="h-4 w-4" /> {n}%</span>;

  const stats = [
    { label: "समाज वाढ",           value: trendBadge(kpis.commGrowth),      Icon: Users,        tone: "from-sky-500/10 to-transparent" },
    { label: "देणगी वाढ",           value: trendBadge(kpis.donGrowth),       Icon: TrendingUp,   tone: "from-emerald-500/10 to-transparent" },
    { label: "महिला सहभाग",         value: <span className="font-bold text-primary">{kpis.womenPct}%</span>, Icon: Sparkles, tone: "from-pink-500/10 to-transparent" },
    { label: "लोकप्रिय स्पर्धा",     value: <span className="font-bold text-sm truncate block max-w-[140px]" title={kpis.topComp}>🏆 {kpis.topComp}</span>, Icon: Trophy, tone: "from-amber-500/10 to-transparent" },
    { label: "सर्वाधिक सहभाग गट",  value: <span className="font-bold">{kpis.topGroup}</span>, Icon: GraduationCap, tone: "from-violet-500/10 to-transparent" },
    { label: "समाज सदस्य",          value: <span className="font-bold text-lg">{kpis.members}</span>, Icon: Users, tone: "from-blue-500/10 to-transparent" },
    { label: "नोंदणीकृत घरे",       value: <span className="font-bold text-lg">{kpis.households}</span>, Icon: HomeIcon, tone: "from-orange-500/10 to-transparent" },
    { label: "कार्यक्रम केले",     value: <span className="font-bold text-lg">{kpis.programs}</span>, Icon: Calendar, tone: "from-indigo-500/10 to-transparent" },
  ];

  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
          <span className="text-accent text-sm font-medium uppercase tracking-wider">पारदर्शकता</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">समाज दृष्टिक्षेप</h2>
          <p className="text-muted-foreground mt-2">वास्तविक डेटावर आधारित सामूहिक वाढीचा आढावा</p>
          <div className="decorative-line mt-4" />
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {stats.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className={`rounded-xl border bg-gradient-to-br ${s.tone} p-3 sm:p-4`}
            >
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1.5">
                <s.Icon className="h-3.5 w-3.5" /> {s.label}
              </div>
              <div className="text-base sm:text-lg">{s.value}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-semibold mb-3">देणगी प्रवाह (मासिक)</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={donationTrend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-semibold mb-3">सहभाग प्रवाह (वार्षिक)</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={participationTrend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="year" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-semibold mb-3">शैक्षणिक वितरण</p>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={eduDist} dataKey="value" nameKey="name" outerRadius={80} label={{ fontSize: 10 }}>
                    {eduDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-semibold mb-3">स्पर्धा लोकप्रियता</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={compPopularity} layout="vertical" margin={{ left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" fontSize={11} />
                  <YAxis type="category" dataKey="name" fontSize={10} width={90} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <p className="text-[11px] text-muted-foreground text-center mt-6">
          केवळ सामूहिक आकडेवारी. वैयक्तिक माहिती जाहीर केली जात नाही.
        </p>
      </div>
    </section>
  );
};

export default CommunityInsights;
