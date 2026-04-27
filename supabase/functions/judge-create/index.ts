// Admin-only: create judge with auto-generated code + password
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonRes({ error: "unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is admin
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return jsonRes({ error: "unauthorized" }, 401);

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) return jsonRes({ error: "forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const display_name = (body.display_name ?? "").toString().trim();
    const competition_id = body.competition_id ? String(body.competition_id) : null;
    if (!display_name) return jsonRes({ error: "display_name आवश्यक" }, 400);

    // Generate readable password: J + 6 chars
    const password = generatePassword(8);
    const password_hash = await bcrypt.hash(password, 10);

    // Retry up to 5 times in case next_judge_code returns a duplicate (race condition)
    let judge: any = null;
    let lastError: any = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: codeData, error: codeErr } = await supabase.rpc("next_judge_code");
      if (codeErr) throw codeErr;
      const judge_code = codeData as string;

      const { data, error } = await supabase
        .from("judges")
        .insert({ judge_code, display_name, password_hash, competition_id })
        .select("id, judge_code, display_name, is_active, competition_id, created_at")
        .single();

      if (!error) {
        judge = data;
        break;
      }
      lastError = error;
      // 23505 = unique_violation; retry. Otherwise bail out.
      if ((error as any).code !== "23505") throw error;
    }
    if (!judge) throw lastError ?? new Error("judge_code निर्माण करता आले नाही");

    return jsonRes({ judge, plain_password: password });
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
function generatePassword(len: number) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let p = "";
  const a = new Uint8Array(len);
  crypto.getRandomValues(a);
  for (let i = 0; i < len; i++) p += chars[a[i] % chars.length];
  return p;
}
