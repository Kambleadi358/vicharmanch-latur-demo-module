// Government-style live vote results (like ECI counting screens)
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BarChart3, Loader2, Trophy, RefreshCw, Users, Vote } from "lucide-react";

interface Competition { id: string; name: string; }
interface Entry { id: string; competition_id: string; entry_code: string; category: string; participant_name: string; image_url?: string | null; }
interface VoteRow { competition_id: string; category: string; first_entry_id: string | null; second_entry_id: string | null; third_entry_id: string | null; }

const CATS = [
  { key: "chota", label: "छोटा गट" },
  { key: "motha", label: "मोठा गट" },
  { key: "khula", label: "खुला गट" },
] as const;

const MEDAL_BG = ["from-amber-400 to-yellow-600", "from-slate-300 to-slate-500", "from-orange-500 to-amber-700"];

const VoteResults = () => {
  const [comps, setComps] = useState<Competition[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [votes, setVotes] = useState<VoteRow[]>([]);
  const [compId, setCompId] = useState<string>("");
  const [cat, setCat] = useState<(typeof CATS)[number]["key"]>("chota");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [c, e, v] = await Promise.all([
      supabase.from("competitions").select("id, name").order("name"),
      supabase.from("competition_entries").select("id, competition_id, entry_code, category, participant_name, image_url"),
      supabase.from("public_votes").select("competition_id, category, first_entry_id, second_entry_id, third_entry_id"),
    ]);
    setComps((c.data as any) || []);
    setEntries((e.data as any) || []);
    setVotes((v.data as any) || []);
    if (c.data && c.data.length && !compId) setCompId(c.data[0].id);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const rows = useMemo(() => {
    if (!compId) return [];
    const es = entries.filter((x) => x.competition_id === compId && x.category === cat);
    const vs = votes.filter((x) => x.competition_id === compId && x.category === cat);
    return es
      .map((entry) => {
        let first = 0, second = 0, third = 0;
        vs.forEach((v) => {
          if (v.first_entry_id === entry.id) first++;
          if (v.second_entry_id === entry.id) second++;
          if (v.third_entry_id === entry.id) third++;
        });
        const total = first + second + third;
        const weighted = first * 3 + second * 2 + third * 1;
        return { ...entry, first, second, third, total, weighted };
      })
      .sort((a, b) => b.weighted - a.weighted || b.first - a.first || b.total - a.total);
  }, [compId, cat, entries, votes]);

  const totalVotesCast = useMemo(() => {
    return votes.filter((v) => v.competition_id === compId && v.category === cat).length;
  }, [votes, compId, cat]);

  const maxWeighted = rows[0]?.weighted || 0;
  const compName = comps.find((c) => c.id === compId)?.name || "";

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-3 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">मतदान निकाल</span>
          </div>
          <Select value={compId} onValueChange={setCompId}>
            <SelectTrigger className="h-9 w-64"><SelectValue placeholder="स्पर्धा" /></SelectTrigger>
            <SelectContent>{comps.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-9" onClick={load}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> ताजे करा
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin inline" /></div>
      ) : !compId ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">स्पर्धा निवडा</CardContent></Card>
      ) : (
        <Tabs value={cat} onValueChange={(v) => setCat(v as any)}>
          <TabsList className="grid grid-cols-3 w-full">
            {CATS.map((c) => <TabsTrigger key={c.key} value={c.key}>{c.label}</TabsTrigger>)}
          </TabsList>

          {CATS.map((c) => (
            <TabsContent key={c.key} value={c.key} className="space-y-4 mt-4">
              {/* Gov-style banner */}
              <div className="rounded-xl overflow-hidden border shadow-sm">
                <div className="bg-gradient-to-r from-[hsl(220,60%,18%)] via-[hsl(217,80%,30%)] to-[hsl(220,60%,18%)] text-primary-foreground px-4 py-3 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-widest opacity-80">Live Counting · अधिकृत निकाल</p>
                    <h3 className="text-lg sm:text-xl font-bold">{compName} — {c.label}</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-[10px] uppercase opacity-70">एकूण मतदार</p>
                      <p className="text-xl font-bold flex items-center gap-1"><Users className="h-4 w-4" /> {totalVotesCast}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase opacity-70">उमेदवार</p>
                      <p className="text-xl font-bold flex items-center gap-1"><Vote className="h-4 w-4" /> {rows.length}</p>
                    </div>
                  </div>
                </div>

                {/* Podium — top 3 */}
                {rows.length > 0 && (
                  <div className="bg-muted/30 px-4 py-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[0, 1, 2].map((i) => {
                      const r = rows[i];
                      if (!r) return <div key={i} />;
                      return (
                        <div key={r.id} className={`rounded-lg p-3 text-white bg-gradient-to-br ${MEDAL_BG[i]} shadow-md`}>
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="bg-white/20 text-white border-0">
                              <Trophy className="h-3 w-3 mr-1" /> क्रम {i + 1}
                            </Badge>
                            <span className="font-mono text-sm font-bold">{r.entry_code}</span>
                          </div>
                          <p className="text-[11px] mt-1 font-medium truncate opacity-95" title={r.participant_name}>{r.participant_name}</p>

                          <p className="text-2xl font-black mt-2">{r.weighted} <span className="text-xs font-normal opacity-80">गुण</span></p>
                          <p className="text-[11px] opacity-90 mt-0.5">
                            १ले: <b>{r.first}</b> · २रे: <b>{r.second}</b> · ३रे: <b>{r.third}</b>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Full ranking with bars */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">पूर्ण क्रमवारी</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {rows.length === 0 ? (
                    <p className="p-6 text-center text-sm text-muted-foreground">या गटासाठी मतदान नोंदी नाहीत</p>
                  ) : (
                    <div className="divide-y">
                      {rows.map((r, i) => {
                        const pct = maxWeighted > 0 ? Math.round((r.weighted / maxWeighted) * 100) : 0;
                        return (
                          <div key={r.id} className="px-3 py-3 hover:bg-muted/40 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`h-9 w-9 rounded-md flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                                i < 3 ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white" : "bg-muted text-foreground"
                              }`}>{i + 1}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-sm">{r.entry_code}</span>
                                </div>
                                <Progress value={pct} className="h-2 mt-1.5" />
                              </div>
                              <div className="text-right flex-shrink-0 w-28">
                                <p className="text-lg font-bold text-primary leading-none">{r.weighted}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  {r.first}·{r.second}·{r.third} = {r.total}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <p className="text-[11px] text-muted-foreground text-center">
                गुण-गणना: (१ले × ३) + (२रे × २) + (३रे × १) · Tie-breaker: अधिक १ले मते · सहभागी नावे लॉक होईपर्यंत गुप्त
              </p>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
};

export default VoteResults;
