// Fetch a participant's result + (when admin published) answer key comparison
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
    const url = new URL(req.url);
    const session_id = url.searchParams.get("session_id");
    const name = url.searchParams.get("name");
    const dob = url.searchParams.get("dob");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let session: any = null;
    if (session_id) {
      const { data } = await supabase.from("quiz_sessions").select("*").eq("id", session_id).maybeSingle();
      session = data;
    } else if (name && dob) {
      // Case-insensitive + trim-tolerant name match; latest session wins
      const { data } = await supabase
        .from("quiz_sessions")
        .select("*")
        .ilike("participant_name", name.trim())
        .eq("dob", dob)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      session = data;
    }

    if (!session) {
      return new Response(JSON.stringify({ error: "Result not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: config } = await supabase.from("quiz_config").select("status, publish_answer_key, title").limit(1).maybeSingle();
    const showAnswerKey = config?.status === "COMPLETED" && config?.publish_answer_key;

    const { data: answers } = await supabase
      .from("quiz_answers")
      .select("question_id, selected_option, is_correct, time_spent_seconds")
      .eq("session_id", session.id);

    let breakdown: any[] = [];
    if (showAnswerKey) {
      const order: string[] = (session.question_order as string[]) ?? [];
      const { data: qs } = await supabase
        .from("quiz_questions")
        .select("id, question, option_a, option_b, option_c, option_d, correct_answer, marks")
        .in("id", order);
      const byId = new Map((qs ?? []).map((q) => [q.id, q]));
      const ansById = new Map((answers ?? []).map((a) => [a.question_id, a]));
      breakdown = order.map((qid) => {
        const q: any = byId.get(qid);
        const a: any = ansById.get(qid);
        return q
          ? {
              question: q.question,
              options: { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d },
              correct: q.correct_answer,
              your_answer: a?.selected_option ?? null,
              is_correct: !!a?.is_correct,
              marks: q.marks,
            }
          : null;
      }).filter(Boolean);
    }

    const percentage = session.total_marks > 0
      ? Math.round((session.score / session.total_marks) * 1000) / 10
      : 0;

    return new Response(
      JSON.stringify({
        participant_name: session.participant_name,
        dob: session.dob,
        score: session.score,
        total_marks: session.total_marks,
        total_questions: session.total_questions,
        time_taken: session.time_taken_seconds,
        percentage,
        status: session.status,
        quiz_status: config?.status ?? "UPCOMING",
        show_answer_key: showAnswerKey,
        breakdown,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (e) {
    console.error("quiz-result error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
