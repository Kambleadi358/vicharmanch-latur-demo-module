// Edge function: start or resume a quiz session
// - Validates name + DOB
// - Checks quiz status = ACTIVE
// - If session exists: returns it (resume) ELSE creates a new session with shuffled questions/options
// - Never leaks correct_answer

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { participant_name, dob } = await req.json();

    if (!participant_name || typeof participant_name !== "string" || participant_name.trim().length < 2) {
      return new Response(JSON.stringify({ error: "नाव आवश्यक आहे" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      return new Response(JSON.stringify({ error: "जन्मतारीख आवश्यक आहे" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const name = participant_name.trim();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check quiz config
    const { data: config } = await supabase.from("quiz_config").select("*").limit(1).maybeSingle();
    if (!config) {
      return new Response(JSON.stringify({ error: "प्रश्नमंजुषा कॉन्फिगर केलेली नाही" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (config.status !== "ACTIVE") {
      return new Response(
        JSON.stringify({ error: "प्रश्नमंजुषा सध्या सक्रिय नाही", status: config.status }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Look up existing session
    const { data: existing } = await supabase
      .from("quiz_sessions")
      .select("*")
      .eq("participant_name", name)
      .eq("dob", dob)
      .maybeSingle();

    let session = existing;

    if (existing && existing.status !== "in_progress") {
      return new Response(
        JSON.stringify({ error: "तुम्ही ही प्रश्नमंजुषा आधीच पूर्ण केली आहे", already_submitted: true }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!session) {
      // Build a new session
      const { data: questions } = await supabase
        .from("quiz_questions")
        .select("id")
        .order("display_order", { ascending: true });

      if (!questions || questions.length === 0) {
        return new Response(JSON.stringify({ error: "प्रश्न उपलब्ध नाहीत" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const order = shuffle(questions.map((q) => q.id));
      const optionOrders: Record<string, string[]> = {};
      for (const qid of order) {
        optionOrders[qid] = shuffle(["A", "B", "C", "D"]);
      }

      const { data: created, error: insErr } = await supabase
        .from("quiz_sessions")
        .insert({
          participant_name: name,
          dob,
          question_order: order,
          option_orders: optionOrders,
          duration_seconds: config.duration_seconds,
          total_questions: order.length,
          ip_address: req.headers.get("x-forwarded-for") ?? null,
          user_agent: req.headers.get("user-agent") ?? null,
        })
        .select("*")
        .single();

      if (insErr) {
        return new Response(JSON.stringify({ error: insErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      session = created;
    }

    // Fetch questions in saved order, WITHOUT correct_answer
    const order: string[] = (session!.question_order as string[]) ?? [];
    const { data: qs } = await supabase
      .from("quiz_questions")
      .select("id, question, option_a, option_b, option_c, option_d, marks")
      .in("id", order);

    const byId = new Map((qs ?? []).map((q) => [q.id, q]));
    const orderedQuestions = order
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((q: any) => {
        const optOrder: string[] = session!.option_orders[q.id] ?? ["A", "B", "C", "D"];
        const labelMap: Record<string, string> = {
          A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d,
        };
        return {
          id: q.id,
          question: q.question,
          marks: q.marks,
          options: optOrder.map((label) => ({ key: label, text: labelMap[label] })),
        };
      });

    // Fetch already-saved answers
    const { data: savedAnswers } = await supabase
      .from("quiz_answers")
      .select("question_id, selected_option, time_spent_seconds")
      .eq("session_id", session!.id);

    // Compute server time-left
    const startMs = new Date(session!.start_time).getTime();
    const elapsed = Math.floor((Date.now() - startMs) / 1000);
    const timeLeft = Math.max(0, session!.duration_seconds - elapsed);

    return new Response(
      JSON.stringify({
        session_id: session!.id,
        current_index: session!.current_index,
        time_left: timeLeft,
        duration_seconds: session!.duration_seconds,
        start_time: session!.start_time,
        questions: orderedQuestions,
        saved_answers: savedAnswers ?? [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (e) {
    console.error("quiz-start error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
