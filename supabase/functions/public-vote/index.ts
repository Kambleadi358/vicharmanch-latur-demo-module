// Public: cast vote (1st/2nd/3rd) per category. Dedup on phone+fingerprint.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const {
      competition_id,
      category,
      voter_phone,
      device_fingerprint,
      first_entry_id,
      second_entry_id,
      third_entry_id,
    } = body;

    if (!competition_id || !category || !voter_phone || !device_fingerprint) {
      return jsonRes({ error: "सर्व आवश्यक फील्ड भरा" }, 400);
    }
    const phone = String(voter_phone).replace(/\D/g, "");
    if (phone.length < 10) return jsonRes({ error: "वैध मोबाइल नंबर द्या" }, 400);

    if (!first_entry_id || !second_entry_id || !third_entry_id) {
      return jsonRes({ error: "तीनही क्रमांकांसाठी निवड करा" }, 400);
    }
    const set = new Set([first_entry_id, second_entry_id, third_entry_id]);
    if (set.size !== 3) return jsonRes({ error: "तीन वेगवेगळ्या entries निवडा" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: competition } = await supabase
      .from("competitions")
      .select("id, status")
      .eq("id", competition_id)
      .maybeSingle();
    if (!competition) return jsonRes({ error: "स्पर्धा सापडली नाही" }, 404);
    if (competition.status !== "LOCKED") {
      return jsonRes({ error: "मतदान फक्त स्पर्धा lock झाल्यानंतरच सुरू होते" }, 409);
    }

    // Pre-check: did this phone OR this device already vote in this category?
    const { data: existing } = await supabase
      .from("public_votes")
      .select("id")
      .eq("competition_id", competition_id)
      .eq("category", category)
      .or(`voter_phone.eq.${phone},device_fingerprint.eq.${device_fingerprint}`)
      .maybeSingle();
    if (existing) return jsonRes({ error: "तुम्ही या category मध्ये आधीच मतदान केले आहे" }, 409);

    const { error } = await supabase.from("public_votes").insert({
      competition_id,
      category,
      voter_phone: phone,
      device_fingerprint,
      first_entry_id,
      second_entry_id,
      third_entry_id,
    });
    if (error) {
      if (String(error.message).includes("duplicate")) {
        return jsonRes({ error: "तुम्ही आधीच मतदान केले आहे" }, 409);
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
