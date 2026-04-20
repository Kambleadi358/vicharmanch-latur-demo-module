// Save (autosave) a single answer, idempotent upsert
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
    const { session_id, question_id, selected_option, time_spent_seconds, current_index, tab_switches } =
      await req.json();

    if (!session_id || !question_id) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (selected_option && !["A", "B", "C", "D"].includes(selected_option)) {
      return new Response(JSON.stringify({ error: "Invalid option" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify session is in progress and not expired
    const { data: session } = await supabase
      .from("quiz_sessions")
      .select("id, start_time, duration_seconds, status")
      .eq("id", session_id)
      .maybeSingle();

    if (!session || session.status !== "in_progress") {
      return new Response(JSON.stringify({ error: "Session not active", expired: true }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const elapsed = Math.floor((Date.now() - new Date(session.start_time).getTime()) / 1000);
    if (elapsed > session.duration_seconds) {
      return new Response(JSON.stringify({ error: "Time expired", expired: true }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up correct answer (server-side; never trust client)
    const { data: q } = await supabase
      .from("quiz_questions")
      .select("correct_answer")
      .eq("id", question_id)
      .maybeSingle();

    const isCorrect = q && selected_option ? q.correct_answer === selected_option : false;

    // Upsert answer
    const { error: ansErr } = await supabase.from("quiz_answers").upsert(
      {
        session_id,
        question_id,
        selected_option: selected_option ?? null,
        is_correct: isCorrect,
        time_spent_seconds: time_spent_seconds ?? 0,
        answered_at: new Date().toISOString(),
      },
      { onConflict: "session_id,question_id" }
    );
    if (ansErr) {
      return new Response(JSON.stringify({ error: ansErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update session progress
    const updates: Record<string, unknown> = {};
    if (typeof current_index === "number") updates.current_index = current_index;
    if (typeof tab_switches === "number") updates.tab_switches = tab_switches;
    if (Object.keys(updates).length > 0) {
      await supabase.from("quiz_sessions").update(updates).eq("id", session_id);
    }

    return new Response(JSON.stringify({ ok: true, time_left: session.duration_seconds - elapsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    console.error("quiz-save-answer error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
