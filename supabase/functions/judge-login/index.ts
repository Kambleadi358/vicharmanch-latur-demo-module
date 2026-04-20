// Public: judge logs in with judge_code + password → returns session token
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { judge_code, password } = await req.json();
    if (!judge_code || !password) return jsonRes({ error: "judge_code व password आवश्यक" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: judge, error } = await supabase
      .from("judges")
      .select("id, judge_code, display_name, password_hash, is_active")
      .eq("judge_code", judge_code.toUpperCase())
      .maybeSingle();

    if (error || !judge) return jsonRes({ error: "अवैध Judge ID किंवा पासवर्ड" }, 401);
    if (!judge.is_active) return jsonRes({ error: "हे न्यायाधीश खाते निष्क्रिय आहे" }, 403);

    const ok = await bcrypt.compare(password, judge.password_hash);
    if (!ok) return jsonRes({ error: "अवैध Judge ID किंवा पासवर्ड" }, 401);

    // Create session token (allow multiple logins → don't invalidate old)
    const token = crypto.randomUUID() + "." + crypto.randomUUID();
    await supabase.from("judge_sessions").insert({ judge_id: judge.id, token });

    return jsonRes({
      token,
      judge: { id: judge.id, judge_code: judge.judge_code, display_name: judge.display_name },
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
