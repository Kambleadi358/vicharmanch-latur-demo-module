// Public: cast vote (1st/2nd/3rd) per category. DB-enforced uniqueness on (comp,category,phone)
// and (comp,category,fingerprint). Validates competition is LOCKED.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const isUUID = (s: unknown) =>
  typeof s === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const {
      competition_id, category, voter_phone, device_fingerprint,
      first_entry_id, second_entry_id, third_entry_id,
    } = body ?? {};

    // Validate
    if (!isUUID(competition_id)) return jsonRes({ error: "अवैध स्पर्धा" }, 400);
    if (!["chota", "motha", "khula"].includes(category)) return jsonRes({ error: "अवैध गट" }, 400);
    if (!isUUID(first_entry_id) || !isUUID(second_entry_id) || !isUUID(third_entry_id)) {
      return jsonRes({ error: "तीनही क्रमांकांसाठी निवड करा" }, 400);
    }
    if (new Set([first_entry_id, second_entry_id, third_entry_id]).size !== 3) {
      return jsonRes({ error: "तीन वेगवेगळ्या entries निवडा" }, 400);
    }
    const phone = String(voter_phone ?? "").replace(/\D/g, "");
    if (phone.length < 10 || phone.length > 15) return jsonRes({ error: "वैध मोबाइल नंबर द्या" }, 400);
    const fp = String(device_fingerprint ?? "").slice(0, 128);
    if (fp.length < 5) return jsonRes({ error: "device verify अयशस्वी" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Confirm competition is LOCKED (single indexed lookup)
    const { data: competition } = await supabase
      .from("competitions")
      .select("id, status")
      .eq("id", competition_id)
      .maybeSingle();
    if (!competition) return jsonRes({ error: "स्पर्धा सापडली नाही" }, 404);
    if (competition.status !== "LOCKED") {
      return jsonRes({ error: "मतदान फक्त स्पर्धा lock झाल्यानंतरच सुरू होते" }, 409);
    }

    // Insert; rely on unique constraints to atomically prevent duplicates under load.
    const { error } = await supabase.from("public_votes").insert({
      competition_id, category, voter_phone: phone, device_fingerprint: fp,
      first_entry_id, second_entry_id, third_entry_id,
    });

    if (error) {
      // 23505 = unique_violation → user already voted in this program
      if ((error as any).code === "23505" || /duplicate|unique/i.test(error.message)) {
        return jsonRes({ error: "तुम्ही या स्पर्धेत आधीच मतदान केले आहे", duplicate: true }, 409);
      }
      throw error;
    }
    return jsonRes({ ok: true });
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
