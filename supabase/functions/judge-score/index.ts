// Judge: save (draft) or submit (lock) score for an entry
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
      .select("judge_id, expires_at")
      .eq("token", token)
      .maybeSingle();
    if (!session || new Date(session.expires_at) < new Date()) {
      return jsonRes({ error: "session expired" }, 401);
    }
    const judge_id = session.judge_id;

    const body = await req.json();
    const action = body.action as "save" | "submit_category";

    if (action === "save") {
      const { entry_id, marks } = body;
      if (!entry_id || marks === undefined) return jsonRes({ error: "missing fields" }, 400);
      const m = Number(marks);
      if (Number.isNaN(m) || m < 0 || m > 10) return jsonRes({ error: "0-10 दरम्यान गुण द्या" }, 400);

      // Look up entry meta
      const { data: entry } = await supabase
        .from("competition_entries")
        .select("id, competition_id, category")
        .eq("id", entry_id)
        .maybeSingle();
      if (!entry) return jsonRes({ error: "entry not found" }, 404);

      // Reject if existing score is already submitted
      const { data: existing } = await supabase
        .from("judge_scores")
        .select("id, is_submitted")
        .eq("judge_id", judge_id)
        .eq("entry_id", entry_id)
        .maybeSingle();
      if (existing?.is_submitted) return jsonRes({ error: "हा score आधीच submit झालाय" }, 409);

      const { error } = await supabase.from("judge_scores").upsert(
        {
          judge_id,
          entry_id,
          competition_id: entry.competition_id,
          category: entry.category,
          marks: m,
          is_submitted: false,
        },
        { onConflict: "judge_id,entry_id" }
      );
      if (error) throw error;
      return jsonRes({ ok: true });
    }

    if (action === "submit_category") {
      const { competition_id, category } = body;
      if (!competition_id || !category) return jsonRes({ error: "missing" }, 400);

      // Make sure judge has scored ALL entries in this category
      const { data: entries } = await supabase
        .from("competition_entries")
        .select("id")
        .eq("competition_id", competition_id)
        .eq("category", category);
      const { data: scored } = await supabase
        .from("judge_scores")
        .select("entry_id, is_submitted")
        .eq("judge_id", judge_id)
        .eq("competition_id", competition_id)
        .eq("category", category);

      const totalEntries = entries?.length ?? 0;
      const scoredIds = new Set((scored ?? []).map((s) => s.entry_id));
      const allScored = (entries ?? []).every((e) => scoredIds.has(e.id));
      if (totalEntries === 0) return jsonRes({ error: "या category त entries नाहीत" }, 400);
      if (!allScored) return jsonRes({ error: "सर्व entries ला गुण द्या मगच submit करा" }, 400);

      const { error } = await supabase
        .from("judge_scores")
        .update({ is_submitted: true })
        .eq("judge_id", judge_id)
        .eq("competition_id", competition_id)
        .eq("category", category);
      if (error) throw error;
      return jsonRes({ ok: true });
    }

    return jsonRes({ error: "unknown action" }, 400);
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
