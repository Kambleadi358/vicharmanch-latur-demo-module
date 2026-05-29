import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import {
  IndianRupee, TrendingUp, TrendingDown, Wallet, Trophy, Users,
  CalendarDays, Plus, Bell, Award, BookOpen, FileText, Gift,
  ChevronLeft, ChevronRight, Sparkles, Activity, Clock,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, BarChart, Bar, Legend,
} from "recharts";
import ashokStambh from "@/assets/ashok-stambh.png";

type SectionKey =
  | "programs" | "competition" | "participants" | "quiz"
  | "certificates" | "notices" | "donations" | "prizes"
  | "letterpad" | "settings" | "dashboard";

interface Props {
  onNavigate: (k: SectionKey) => void;
}

const fmtINR = (n: number) =>
  "₹" + new Intl.NumberFormat("en-IN").format(Math.round(n || 0));

// ---------- Constitutional / Buddhist event calendar ----------
type EventDef = { day: number; month: number; title: string; type: "buddhist" | "constitution" | "reformer"; desc: string };

const EVENTS: EventDef[] = [
  { day: 14, month: 4, title: "डॉ. बाबासाहेब आंबेडकर जयंती", type: "reformer", desc: "भारतरत्न डॉ. बाबासाहेब आंबेडकर यांची जयंती" },
  { day: 6,  month: 12, title: "महापरिनिर्वाण दिन", type: "reformer", desc: "डॉ. बाबासाहेब आंबेडकर महापरिनिर्वाण दिन" },
  { day: 26, month: 1,  title: "प्रजासत्ताक दिन", type: "constitution", desc: "भारतीय संविधान अंमलात आले" },
  { day: 26, month: 11, title: "संविधान दिन", type: "constitution", desc: "संविधान स्वीकार दिवस" },
  { day: 14, month: 10, title: "धम्मचक्र प्रवर्तन दिन", type: "buddhist", desc: "१९५६ - डॉ. आंबेडकरांनी बौद्ध धम्म स्वीकारला" },
  { day: 23, month: 5,  title: "बुद्ध पौर्णिमा", type: "buddhist", desc: "तथागत गौतम बुद्ध जयंती (अंदाजित)" },
  { day: 3,  month: 1,  title: "सावित्रीबाई फुले जयंती", type: "reformer", desc: "क्रांतिज्योती सावित्रीबाई फुले" },
  { day: 11, month: 4,  title: "महात्मा फुले जयंती", type: "reformer", desc: "महात्मा ज्योतिबा फुले" },
  { day: 26, month: 6,  title: "राजर्षी शाहू महाराज जयंती", type: "reformer", desc: "राजर्षी छत्रपती शाहू महाराज" },
  { day: 15, month: 8,  title: "स्वातंत्र्य दिन", type: "constitution", desc: "भारतीय स्वातंत्र्य दिन" },
  { day: 24, month: 4,  title: "पंचायत राज दिन", type: "constitution", desc: "७३ वी घटनादुरुस्ती" },
  { day: 28, month: 11, title: "महात्मा फुले स्मृतिदिन", type: "reformer", desc: "महात्मा फुले पुण्यतिथी" },
];

const TYPE_STYLE: Record<EventDef["type"], { dot: string; chip: string; label: string }> = {
  buddhist:     { dot: "bg-amber-500",   chip: "bg-amber-500/15 text-amber-700 dark:text-amber-300", label: "बौद्ध" },
  constitution: { dot: "bg-blue-600",    chip: "bg-blue-500/15 text-blue-700 dark:text-blue-300",    label: "संविधान" },
  reformer:     { dot: "bg-rose-500",    chip: "bg-rose-500/15 text-rose-700 dark:text-rose-300",    label: "समाजसुधारक" },
};

const QUOTES = [
  "“शिका, संघटित व्हा, संघर्ष करा.” — डॉ. बाबासाहेब आंबेडकर",
  "“स्वातंत्र्य, समता, बंधुता आणि न्याय हीच लोकशाहीची आधारशिला.”",
  "“अत्त दीप भव — स्वतःचा दीप स्वतः व्हा.” — तथागत बुद्ध",
  "“विद्या हे वाघिणीचे दूध आहे.” — डॉ. बाबासाहेब आंबेडकर",
];

