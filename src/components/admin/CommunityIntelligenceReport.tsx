import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  BrainCircuit, Download, RefreshCw, TrendingUp, TrendingDown,
  Users, IndianRupee, Trophy, Vote, MessageSquare, ShieldCheck,
  Activity, GraduationCap, Sparkles, AlertTriangle, Lightbulb,
} from "lucide-react";
import logo from "@/assets/vicharmanch-logo.jpeg";

// ═══════════════════════════════════════════════════════════════════
// Types & Helpers
// ═══════════════════════════════════════════════════════════════════

const fmtINR = (n: number) =>
  "₹" + new Intl.NumberFormat("en-IN").format(Math.round(n || 0));
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);
const escapeHtml = (s: any) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const growth = (curr: number, prev: number) =>
  prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);

interface YearSnapshot {
  households: number;
  members: number;
  male: number;
  female: number;
  eduDistribution: Record<string, number>;
  donationAssigned: number;
  donationPaid: number;
  donationCount: number;
  donationDatesEarly: number; // paid in first 3 months
  donationDatesLate: number;  // paid in last 3 months
  expenseTotal: number;
  expensesByTitle: { title: string; amount: number }[];
  participants: number;
  participantsByCategory: Record<string, number>;
  competitions: { id: string; name: string; entries: number; votes: number }[];
  totalEntries: number;
  totalVotes: number;
  winners: number;
  programsCompleted: number;
  programsTotal: number;
  suggestionsTotal: number;
  suggestionsResolved: number;
  suggestionsPending: number;
  quizSessions: number;
  quizAvgScore: number;
  activityCount: number;
  archived: boolean;
}

const EMPTY: YearSnapshot = {
  households: 0, members: 0, male: 0, female: 0, eduDistribution: {},
  donationAssigned: 0, donationPaid: 0, donationCount: 0,
  donationDatesEarly: 0, donationDatesLate: 0,
  expenseTotal: 0, expensesByTitle: [],
  participants: 0, participantsByCategory: {},
  competitions: [], totalEntries: 0, totalVotes: 0,
  winners: 0, programsCompleted: 0, programsTotal: 0,
  suggestionsTotal: 0, suggestionsResolved: 0, suggestionsPending: 0,
  quizSessions: 0, quizAvgScore: 0, activityCount: 0, archived: false,
};

const EDU_LABEL: Record<string, string> = {
  school_not_eligible: "अयोग्य", balwadi: "बालवाडी",
  class_1: "१ली", class_2: "२री", class_3: "३री", class_4: "४थी",
  class_5: "५वी", class_6: "६वी", class_7: "७वी", class_8: "८वी",
  class_9: "९वी", class_10: "१०वी", class_11: "११वी", class_12: "१२वी",
  diploma: "डिप्लोमा", degree: "पदवी", other: "इतर",
};

const CAT_LABEL: Record<string, string> = {
  chota: "छोटा गट", motha: "मोठा गट", khula: "खुला गट",
};

