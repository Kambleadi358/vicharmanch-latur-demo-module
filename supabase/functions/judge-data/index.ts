// Judge: fetch entries (no participant_name) + own scores. Incremental sync via ?since=ISO.
// - Filters by competition_id when provided (avoids shipping all comps).
// - Returns lightweight payload with `server_time` so client can request only changes next poll.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-judge-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const token = req.headers.get("x-judge-token");
    if (!token) return jsonRes({ error: "no token" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: session } = await supabase
      .from("judge_sessions")
      .select("judge_id, expires_at, judges(id, judge_code, display_name, is_active)")
      .eq("token", token)
      .maybeSingle();

    if (!session || new Date(session.expires_at) < new Date()) {
      return jsonRes({ error: "session expired" }, 401);
    }
    const judge: any = session.judges;
    if (!judge?.is_active) return jsonRes({ error: "inactive" }, 403);

    const url = new URL(req.url);
    const competition_id = url.searchParams.get("competition_id");
    const sinceParam = url.searchParams.get("since");
    const since = sinceParam ? new Date(sinceParam) : null;
    const serverTime = new Date().toISOString();

    // Always send the lean competitions list (cheap, indexed)
    let compQuery = supabase
      .from("competitions")
      .select("id, name, status, program_id, updated_at")
      .eq("is_visible", true)
      .order("created_at", { ascending: false });
    if (competition_id) compQuery = compQuery.eq("id", competition_id);
    const { data: comps } = await compQuery;

    const compIds = (comps ?? []).map((c) => c.id);
    if (compIds.length === 0) {
      return jsonRes({
        judge: { id: judge.id, judge_code: judge.judge_code, display_name: judge.display_name },
        competitions: [], entries: [], scores: [], server_time: serverTime, full: !since,
      });
    }

    // Entries (HIDE participant_name). On incremental polls, only fetch new ones.
    let entriesQ = supabase
      .from("competition_entries")
      .select("id, competition_id, entry_code, category, image_url, created_at")
      .in("competition_id", compIds)
      .order("created_at", { ascending: true });
    if (since) entriesQ = entriesQ.gt("created_at", since.toISOString());
    const { data: entries } = await entriesQ;

    // Judge's own scores (incremental: only changed since last poll)
    let scoresQ = supabase
      .from("judge_scores")
      .select("id, entry_id, competition_id, category, marks, is_submitted, updated_at")
      .eq("judge_id", judge.id);
    if (since) scoresQ = scoresQ.gt("updated_at", since.toISOString());
    const { data: scores } = await scoresQ;

    return jsonRes({
      judge: { id: judge.id, judge_code: judge.judge_code, display_name: judge.display_name },
      competitions: comps ?? [],
      entries: entries ?? [],
      scores: scores ?? [],
      server_time: serverTime,
      full: !since,
    });
  } catch (e) {
    return jsonRes({ error: String((e as Error).message ?? e) }, 500);
  }
});

function jsonRes(d: unknown, status = 200) {
  return new Response(JSON.stringify(d), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
