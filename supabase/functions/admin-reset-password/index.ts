// Cost-free admin password recovery using security questions (no SMS/email OTP).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (d: unknown, status = 200) =>
  new Response(JSON.stringify(d), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

async function hashAnswer(userId: string, answer: string) {
  const bytes = new TextEncoder().encode(`${userId}|${normalize(answer)}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { action, email, answers, new_password } = (await req.json().catch(() => ({}))) as any;
    const mail = String(email ?? "").trim().toLowerCase();
    if (!mail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) return json({ error: "वैध ईमेल द्या" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Resolve user by email
    const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const user = list?.users?.find((u) => (u.email ?? "").toLowerCase() === mail);
    const generic = { error: "या ईमेलसाठी सुरक्षा प्रश्न सेट केलेले नाहीत" };
    if (!user) return json(generic, 404);

    const { data: row } = await supabase
      .from("admin_security_questions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!row) return json(generic, 404);

    if (action === "questions") {
      return json({ questions: [row.q1, row.q2, row.q3] });
    }

    if (action === "reset") {
      const a = Array.isArray(answers) ? answers.map((x: unknown) => String(x ?? "")) : [];
      if (a.length !== 3 || a.some((x) => normalize(x).length < 1)) {
        return json({ error: "तीनही उत्तरे भरा" }, 400);
      }
      const pwd = String(new_password ?? "");
      if (pwd.length < 8) return json({ error: "पासवर्ड किमान ८ अक्षरांचा असावा" }, 400);

      const hashes = await Promise.all(a.map((x) => hashAnswer(user.id, x)));
      const ok = hashes[0] === row.a1_hash && hashes[1] === row.a2_hash && hashes[2] === row.a3_hash;
      if (!ok) return json({ error: "उत्तरे जुळत नाहीत" }, 401);

      const { error: uErr } = await supabase.auth.admin.updateUserById(user.id, { password: pwd });
      if (uErr) return json({ error: uErr.message }, 400);

      await supabase.from("admin_activity_logs").insert({
        actor_user_id: user.id,
        actor_email: mail,
        action: "password_reset_security_questions",
        entity_type: "auth",
        entity_id: user.id,
      });

      return json({ ok: true });
    }

    return json({ error: "अवैध विनंती" }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});