// ═══════════════════════════════════════════════════════════════════
// Data loading — pulls ONE year snapshot
// ═══════════════════════════════════════════════════════════════════
async function loadYear(year: string): Promise<YearSnapshot> {
  const [
    { data: hh }, { data: members },
    { data: assigns }, { data: pays },
    { data: expenses },
    { data: parts },
    { data: comps }, { data: entries }, { data: votes },
    { data: winners },
    { data: progs },
    { data: sugg },
    { data: quiz },
    { count: activityCount },
    { data: arch },
  ] = await Promise.all([
    supabase.from("households").select("id, created_at"),
    supabase.from("household_members").select("gender, education_level"),
    supabase.from("household_year_assignments").select("assigned_amount").eq("year", year),
    supabase.from("donation_payments").select("amount, payment_date").eq("year", year),
    supabase.from("ledger_expenses").select("title, amount").eq("year", year),
    supabase.from("participants").select("category, competition_id"),
    supabase.from("competitions").select("id, name"),
    supabase.from("competition_entries").select("id, competition_id"),
    supabase.from("public_votes").select("competition_id"),
    supabase.from("program_winners").select("first_place, second_place, third_place"),
    supabase.from("programs").select("status"),
    supabase.from("suggestions").select("status"),
    supabase.from("quiz_sessions").select("score, total_marks, status"),
    supabase.from("admin_activity_logs").select("id", { count: "exact", head: true }),
    supabase.from("archives").select("year").eq("year", year).maybeSingle(),
  ]);

  const male = (members || []).filter((m: any) => m.gender === "male").length;
  const female = (members || []).filter((m: any) => m.gender === "female").length;

  const eduDistribution: Record<string, number> = {};
  (members || []).forEach((m: any) => {
    const k = m.education_level || "other";
    eduDistribution[k] = (eduDistribution[k] || 0) + 1;
  });

  const donationAssigned = (assigns || []).reduce((s, r: any) => s + Number(r.assigned_amount || 0), 0);
  const donationPaid = (pays || []).reduce((s, r: any) => s + Number(r.amount || 0), 0);

  // Donation timing: early = paid in first 3 months of year, late = last 3 months
  const yInt = Number(year);
  let early = 0, late = 0;
  (pays || []).forEach((p: any) => {
    if (!p.payment_date) return;
    const d = new Date(p.payment_date);
    if (d.getFullYear() !== yInt) return;
    const m = d.getMonth();
    if (m <= 2) early += Number(p.amount || 0);
    if (m >= 9) late += Number(p.amount || 0);
  });

  const expenseTotal = (expenses || []).reduce((s, r: any) => s + Number(r.amount || 0), 0);
  const expenseAgg = new Map<string, number>();
  (expenses || []).forEach((r: any) => {
    const key = (r.title || "इतर").trim();
    expenseAgg.set(key, (expenseAgg.get(key) || 0) + Number(r.amount || 0));
  });
  const expensesByTitle = Array.from(expenseAgg.entries())
    .map(([title, amount]) => ({ title, amount }))
    .sort((a, b) => b.amount - a.amount);

  const partsByCat: Record<string, number> = {};
  (parts || []).forEach((p: any) => {
    const c = p.category || "khula";
    partsByCat[c] = (partsByCat[c] || 0) + 1;
  });

  const entryByComp = new Map<string, number>();
  (entries || []).forEach((e: any) => {
    entryByComp.set(e.competition_id, (entryByComp.get(e.competition_id) || 0) + 1);
  });
  const voteByComp = new Map<string, number>();
  (votes || []).forEach((v: any) => {
    voteByComp.set(v.competition_id, (voteByComp.get(v.competition_id) || 0) + 1);
  });

  const competitions = (comps || []).map((c: any) => ({
    id: c.id, name: c.name,
    entries: entryByComp.get(c.id) || 0,
    votes: voteByComp.get(c.id) || 0,
  }));

  const winnerCount = (winners || []).reduce((s: number, w: any) =>
    s + (w.first_place ? 1 : 0) + (w.second_place ? 1 : 0) + (w.third_place ? 1 : 0), 0);

  const programsTotal = (progs || []).length;
  const programsCompleted = (progs || []).filter((p: any) => p.status === "COMPLETED").length;

  const suggestionsTotal = (sugg || []).length;
  const suggestionsResolved = (sugg || []).filter((s: any) => s.status === "resolved").length;
  const suggestionsPending = suggestionsTotal - suggestionsResolved;

  const quizCompleted = (quiz || []).filter((q: any) => q.status === "COMPLETED");
  const quizAvg = quizCompleted.length > 0
    ? Math.round((quizCompleted.reduce((s: number, q: any) =>
        s + (q.total_marks > 0 ? (Number(q.score || 0) / Number(q.total_marks)) * 100 : 0), 0) / quizCompleted.length))
    : 0;

  return {
    households: (hh || []).length,
    members: (members || []).length,
    male, female, eduDistribution,
    donationAssigned, donationPaid,
    donationCount: (pays || []).length,
    donationDatesEarly: early,
    donationDatesLate: late,
    expenseTotal, expensesByTitle,
    participants: (parts || []).length,
    participantsByCategory: partsByCat,
    competitions,
    totalEntries: (entries || []).length,
    totalVotes: (votes || []).length,
    winners: winnerCount,
    programsCompleted, programsTotal,
    suggestionsTotal, suggestionsResolved, suggestionsPending,
    quizSessions: (quiz || []).length,
    quizAvgScore: quizAvg,
    activityCount: activityCount || 0,
    archived: !!arch,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Insights engine (explainable, derived from real numbers)
// ═══════════════════════════════════════════════════════════════════
function buildInsights(curr: YearSnapshot, prev: YearSnapshot) {
  const memberGrowth = growth(curr.members, prev.members);
  const householdGrowth = growth(curr.households, prev.households);
  const donationGrowth = growth(curr.donationPaid, prev.donationPaid);
  const donationCompletion = pct(curr.donationPaid, curr.donationAssigned);
  const balance = curr.donationPaid - curr.expenseTotal;
  const partsGrowth = growth(curr.participants, prev.participants);
  const compsRun = curr.competitions.filter((c) => c.entries > 0).length;

  // Most / least popular competition
  const sortedByEntries = [...curr.competitions].sort((a, b) => b.entries - a.entries);
  const topComp = sortedByEntries[0];
  const bottomComp = sortedByEntries.filter((c) => c.entries > 0).slice(-1)[0];
  const topVoteComp = [...curr.competitions].sort((a, b) => b.votes - a.votes)[0];

  // Executive summary
  const summary = [
    memberGrowth >= 0
      ? `या वर्षी समाज सदस्यसंख्या ${memberGrowth}% ने वाढली.`
      : `या वर्षी समाज सदस्यसंख्या ${Math.abs(memberGrowth)}% ने कमी झाली.`,
    donationGrowth >= 0
      ? `देणगी संकलन ${donationGrowth}% ने सुधारले (${fmtINR(curr.donationPaid)}).`
      : `देणगी संकलन ${Math.abs(donationGrowth)}% ने कमी झाले (${fmtINR(curr.donationPaid)}).`,
    `पारदर्शकता कायम राहिली — जमा ${fmtINR(curr.donationPaid)}, खर्च ${fmtINR(curr.expenseTotal)}, शिल्लक ${fmtINR(balance)}.`,
    compsRun > 0
      ? `${compsRun} स्पर्धांमध्ये एकूण ${curr.totalEntries} नोंदी व ${curr.totalVotes} जनतेची मते नोंदविली गेली.`
      : `या वर्षी कोणतीही स्पर्धा नोंद झाली नाही — प्रचारावर भर देणे आवश्यक.`,
  ].join(" ");

  // Recommendations (data-driven only)
  const recs: string[] = [];
  if (donationCompletion < 60)
    recs.push(`देणगी संकलन ${donationCompletion}% वर आहे — जानेवारीच्या सुरुवातीलाच जमवणी मोहीम सुरू करा.`);
  if (curr.donationDatesLate > curr.donationDatesEarly * 2 && curr.donationPaid > 0)
    recs.push(`बहुतांश देणगी वर्षअखेरीस जमा झाली — नियोजनासाठी early-bird प्रोत्साहन योजना विचारात घ्या.`);
  if (bottomComp && topComp && bottomComp.entries < topComp.entries / 3)
    recs.push(`“${bottomComp.name}” स्पर्धेला कमी प्रतिसाद (${bottomComp.entries} नोंदी) — जागरूकता वाढवा.`);
  if ((curr.eduDistribution.diploma || 0) + (curr.eduDistribution.degree || 0) < curr.members * 0.1 && curr.members > 0)
    recs.push(`डिप्लोमा/पदवीधर सहभाग कमी — तांत्रिक विषयांवर विशेष कार्यक्रम आयोजित करा.`);
  if (curr.female < curr.male * 0.6 && curr.members > 0)
    recs.push(`महिला सहभागाचे प्रमाण कमी — महिला-केंद्रित उपक्रम राबवा.`);
  if (curr.suggestionsPending > curr.suggestionsResolved)
    recs.push(`${curr.suggestionsPending} सुझाव प्रलंबित — त्वरित निराकरण प्रणाली मजबूत करा.`);
  if (curr.programsTotal > 0 && curr.programsCompleted / curr.programsTotal < 0.7)
    recs.push(`${curr.programsCompleted}/${curr.programsTotal} कार्यक्रम पूर्ण — नियोजन व अंमलबजावणी सुधारणे आवश्यक.`);
  if (recs.length === 0)
    recs.push(`सर्व निर्देशांक स्थिर आहेत — पुढील वर्षी नवीन उपक्रम सुरू करण्याची चांगली संधी.`);

  // Risks
  const risks: string[] = [];
  if (donationCompletion < 50) risks.push(`देणगी संकलन धोकादायकरीत्या कमी (${donationCompletion}%).`);
  if (balance < 0) risks.push(`खर्च देणगीपेक्षा जास्त — आर्थिक तूट ${fmtINR(Math.abs(balance))}.`);
  if (curr.donationDatesLate > curr.donationPaid * 0.6) risks.push(`देणगी उशिरा जमा होत आहे — रोख प्रवाहावर परिणाम.`);
  if (compsRun < 3) risks.push(`कमी स्पर्धा — सांस्कृतिक सहभाग घटण्याचा धोका.`);
  if (curr.suggestionsPending > 10) risks.push(`अनेक सुझाव प्रलंबित — समाज असंतोष निर्माण होऊ शकतो.`);

  // Achievement highlights
  const achievements: { label: string; value: string }[] = [];
  if (topComp && topComp.entries > 0)
    achievements.push({ label: "सर्वाधिक लोकप्रिय स्पर्धा", value: `${topComp.name} (${topComp.entries} नोंदी)` });
  if (topVoteComp && topVoteComp.votes > 0)
    achievements.push({ label: "सर्वाधिक मतदान", value: `${topVoteComp.name} (${topVoteComp.votes} मते)` });
  if (donationGrowth > 0)
    achievements.push({ label: "देणगी वाढ", value: `+${donationGrowth}%` });
  if (memberGrowth > 0)
    achievements.push({ label: "सदस्य वाढ", value: `+${memberGrowth}%` });
  const topEdu = Object.entries(curr.eduDistribution).sort((a, b) => b[1] - a[1])[0];
  if (topEdu)
    achievements.push({ label: "सर्वाधिक शैक्षणिक गट", value: `${EDU_LABEL[topEdu[0]] || topEdu[0]} (${topEdu[1]})` });
  if (curr.donationDatesEarly > curr.donationDatesLate && curr.donationPaid > 0)
    achievements.push({ label: "जलद देणगी संकलन", value: `${pct(curr.donationDatesEarly, curr.donationPaid)}% पहिल्या तिमाहीत` });

  // Health scores (0-100)
  const scores = {
    participation: Math.min(100, Math.round((curr.participants / Math.max(1, curr.members)) * 100 * 3)),
    financialDiscipline: Math.max(0, Math.min(100, donationCompletion - (balance < 0 ? 20 : 0))),
    transparency: curr.archived || curr.donationPaid > 0 ? 95 : 60,
    competitionQuality: Math.min(100, compsRun * 15 + Math.min(30, curr.totalVotes / 5)),
    communityEngagement: Math.min(100, Math.round(((curr.participants + curr.totalVotes + curr.suggestionsTotal) / Math.max(1, curr.members)) * 100)),
    operationalEfficiency: curr.programsTotal > 0 ? Math.round((curr.programsCompleted / curr.programsTotal) * 100) : 70,
    documentation: Math.min(100, Math.round((curr.activityCount / 50) * 100)),
  };
  const overall = Math.round(
    (scores.participation + scores.financialDiscipline + scores.transparency +
     scores.competitionQuality + scores.communityEngagement +
     scores.operationalEfficiency + scores.documentation) / 7
  );

  // Future outlook
  const outlook = [
    memberGrowth > 0
      ? `सद्य वाढदराने पुढील वर्षी अंदाजे ${Math.round(curr.members * (1 + memberGrowth / 100))} सदस्य अपेक्षित.`
      : `सदस्य स्थिर — नवीन नोंदणी मोहीम आवश्यक.`,
    donationGrowth >= 0
      ? `देणगी वृद्धीचा दर सकारात्मक — पुढील वर्षी ${fmtINR(curr.donationPaid * (1 + Math.max(0, donationGrowth) / 100))} अपेक्षित.`
      : `देणगी घट — पुढील वर्षी विशेष जमवणी मोहीम आवश्यक.`,
    `स्पर्धा व सामुदायिक कार्यक्रमांचे प्रमाण कायम राखल्यास सहभाग वाढ राहील.`,
  ].join(" ");

  return {
    summary, recs, risks, achievements, scores, overall, outlook,
    memberGrowth, householdGrowth, donationGrowth, donationCompletion,
    balance, partsGrowth, compsRun, topComp, bottomComp, topVoteComp,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Simple inline SVG bar chart (print-safe, no external libs)
// ═══════════════════════════════════════════════════════════════════
function svgBars(items: { label: string; value: number }[], color = "#0c2340", height = 140) {
  if (items.length === 0) return `<div style="font-size:11px;color:#64748b">डेटा उपलब्ध नाही</div>`;
  const max = Math.max(1, ...items.map((i) => i.value));
  const w = 640, barW = Math.max(18, (w - 40) / items.length - 8);
  return `<svg viewBox="0 0 ${w} ${height + 40}" width="100%" style="max-width:640px">
    ${items.map((it, i) => {
      const bh = (it.value / max) * height;
      const x = 20 + i * (barW + 8);
      const y = height - bh + 10;
      return `
        <rect x="${x}" y="${y}" width="${barW}" height="${bh}" fill="${color}" rx="3"/>
        <text x="${x + barW / 2}" y="${y - 4}" font-size="10" text-anchor="middle" fill="#0c2340">${it.value}</text>
        <text x="${x + barW / 2}" y="${height + 26}" font-size="9" text-anchor="middle" fill="#475569">${escapeHtml(it.label).slice(0, 12)}</text>
      `;
    }).join("")}
  </svg>`;
}

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════
const CommunityIntelligenceReport = () => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<string>(String(currentYear));
  const [loading, setLoading] = useState(true);
  const [curr, setCurr] = useState<YearSnapshot>(EMPTY);
  const [prev, setPrev] = useState<YearSnapshot>(EMPTY);

  const yearOptions = useMemo(
    () => Array.from({ length: 5 }, (_, i) => String(currentYear - i)),
    [currentYear],
  );

  const load = async () => {
    setLoading(true);
    try {
      const [c, p] = await Promise.all([
        loadYear(year),
        loadYear(String(Number(year) - 1)),
      ]);
      setCurr(c); setPrev(p);
    } catch (e: any) {
      toast.error("अहवाल डेटा लोड करण्यात त्रुटी");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [year]);

  const insights = useMemo(() => buildInsights(curr, prev), [curr, prev]);

  // ─── PDF export (opens print window) ────────────────────────────
  const exportPDF = () => {
    const today = new Date().toLocaleString("mr-IN");
    const eduChart = svgBars(
      Object.entries(curr.eduDistribution)
        .sort((a, b) => b[1] - a[1]).slice(0, 10)
        .map(([k, v]) => ({ label: EDU_LABEL[k] || k, value: v })),
      "#0c2340"
    );
    const compChart = svgBars(
      curr.competitions.slice(0, 8).map((c) => ({ label: c.name, value: c.entries })),
      "#c9a84c"
    );
    const voteChart = svgBars(
      curr.competitions.slice(0, 8).map((c) => ({ label: c.name, value: c.votes })),
      "#059669"
    );
    const expenseChart = svgBars(
      curr.expensesByTitle.slice(0, 8).map((e) => ({ label: e.title, value: Math.round(e.amount) })),
      "#dc2626"
    );
    const trendChart = svgBars([
      { label: "देणगी " + (Number(year) - 1), value: prev.donationPaid },
      { label: "देणगी " + year, value: curr.donationPaid },
      { label: "खर्च " + (Number(year) - 1), value: prev.expenseTotal },
      { label: "खर्च " + year, value: curr.expenseTotal },
    ], "#0c2340");

    const scoreRows = [
      ["सहभाग", insights.scores.participation, "एकूण सदस्यांच्या तुलनेत सहभागाचे प्रमाण"],
      ["आर्थिक शिस्त", insights.scores.financialDiscipline, "देणगी संकलन व खर्च नियंत्रण"],
      ["पारदर्शकता", insights.scores.transparency, "प्रकाशित नोंदी व संग्रहण"],
      ["स्पर्धा गुणवत्ता", insights.scores.competitionQuality, "स्पर्धा संख्या व मतदान"],
      ["सामुदायिक सहभाग", insights.scores.communityEngagement, "सहभाग + मते + सुझाव"],
      ["परिचालन कार्यक्षमता", insights.scores.operationalEfficiency, "पूर्ण झालेले कार्यक्रम"],
      ["दस्तऐवजीकरण", insights.scores.documentation, "क्रियाकलाप नोंदी"],
    ];

    const html = `<!doctype html><html lang="mr"><head><meta charset="utf-8">
<title>Community Intelligence Report ${year}</title>
<style>
  @page { size: A4; margin: 16mm 12mm 20mm 12mm; }
  *{box-sizing:border-box}
  body{font-family:'Noto Sans Devanagari','Tiro Devanagari Marathi',system-ui,sans-serif;color:#0f172a;margin:0}
  .hdr{display:flex;align-items:center;gap:14px;border-bottom:3px double #0c2340;padding-bottom:10px;margin-bottom:14px}
  .hdr img{width:70px;height:70px;border-radius:50%;object-fit:cover;border:2px solid #c9a84c}
  .hdr h1{margin:0;font-size:17px;color:#0c2340}
  .hdr h2{margin:2px 0 0;font-size:11px;color:#c9a84c;font-weight:600;letter-spacing:.5px}
  .hdr .yr{margin-left:auto;text-align:right;font-size:11px;color:#475569}
  .hdr .yr b{display:block;font-size:22px;color:#0c2340}
  h3.sec{font-size:14px;color:#0c2340;margin:18px 0 6px;border-left:5px solid #c9a84c;padding-left:10px;page-break-after:avoid}
  h3.sec small{font-weight:400;color:#64748b;font-size:10.5px;margin-left:6px}
  .card{border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;background:#f8fafc;font-size:11px;color:#334155;margin-bottom:8px}
  .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:6px 0 10px}
  .kpi{border:1px solid #e2e8f0;border-radius:6px;padding:8px 10px;background:#fff}
  .kpi b{display:block;font-size:9.5px;color:#64748b;font-weight:600;text-transform:uppercase}
  .kpi span{font-size:15px;font-weight:700;color:#0c2340}
  .kpi .g{color:#059669;font-size:10px;margin-left:4px}
  .kpi .r{color:#dc2626;font-size:10px;margin-left:4px}
  table{width:100%;border-collapse:collapse;font-size:10.5px;margin:6px 0}
  th,td{border:1px solid #cbd5e1;padding:5px 7px;text-align:left}
  th{background:#0c2340;color:#fff;font-weight:600}
  tr:nth-child(even) td{background:#f8fafc}
  ul{margin:4px 0;padding-left:20px;font-size:11px;line-height:1.55}
  ul li{margin:2px 0}
  .score-bar{background:#e2e8f0;height:8px;border-radius:4px;overflow:hidden}
  .score-bar>div{height:100%;background:linear-gradient(90deg,#0c2340,#c9a84c)}
  .overall{text-align:center;padding:14px;border:2px solid #c9a84c;border-radius:10px;background:linear-gradient(135deg,#0c2340,#1e3a5f);color:#fff;margin:10px 0}
  .overall .n{font-size:44px;font-weight:800;color:#c9a84c;line-height:1}
  .overall .l{font-size:11px;opacity:.9;margin-top:4px}
  .highlight{border-left:4px solid #059669;background:#ecfdf5;padding:6px 10px;font-size:11px;margin:4px 0}
  .risk{border-left:4px solid #dc2626;background:#fef2f2;padding:6px 10px;font-size:11px;margin:4px 0}
  .rec{border-left:4px solid #c9a84c;background:#fefce8;padding:6px 10px;font-size:11px;margin:4px 0}
  .chart-wrap{background:#fff;border:1px solid #e2e8f0;border-radius:6px;padding:8px;margin:6px 0}
  .chart-wrap .cap{font-size:10.5px;color:#64748b;margin-bottom:4px;font-weight:600}
  .stamp-block{text-align:center;margin:20px 0 10px}
  .stamp-block img{width:80px;opacity:.85;transform:rotate(-6deg)}
  .stamp-block .cap{font-size:10px;color:#0c2340;margin-top:4px;font-weight:600}
  .ft{position:fixed;bottom:6mm;left:12mm;right:12mm;border-top:1px solid #cbd5e1;padding-top:5px;font-size:9px;color:#64748b;display:flex;justify-content:space-between}
  .page-break{page-break-before:always}
  @media print { .no-print{display:none} }
</style></head><body>

<div class="hdr">
  <img src="${logo}" alt="logo"/>
  <div style="flex:1">
    <h1>भारतरत्न डॉ. बाबासाहेब आंबेडकर विचारमंच, लातूर</h1>
    <h2>COMMUNITY INTELLIGENCE REPORT · सामुदायिक बुद्धिमत्ता अहवाल</h2>
  </div>
  <div class="yr"><span>वर्ष</span><b>${year}</b></div>
</div>

<h3 class="sec">१. कार्यकारी सारांश <small>Executive Summary</small></h3>
<div class="card">${escapeHtml(insights.summary)}</div>

<h3 class="sec">२. समाज वाढ विश्लेषण <small>Community Growth</small></h3>
<div class="grid">
  <div class="kpi"><b>घरे</b><span>${curr.households}<span class="${insights.householdGrowth >= 0 ? "g" : "r"}">${insights.householdGrowth >= 0 ? "▲" : "▼"} ${Math.abs(insights.householdGrowth)}%</span></span></div>
  <div class="kpi"><b>सदस्य</b><span>${curr.members}<span class="${insights.memberGrowth >= 0 ? "g" : "r"}">${insights.memberGrowth >= 0 ? "▲" : "▼"} ${Math.abs(insights.memberGrowth)}%</span></span></div>
  <div class="kpi"><b>पुरुष</b><span>${curr.male}</span></div>
  <div class="kpi"><b>महिला</b><span>${curr.female}</span></div>
</div>
<div class="chart-wrap"><div class="cap">शैक्षणिक वितरण</div>${eduChart}</div>

<h3 class="sec">३. देणगी बुद्धिमत्ता <small>Donation Intelligence</small></h3>
<div class="grid">
  <div class="kpi"><b>नियुक्त</b><span>${fmtINR(curr.donationAssigned)}</span></div>
  <div class="kpi"><b>जमा</b><span>${fmtINR(curr.donationPaid)}<span class="${insights.donationGrowth >= 0 ? "g" : "r"}">${insights.donationGrowth >= 0 ? "▲" : "▼"} ${Math.abs(insights.donationGrowth)}%</span></span></div>
  <div class="kpi"><b>पूर्णता</b><span>${insights.donationCompletion}%</span></div>
  <div class="kpi"><b>प्रलंबित</b><span>${fmtINR(Math.max(0, curr.donationAssigned - curr.donationPaid))}</span></div>
</div>
<ul>
  <li>पहिल्या तिमाहीत जमा: <b>${fmtINR(curr.donationDatesEarly)}</b> (${pct(curr.donationDatesEarly, curr.donationPaid)}%)</li>
  <li>अखेरच्या तिमाहीत जमा: <b>${fmtINR(curr.donationDatesLate)}</b> (${pct(curr.donationDatesLate, curr.donationPaid)}%)</li>
  <li>एकूण देणगी नोंदी: <b>${curr.donationCount}</b></li>
</ul>

<h3 class="sec">४. खर्च बुद्धिमत्ता <small>Expense Intelligence</small></h3>
<div class="grid">
  <div class="kpi"><b>एकूण खर्च</b><span>${fmtINR(curr.expenseTotal)}</span></div>
  <div class="kpi"><b>श्रेण्या</b><span>${curr.expensesByTitle.length}</span></div>
  <div class="kpi"><b>सर्वोच्च</b><span style="font-size:11px">${curr.expensesByTitle[0]?.title || "—"}</span></div>
  <div class="kpi"><b>शिल्लक</b><span style="color:${insights.balance >= 0 ? "#059669" : "#dc2626"}">${fmtINR(insights.balance)}</span></div>
</div>
<div class="chart-wrap"><div class="cap">खर्च वितरण (सर्वोच्च ८)</div>${expenseChart}</div>

<div class="page-break"></div>

<h3 class="sec">५. स्पर्धा बुद्धिमत्ता <small>Competition Intelligence</small></h3>
<div class="grid">
  <div class="kpi"><b>स्पर्धा</b><span>${curr.competitions.length}</span></div>
  <div class="kpi"><b>नोंदी</b><span>${curr.totalEntries}</span></div>
  <div class="kpi"><b>मते</b><span>${curr.totalVotes}</span></div>
  <div class="kpi"><b>विजेते</b><span>${curr.winners}</span></div>
</div>
<div class="chart-wrap"><div class="cap">स्पर्धा-नुसार नोंदी</div>${compChart}</div>
<div class="chart-wrap"><div class="cap">स्पर्धा-नुसार सार्वजनिक मते</div>${voteChart}</div>
<ul>
  ${insights.topComp ? `<li>सर्वाधिक लोकप्रिय: <b>${escapeHtml(insights.topComp.name)}</b> (${insights.topComp.entries} नोंदी)</li>` : ""}
  ${insights.bottomComp ? `<li>कमी प्रतिसाद: <b>${escapeHtml(insights.bottomComp.name)}</b> (${insights.bottomComp.entries} नोंदी)</li>` : ""}
  ${insights.topVoteComp && insights.topVoteComp.votes > 0 ? `<li>सर्वाधिक मतदान: <b>${escapeHtml(insights.topVoteComp.name)}</b> (${insights.topVoteComp.votes} मते)</li>` : ""}
  ${Object.entries(curr.participantsByCategory).map(([c, n]) => `<li>${CAT_LABEL[c] || c}: <b>${n}</b> सहभागी</li>`).join("")}
</ul>

<h3 class="sec">६. सामुदायिक सहभाग <small>Participation Intelligence</small></h3>
<div class="card">
एकूण सहभाग: <b>${curr.participants}</b> (${insights.partsGrowth >= 0 ? "+" : ""}${insights.partsGrowth}% गत वर्षाच्या तुलनेत).
पूर्ण झालेले कार्यक्रम: <b>${curr.programsCompleted}/${curr.programsTotal}</b>.
प्रश्नमंजुषा सत्रे: <b>${curr.quizSessions}</b> · सरासरी गुण <b>${curr.quizAvgScore}%</b>.
</div>

<h3 class="sec">७. विजेते बुद्धिमत्ता <small>Winner Intelligence</small></h3>
<div class="card">एकूण घोषित विजेते: <b>${curr.winners}</b> · श्रेणी वैविध्य: <b>${Object.keys(curr.participantsByCategory).length}</b></div>

<h3 class="sec">८. शैक्षणिक बुद्धिमत्ता <small>Educational Intelligence</small></h3>
<table><thead><tr><th>स्तर</th><th class="right">संख्या</th><th class="right">टक्केवारी</th></tr></thead><tbody>
${Object.entries(curr.eduDistribution).sort((a, b) => b[1] - a[1]).map(([k, v]) =>
  `<tr><td>${EDU_LABEL[k] || k}</td><td>${v}</td><td>${pct(v, curr.members)}%</td></tr>`).join("")}
</tbody></table>

<h3 class="sec">९. सुझाव बुद्धिमत्ता <small>Suggestion Intelligence</small></h3>
<div class="grid">
  <div class="kpi"><b>एकूण</b><span>${curr.suggestionsTotal}</span></div>
  <div class="kpi"><b>निराकरण</b><span>${curr.suggestionsResolved}</span></div>
  <div class="kpi"><b>प्रलंबित</b><span>${curr.suggestionsPending}</span></div>
  <div class="kpi"><b>प्रतिसाद दर</b><span>${pct(curr.suggestionsResolved, curr.suggestionsTotal)}%</span></div>
</div>

<h3 class="sec">१०. कालरेषा <small>Timeline Intelligence</small></h3>
<div class="card">वर्षभरात ${curr.activityCount} क्रियाकलाप नोंदी झाल्या. ${curr.programsCompleted} कार्यक्रम पूर्ण झाले.
${curr.archived ? "वर्ष अधिकृतरीत्या संग्रहित." : "वर्ष अद्याप संग्रहित नाही."}</div>

<div class="page-break"></div>

<h3 class="sec">११. आर्थिक पारदर्शकता <small>Financial Transparency</small></h3>
<div class="chart-wrap"><div class="cap">देणगी vs खर्च कल</div>${trendChart}</div>
<table>
<thead><tr><th>बाब</th><th class="right">${Number(year) - 1}</th><th class="right">${year}</th><th class="right">बदल</th></tr></thead>
<tbody>
<tr><td>देणगी जमा</td><td>${fmtINR(prev.donationPaid)}</td><td>${fmtINR(curr.donationPaid)}</td><td>${insights.donationGrowth >= 0 ? "+" : ""}${insights.donationGrowth}%</td></tr>
<tr><td>एकूण खर्च</td><td>${fmtINR(prev.expenseTotal)}</td><td>${fmtINR(curr.expenseTotal)}</td><td>${growth(curr.expenseTotal, prev.expenseTotal)}%</td></tr>
<tr><td>शिल्लक</td><td>${fmtINR(prev.donationPaid - prev.expenseTotal)}</td><td>${fmtINR(insights.balance)}</td><td>—</td></tr>
</tbody>
</table>

<h3 class="sec">१२. जोखीम विश्लेषण <small>Risk Analysis</small></h3>
${insights.risks.length === 0 ? `<div class="highlight">कोणतीही महत्त्वाची जोखीम आढळली नाही.</div>` : insights.risks.map((r) => `<div class="risk">⚠ ${escapeHtml(r)}</div>`).join("")}

<h3 class="sec">१३. स्पष्ट शिफारसी <small>Explainable Recommendations</small></h3>
${insights.recs.map((r) => `<div class="rec">💡 ${escapeHtml(r)}</div>`).join("")}

<h3 class="sec">१४. सामुदायिक आरोग्य गुण <small>Community Health Score</small></h3>
<div class="overall">
  <div class="n">${insights.overall}<span style="font-size:18px">/100</span></div>
  <div class="l">एकत्रित सामुदायिक आरोग्य निर्देशांक</div>
</div>
<table>
<thead><tr><th>निर्देशांक</th><th style="width:80px">गुण</th><th style="width:180px">पातळी</th><th>स्पष्टीकरण</th></tr></thead>
<tbody>
${scoreRows.map(([label, val, expl]) => `<tr>
  <td><b>${label}</b></td>
  <td><b>${val}/100</b></td>
  <td><div class="score-bar"><div style="width:${val}%"></div></div></td>
  <td>${expl}</td>
</tr>`).join("")}
</tbody>
</table>

<h3 class="sec">१५. यशाची ठळक वैशिष्ट्ये <small>Achievement Highlights</small></h3>
${insights.achievements.length === 0 ? `<div class="card">या वर्षी विशेष ठळक कामगिरी नोंदविली गेली नाही.</div>` :
`<div class="grid" style="grid-template-columns:repeat(2,1fr)">
${insights.achievements.map((a) => `<div class="kpi"><b>${escapeHtml(a.label)}</b><span style="font-size:12px">${escapeHtml(a.value)}</span></div>`).join("")}
</div>`}

<h3 class="sec">१६. भविष्यवेध <small>Future Outlook</small></h3>
<div class="card">${escapeHtml(insights.outlook)}</div>

<div class="stamp-block">
  <img src="${logo}" alt="stamp"/>
  <div class="cap">Generated by Vicharmanch Community Operating System</div>
</div>

<div class="ft">
  <span>Vicharmanch COS · v2.0 · ${today}</span>
  <span>Community Intelligence Report ${year}</span>
</div>
<script>window.onload=()=>{setTimeout(()=>window.print(),500)}</script>
</body></html>`;
    const w = window.open("", "_blank");
    if (!w) { toast.error("Pop-up blocked"); return; }
    w.document.open(); w.document.write(html); w.document.close();
  };

  // ─── On-screen preview ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-primary" />
                Community Intelligence Report
              </CardTitle>
              <CardDescription>
                वास्तविक डेटावर आधारित स्पष्ट (Explainable) वार्षिक विश्लेषण
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (<SelectItem key={y} value={y}>वर्ष {y}</SelectItem>))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={load}>
                <RefreshCw className="h-4 w-4 mr-1" /> रिफ्रेश
              </Button>
              <Button size="sm" onClick={exportPDF}>
                <Download className="h-4 w-4 mr-1" /> PDF अहवाल
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-card/60 p-4 text-sm leading-relaxed">
            <div className="flex items-center gap-2 mb-2 text-primary font-semibold">
              <Sparkles className="h-4 w-4" /> कार्यकारी सारांश
            </div>
            {insights.summary}
          </div>
        </CardContent>
      </Card>

      {/* Overall score */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-primary to-[hsl(217,80%,25%)] text-primary-foreground">
        <CardContent className="p-6 text-center">
          <div className="text-xs uppercase tracking-wider opacity-80">सामुदायिक आरोग्य निर्देशांक</div>
          <div className="text-6xl font-bold text-accent mt-2">{insights.overall}<span className="text-2xl opacity-70">/100</span></div>
          <div className="text-xs opacity-80 mt-1">
            {insights.overall >= 80 ? "उत्कृष्ट" : insights.overall >= 60 ? "चांगले" : insights.overall >= 40 ? "समाधानकारक" : "सुधारणा आवश्यक"}
          </div>
        </CardContent>
      </Card>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={Users} label="सदस्य" value={curr.members} delta={insights.memberGrowth} />
        <KPI icon={IndianRupee} label="देणगी जमा" value={fmtINR(curr.donationPaid)} delta={insights.donationGrowth} />
        <KPI icon={Trophy} label="स्पर्धा नोंदी" value={curr.totalEntries} />
        <KPI icon={Vote} label="सार्वजनिक मते" value={curr.totalVotes} />
        <KPI icon={IndianRupee} label="एकूण खर्च" value={fmtINR(curr.expenseTotal)} />
        <KPI icon={IndianRupee} label="शिल्लक" value={fmtINR(insights.balance)} />
        <KPI icon={MessageSquare} label="सुझाव प्रतिसाद" value={`${pct(curr.suggestionsResolved, curr.suggestionsTotal)}%`} />
        <KPI icon={Activity} label="क्रियाकलाप नोंदी" value={curr.activityCount} />
      </div>

      {/* Health scores */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" /> आरोग्य निर्देशांक तपशील
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            ["सहभाग", insights.scores.participation],
            ["आर्थिक शिस्त", insights.scores.financialDiscipline],
            ["पारदर्शकता", insights.scores.transparency],
            ["स्पर्धा गुणवत्ता", insights.scores.competitionQuality],
            ["सामुदायिक सहभाग", insights.scores.communityEngagement],
            ["परिचालन कार्यक्षमता", insights.scores.operationalEfficiency],
            ["दस्तऐवजीकरण", insights.scores.documentation],
          ].map(([label, val]) => (
            <div key={String(label)}>
              <div className="flex justify-between text-sm mb-1">
                <span>{label}</span><b>{val}/100</b>
              </div>
              <Progress value={Number(val)} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Achievements */}
      {insights.achievements.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-accent" /> यशाची ठळक वैशिष्ट्ये
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {insights.achievements.map((a, i) => (
              <div key={i} className="rounded-lg border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 p-3">
                <div className="text-xs text-muted-foreground">{a.label}</div>
                <div className="font-semibold text-sm">{a.value}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recommendations & Risks */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-accent" /> स्पष्ट शिफारसी
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.recs.map((r, i) => (
              <div key={i} className="rounded-lg border-l-4 border-accent bg-accent/5 p-3 text-sm">{r}</div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" /> जोखीम विश्लेषण
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.risks.length === 0 ? (
              <Badge className="bg-emerald-600">कोणतीही धोकादायक बाब नाही</Badge>
            ) : insights.risks.map((r, i) => (
              <div key={i} className="rounded-lg border-l-4 border-destructive bg-destructive/5 p-3 text-sm">{r}</div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Education distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" /> शैक्षणिक वितरण
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {Object.entries(curr.eduDistribution).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
            <Badge key={k} variant="secondary" className="text-xs">
              {EDU_LABEL[k] || k} · {v}
            </Badge>
          ))}
          {Object.keys(curr.eduDistribution).length === 0 && (
            <span className="text-sm text-muted-foreground">डेटा उपलब्ध नाही</span>
          )}
        </CardContent>
      </Card>

      {/* Outlook */}
      <Card className="border-0 bg-gradient-to-br from-accent/10 to-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> भविष्यवेध
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed">{insights.outlook}</CardContent>
      </Card>
    </div>
  );
};

const KPI = ({ icon: Icon, label, value, delta }: {
  icon: any; label: string; value: string | number; delta?: number;
}) => (
  <div className="rounded-xl border bg-card p-3 shadow-sm">
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5" /> {label}
    </div>
    <div className="mt-1 flex items-baseline gap-2">
      <span className="text-lg font-bold text-foreground">{value}</span>
      {typeof delta === "number" && (
        <span className={`text-xs font-semibold flex items-center ${delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
          {delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {Math.abs(delta)}%
        </span>
      )}
    </div>
  </div>
);

export default CommunityIntelligenceReport;
