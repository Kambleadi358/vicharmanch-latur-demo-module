// Submit (or auto-submit on timeout) a quiz session, compute score, run cheating heuristics.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { session_id, auto } = await req.json();
    if (!session_id) {
      return new Response(JSON.stringify({ error: "Missing session_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: session } = await supabase
      .from("quiz_sessions")
      .select("*")
      .eq("id", session_id)
      .maybeSingle();
    if (!session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (session.status !== "in_progress") {
      // already submitted — return existing
      return new Response(
        JSON.stringify({
          ok: true,
          score: session.score,
          total_marks: session.total_marks,
          total_questions: session.total_questions,
          already_submitted: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Compute totals
    const { data: questions } = await supabase.from("quiz_questions").select("id, marks, correct_answer");
    const totalMarks = (questions ?? []).reduce((s, q) => s + (q.marks ?? 1), 0);

    const { data: answers } = await supabase
      .from("quiz_answers")
      .select("question_id, selected_option, is_correct, time_spent_seconds")
      .eq("session_id", session_id);

    let score = 0;
    for (const a of answers ?? []) {
      const q = questions?.find((x) => x.id === a.question_id);
      if (q && a.selected_option === q.correct_answer) score += q.marks ?? 1;
    }

    const startMs = new Date(session.start_time).getTime();
    const timeTaken = Math.min(
      Math.floor((Date.now() - startMs) / 1000),
      session.duration_seconds
    );

    // Cheating heuristics
    const reasons: string[] = [];
    if ((session.tab_switches ?? 0) >= 5) reasons.push("HIGH_TAB_SWITCHES");
    if ((session.paste_attempts ?? 0) > 0) reasons.push("PASTE_ATTEMPT");
    const fastAnswers = (answers ?? []).filter((a) => (a.time_spent_seconds ?? 0) < 2 && a.selected_option).length;
    if (fastAnswers >= Math.max(5, Math.floor((answers?.length ?? 0) * 0.5))) {
      reasons.push("UNREALISTIC_SPEED");
    }
    let risk = "NORMAL";
    if (reasons.length === 1) risk = "SUSPICIOUS";
    if (reasons.length >= 2) risk = "HIGH_RISK";

    await supabase
      .from("quiz_sessions")
      .update({
        status: auto ? "auto_submitted" : "submitted",
        score,
        total_marks: totalMarks,
        total_questions: questions?.length ?? 0,
        time_taken_seconds: timeTaken,
        end_time: new Date().toISOString(),
        risk_level: risk,
        risk_reasons: reasons,
      })
      .eq("id", session_id);

    return new Response(
      JSON.stringify({
        ok: true,
        score,
        total_marks: totalMarks,
        total_questions: questions?.length ?? 0,
        time_taken: timeTaken,
        risk_level: risk,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (e) {
    console.error("quiz-submit error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