const DashboardHome = ({ onNavigate }: Props) => {
  const [stats, setStats] = useState({
    totalDonations: 0,
    pendingDonations: 0,
    totalExpenses: 0,
    remaining: 0,
    competitions: 0,
    participants: 0,
  });
  const [trend, setTrend] = useState<{ label: string; donation: number; expense: number }[]>([]);
  const [partByComp, setPartByComp] = useState<{ name: string; count: number }[]>([]);
  const [recent, setRecent] = useState<{ icon: any; title: string; meta: string; time: string }[]>([]);
  const [notifications, setNotifications] = useState<{ title: string; tone: "warn" | "info" | "ok" }[]>([]);
  const [now, setNow] = useState(new Date());
  const [cursor, setCursor] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<EventDef | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      // Donations
      const { data: donations } = await supabase
        .from("home_donations")
        .select("assigned_amount, paid_amount, payment_date, homes(name)")
        .order("created_at", { ascending: false });

      const totalAssigned = (donations || []).reduce((s: number, r: any) => s + Number(r.assigned_amount || 0), 0);
      const totalPaid = (donations || []).reduce((s: number, r: any) => s + Number(r.paid_amount || 0), 0);
      const pending = Math.max(0, totalAssigned - totalPaid);

      // Expenses
      const { data: expenses } = await supabase
        .from("account_expenses")
        .select("amount, item, created_at")
        .order("created_at", { ascending: false });
      const totalExp = (expenses || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);

      // Competitions / participants
      const [{ count: compCount }, { count: partCount }, { data: comps }, { data: parts }] = await Promise.all([
        supabase.from("competitions").select("id", { count: "exact", head: true }),
        supabase.from("participants").select("id", { count: "exact", head: true }),
        supabase.from("competitions").select("id, name"),
        supabase.from("participants").select("competition_id, name, created_at").order("created_at", { ascending: false }),
      ]);

      setStats({
        totalDonations: totalPaid,
        pendingDonations: pending,
        totalExpenses: totalExp,
        remaining: totalPaid - totalExp,
        competitions: compCount || 0,
        participants: partCount || 0,
      });

      // Trend - last 7 days
      const days: { label: string; donation: number; expense: number; key: string }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        days.push({
          key,
          label: d.toLocaleDateString("mr-IN", { day: "numeric", month: "short" }),
          donation: 0, expense: 0,
        });
      }
      (donations || []).forEach((r: any) => {
        if (!r.payment_date) return;
        const k = new Date(r.payment_date).toISOString().slice(0, 10);
        const row = days.find((x) => x.key === k);
        if (row) row.donation += Number(r.paid_amount || 0);
      });
      (expenses || []).forEach((r: any) => {
        const k = new Date(r.created_at).toISOString().slice(0, 10);
        const row = days.find((x) => x.key === k);
        if (row) row.expense += Number(r.amount || 0);
      });
      setTrend(days);

      // Participation by competition
      const compMap = new Map<string, string>();
      (comps || []).forEach((c: any) => compMap.set(c.id, c.name));
      const counts = new Map<string, number>();
      (parts || []).forEach((p: any) => {
        const n = compMap.get(p.competition_id) || "इतर";
        counts.set(n, (counts.get(n) || 0) + 1);
      });
      setPartByComp(
        Array.from(counts.entries())
          .map(([name, count]) => ({ name: name.length > 14 ? name.slice(0, 14) + "…" : name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6),
      );

      // Recent activity
      const recentRows: any[] = [];
      (donations || []).slice(0, 3).forEach((r: any) => {
        if (Number(r.paid_amount) > 0) {
          recentRows.push({
            icon: IndianRupee,
            title: `देणगी — ${r.homes?.name || "घर"}`,
            meta: fmtINR(Number(r.paid_amount)),
            time: r.payment_date ? new Date(r.payment_date).toLocaleDateString("mr-IN") : "",
          });
        }
      });
      (parts || []).slice(0, 3).forEach((p: any) => {
        recentRows.push({
          icon: Users,
          title: `नवीन सहभागी — ${p.name}`,
          meta: compMap.get(p.competition_id) || "",
          time: new Date(p.created_at).toLocaleDateString("mr-IN"),
        });
      });
      (expenses || []).slice(0, 2).forEach((r: any) => {
        recentRows.push({
          icon: TrendingDown,
          title: `खर्च — ${r.item}`,
          meta: fmtINR(Number(r.amount)),
          time: new Date(r.created_at).toLocaleDateString("mr-IN"),
        });
      });
      setRecent(recentRows.slice(0, 6));

      // Notifications
      const notes: { title: string; tone: "warn" | "info" | "ok" }[] = [];
      if (pending > 0) notes.push({ title: `${fmtINR(pending)} देणगी प्रलंबित`, tone: "warn" });
      const { data: upcoming } = await supabase
        .from("programs").select("name, date").eq("status", "upcoming").limit(3);
      (upcoming || []).forEach((p: any) =>
        notes.push({ title: `आगामी कार्यक्रम: ${p.name} (${p.date})`, tone: "info" }),
      );
      if (totalPaid - totalExp >= 0) notes.push({ title: `शिल्लक रक्कम ${fmtINR(totalPaid - totalExp)}`, tone: "ok" });
      setNotifications(notes.slice(0, 5));
    })();
  }, []);

  const quote = useMemo(() => QUOTES[new Date().getDate() % QUOTES.length], []);

  // calendar grid
  const monthDays = useMemo(() => {
    const y = cursor.getFullYear(), m = cursor.getMonth();
    const first = new Date(y, m, 1).getDay();
    const last = new Date(y, m + 1, 0).getDate();
    const cells: { day: number | null; events: EventDef[] }[] = [];
    for (let i = 0; i < first; i++) cells.push({ day: null, events: [] });
    for (let d = 1; d <= last; d++) {
      const evs = EVENTS.filter((e) => e.day === d && e.month === m + 1);
      cells.push({ day: d, events: evs });
    }
    return cells;
  }, [cursor]);

  const statCards = [
    { label: "एकूण देणगी", value: fmtINR(stats.totalDonations), icon: IndianRupee, grad: "from-emerald-500 to-emerald-700" },
    { label: "प्रलंबित देणगी", value: fmtINR(stats.pendingDonations), icon: Clock, grad: "from-amber-500 to-orange-600" },
    { label: "एकूण खर्च", value: fmtINR(stats.totalExpenses), icon: TrendingDown, grad: "from-rose-500 to-red-600" },
    { label: "शिल्लक", value: fmtINR(stats.remaining), icon: Wallet, grad: "from-blue-600 to-indigo-700" },
    { label: "स्पर्धा", value: String(stats.competitions), icon: Trophy, grad: "from-violet-500 to-purple-700" },
    { label: "सहभागी", value: String(stats.participants), icon: Users, grad: "from-cyan-500 to-sky-700" },
  ];

  const quickActions: { label: string; icon: any; section: SectionKey; tint: string }[] = [
    { label: "देणगी जोडा",  icon: IndianRupee, section: "donations",    tint: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
    { label: "खर्च जोडा",   icon: TrendingDown,section: "donations",    tint: "bg-rose-500/10 text-rose-700 dark:text-rose-300" },
    { label: "स्पर्धा",     icon: Trophy,      section: "competition",  tint: "bg-violet-500/10 text-violet-700 dark:text-violet-300" },
    { label: "अहवाल",       icon: FileText,    section: "letterpad",    tint: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
    { label: "निकाल",       icon: Award,       section: "competition",  tint: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
    { label: "प्रश्नमंजुषा", icon: BookOpen,    section: "quiz",         tint: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300" },
    { label: "सूचना",       icon: Bell,        section: "notices",      tint: "bg-orange-500/10 text-orange-700 dark:text-orange-300" },
    { label: "बक्षीस",      icon: Gift,        section: "prizes",       tint: "bg-pink-500/10 text-pink-700 dark:text-pink-300" },
  ];

  return (
    <div className="relative space-y-6">
      {/* Faded Buddha watermark */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.04] dark:opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 85% 20%, hsl(var(--primary)) 0%, transparent 40%), radial-gradient(circle at 15% 80%, hsl(var(--accent)) 0%, transparent 35%)",
        }}
      />
      <div className="relative z-10 space-y-6">

      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary via-[hsl(217,80%,30%)] to-[hsl(220,15%,15%)] text-primary-foreground p-5 sm:p-7 shadow-xl"
      >
        <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute right-4 top-4 opacity-10">
          <svg viewBox="0 0 24 24" className="w-32 h-32 sm:w-40 sm:h-40" fill="currentColor">
            <circle cx="12" cy="8" r="4" />
            <path d="M6 22c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          </svg>
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 text-xs sm:text-sm opacity-90">
            <Sparkles className="h-4 w-4" />
            <span>{now.toLocaleDateString("mr-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
            <span className="opacity-60">•</span>
            <span>{now.toLocaleTimeString("mr-IN", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold leading-tight">
            नमस्कार, प्रशासक 🙏
          </h1>
          <p className="mt-1 text-sm sm:text-base opacity-90 max-w-2xl">{quote}</p>
          <p className="mt-3 text-[11px] sm:text-xs opacity-70 italic">विचारकेंद्रित, पारदर्शक, सर्वांसाठी</p>
        </div>
      </motion.div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-shadow">
                <div className={`absolute inset-0 bg-gradient-to-br ${s.grad} opacity-95`} />
                <CardContent className="relative p-4 text-white">
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 opacity-80" />
                    <Activity className="h-3 w-3 opacity-50" />
                  </div>
                  <p className="mt-3 text-xs opacity-90">{s.label}</p>
                  <p className="text-xl sm:text-2xl font-bold tracking-tight truncate">{s.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Quick actions */}
      <Card className="border-0 shadow-md backdrop-blur bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" /> त्वरित क्रिया
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2 sm:gap-3">
            {quickActions.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.label}
                  onClick={() => onNavigate(a.section)}
                  className={`group flex flex-col items-center justify-center gap-2 rounded-xl p-3 ${a.tint} hover:scale-[1.03] transition-transform active:scale-95 min-h-[80px]`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[11px] sm:text-xs font-medium text-center leading-tight">{a.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> देणगी vs खर्च (मागील ७ दिवस)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 sm:h-72 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => fmtINR(Number(v))}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" name="देणगी" dataKey="donation" stroke="hsl(var(--primary))" fill="url(#gD)" strokeWidth={2} />
                <Area type="monotone" name="खर्च"  dataKey="expense"  stroke="hsl(var(--accent))"  fill="url(#gE)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> सहभाग — स्पर्धानिहाय
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 sm:h-72 -ml-2">
            {partByComp.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                अद्याप नोंदणी झालेली नाही
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={partByComp} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Calendar + activity + notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar */}
        <Card className="lg:col-span-2 border-0 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" /> संविधान व बौद्ध दिनदर्शिका
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-semibold min-w-[120px] text-center">
                  {cursor.toLocaleDateString("mr-IN", { month: "long", year: "numeric" })}
                </span>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] sm:text-xs text-muted-foreground mb-1 font-semibold">
              {["र", "सो", "मं", "बु", "गु", "शु", "श"].map((d) => <div key={d} className="py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((c, i) => {
                const isToday =
                  c.day === now.getDate() &&
                  cursor.getMonth() === now.getMonth() &&
                  cursor.getFullYear() === now.getFullYear();
                return (
                  <button
                    key={i}
                    disabled={!c.day || c.events.length === 0}
                    onClick={() => c.events[0] && setSelectedEvent(c.events[0])}
                    className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs sm:text-sm relative transition-colors
                      ${!c.day ? "" : "bg-muted/40 hover:bg-muted"}
                      ${isToday ? "ring-2 ring-primary font-bold" : ""}
                      ${c.events.length ? "cursor-pointer font-semibold" : ""}
                    `}
                  >
                    {c.day && <span>{c.day}</span>}
                    {c.events.length > 0 && (
                      <div className="absolute bottom-1 flex gap-0.5">
                        {c.events.slice(0, 3).map((e, idx) => (
                          <span key={idx} className={`h-1.5 w-1.5 rounded-full ${TYPE_STYLE[e.type].dot}`} />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
              {(["buddhist", "constitution", "reformer"] as const).map((t) => (
                <span key={t} className={`px-2 py-1 rounded-full inline-flex items-center gap-1.5 ${TYPE_STYLE[t].chip}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${TYPE_STYLE[t].dot}`} /> {TYPE_STYLE[t].label}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" /> सूचना
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">कोणत्याही नवीन सूचना नाहीत</p>
            ) : notifications.map((n, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg text-sm border-l-4 ${
                  n.tone === "warn" ? "bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-200"
                  : n.tone === "ok"  ? "bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-emerald-200"
                  :                    "bg-blue-500/10 border-blue-500 text-blue-900 dark:text-blue-200"
                }`}
              >
                {n.title}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> अलीकडील हालचाली
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">कोणत्याही हालचाली नाहीत</p>
          ) : (
            <ul className="divide-y">
              {recent.map((r, i) => {
                const Icon = r.icon;
                return (
                  <li key={i} className="flex items-center gap-3 py-2.5">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.meta}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{r.time}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Event detail dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(o) => !o && setSelectedEvent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent && <span className={`h-2 w-2 rounded-full ${TYPE_STYLE[selectedEvent.type].dot}`} />}
              {selectedEvent?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-2 text-sm">
              <span className={`inline-block px-2 py-1 rounded-full text-[11px] ${TYPE_STYLE[selectedEvent.type].chip}`}>
                {TYPE_STYLE[selectedEvent.type].label}
              </span>
              <p className="text-muted-foreground">{selectedEvent.desc}</p>
              <p className="text-xs">दिनांक: {selectedEvent.day} / {selectedEvent.month}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      </div>
    </div>
  );
};

export default DashboardHome;
