import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Users, Sparkles, IndianRupee, GraduationCap } from "lucide-react";

const fmtINR = (n: number) =>
  "₹" + new Intl.NumberFormat("en-IN").format(Math.round(n || 0));

const EDU_SHORT: Record<string, string> = {
  school_not_eligible: "अयोग्य", balwadi: "बालवाडी",
  class_1: "१ली", class_2: "२री", class_3: "३री", class_4: "४थी",
  class_5: "५वी", class_6: "६वी", class_7: "७वी", class_8: "८वी",
  class_9: "९वी", class_10: "१०वी", class_11: "११वी", class_12: "१२वी",
  diploma: "डिप्लोमा", degree: "पदवी", other: "इतर",
};

const nextBhimJayanti = () => {
  const now = new Date();
  const y = now.getFullYear();
  const target = new Date(y, 3, 14, 0, 0, 0); // April 14
  return target.getTime() < now.getTime() ? new Date(y + 1, 3, 14) : target;
};

const progressColor = (pct: number) => {
  if (pct <= 30) return "from-red-500 to-rose-600";
  if (pct <= 50) return "from-orange-500 to-amber-500";
  if (pct <= 80) return "from-yellow-400 to-amber-500";
  if (pct <= 90) return "from-blue-500 to-indigo-600";
  return "from-emerald-500 to-emerald-600";
};

const CommunityIntelligencePanel = () => {
  const [remain, setRemain] = useState({ d: 0, h: 0, m: 0, s: 0, done: false });
  const [donation, setDonation] = useState({ assigned: 0, paid: 0 });
  const [community, setCommunity] = useState({
    households: 0, members: 0, male: 0, female: 0, eduCounts: [] as { label: string; count: number }[],
  });
  const target = useMemo(() => nextBhimJayanti(), []);

  // Live countdown
  useEffect(() => {
    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setRemain({ d: 0, h: 0, m: 0, s: 0, done: true });
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemain({ d, h, m, s, done: false });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  // Load donation + community data
  useEffect(() => {
    (async () => {
      const year = String(new Date().getFullYear());

      const [{ data: assigns }, { data: pays }, { data: members }, { count: hhCount }] = await Promise.all([
        supabase.from("household_year_assignments").select("assigned_amount").eq("year", year),
        supabase.from("donation_payments").select("amount").eq("year", year),
        supabase.from("household_members").select("gender, education_level"),
        supabase.from("households").select("id", { count: "exact", head: true }),
      ]);

      // Fallback: also include legacy home_donations if new ledger empty
      let assigned = (assigns || []).reduce((s, r: any) => s + Number(r.assigned_amount || 0), 0);
      let paid = (pays || []).reduce((s, r: any) => s + Number(r.amount || 0), 0);
      if (assigned === 0 && paid === 0) {
        const { data: legacy } = await supabase
          .from("home_donations")
          .select("assigned_amount, paid_amount");
        assigned = (legacy || []).reduce((s, r: any) => s + Number(r.assigned_amount || 0), 0);
        paid = (legacy || []).reduce((s, r: any) => s + Number(r.paid_amount || 0), 0);
      }
      setDonation({ assigned, paid });

      const male = (members || []).filter((m: any) => m.gender === "male").length;
      const female = (members || []).filter((m: any) => m.gender === "female").length;
      const eduMap = new Map<string, number>();
      (members || []).forEach((m: any) => {
        const k = m.education_level || "other";
        eduMap.set(k, (eduMap.get(k) || 0) + 1);
      });
      const eduCounts = Array.from(eduMap.entries())
        .map(([k, count]) => ({ label: EDU_SHORT[k] || k, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      setCommunity({
        households: hhCount || 0,
        members: members?.length || 0,
        male, female, eduCounts,
      });
    })();
  }, []);

  const pct = donation.assigned > 0
    ? Math.min(100, Math.round((donation.paid / donation.assigned) * 100))
    : 0;
  const gradient = progressColor(pct);

  return (
    <Card className="lg:col-span-2 border-0 shadow-md overflow-hidden bg-gradient-to-br from-card/95 to-muted/40 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          सामुदायिक माहिती पॅनेल
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* SECTION 1 — Bhim Jayanti countdown */}
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4 bg-gradient-to-br from-primary via-[hsl(217,80%,30%)] to-[hsl(220,15%,15%)] text-primary-foreground shadow-lg relative overflow-hidden"
        >
          <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-accent/20 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider opacity-90">
              <Heart className="h-3.5 w-3.5" /> भीम जयंती — {target.getDate()} एप्रिल {target.getFullYear()}
            </div>
            {remain.done ? (
              <p className="mt-2 text-xl sm:text-2xl font-bold">जय भीम 💙 भीम जयंतीच्या हार्दिक शुभेच्छा</p>
            ) : (
              <div className="mt-2 grid grid-cols-4 gap-2 text-center">
                {[
                  { v: remain.d, l: "दिवस" },
                  { v: remain.h, l: "तास" },
                  { v: remain.m, l: "मिनिटे" },
                  { v: remain.s, l: "सेकंद" },
                ].map((x) => (
                  <div key={x.l} className="rounded-lg bg-white/10 backdrop-blur p-2">
                    <div className="text-xl sm:text-2xl font-bold tabular-nums">{String(x.v).padStart(2, "0")}</div>
                    <div className="text-[10px] opacity-80">{x.l}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* SECTION 2 — Donation progress */}
        <div className="rounded-xl border bg-card/60 backdrop-blur p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <IndianRupee className="h-4 w-4 text-primary" /> देणगी संकलन
            </div>
            <div className="text-xs text-muted-foreground">
              <span className="font-bold text-foreground">{fmtINR(donation.paid)}</span> / {fmtINR(donation.assigned)}
            </div>
          </div>
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
            />
          </div>
          <div className="mt-1.5 text-[11px] text-muted-foreground flex justify-between">
            <span>{pct}% पूर्ण</span>
            <span>शिल्लक: {fmtINR(Math.max(0, donation.assigned - donation.paid))}</span>
          </div>
        </div>

        {/* SECTION 3 — Community statistics */}
        <div className="rounded-xl border bg-card/60 backdrop-blur p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
            <Users className="h-4 w-4 text-primary" /> समाज नोंदणी
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="rounded-lg p-2.5 bg-blue-500/10 text-center">
              <div className="text-lg sm:text-xl font-bold text-blue-700 dark:text-blue-300">{community.male}</div>
              <div className="text-[10px] text-muted-foreground">👨 पुरुष</div>
            </div>
            <div className="rounded-lg p-2.5 bg-pink-500/10 text-center">
              <div className="text-lg sm:text-xl font-bold text-pink-700 dark:text-pink-300">{community.female}</div>
              <div className="text-[10px] text-muted-foreground">👩 महिला</div>
            </div>
            <div className="rounded-lg p-2.5 bg-emerald-500/10 text-center">
              <div className="text-lg sm:text-xl font-bold text-emerald-700 dark:text-emerald-300">{community.members}</div>
              <div className="text-[10px] text-muted-foreground">👥 एकूण</div>
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground mb-1">घरे: <b className="text-foreground">{community.households}</b></div>

          {community.eduCounts.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1.5">
                <GraduationCap className="h-3.5 w-3.5" /> शिक्षण वितरण
              </div>
              <div className="flex flex-wrap gap-1.5">
                {community.eduCounts.map((e) => (
                  <span key={e.label} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
                    {e.label} · {e.count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CommunityIntelligencePanel;
