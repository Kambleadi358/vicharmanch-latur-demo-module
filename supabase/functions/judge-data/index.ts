// Judge: fetch all entries (no participant_name) + own scores. Auth via token.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-judge-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    // Open competitions (status = OPEN, visible)
    let compQuery = supabase
      .from("competitions")
      .select("id, name, status, program_id")
      .eq("is_visible", true)
      .order("created_at", { ascending: false });
    if (competition_id) compQuery = compQuery.eq("id", competition_id);
    const { data: comps } = await compQuery;

    // Entries (HIDE participant_name)
    const compIds = (comps ?? []).map((c) => c.id);
    const { data: entries } = compIds.length
      ? await supabase
          .from("competition_entries")
          .select("id, competition_id, entry_code, category, image_url, created_at")
          .in("competition_id", compIds)
          .order("created_at", { ascending: true })
      : { data: [] };

    // Judge's own scores
    const { data: scores } = await supabase
      .from("judge_scores")
      .select("id, entry_id, competition_id, category, marks, is_submitted")
      .eq("judge_id", judge.id);

    return jsonRes({
      judge: { id: judge.id, judge_code: judge.judge_code, display_name: judge.display_name },
      competitions: comps ?? [],
      entries: entries ?? [],
      scores: scores ?? [],
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
