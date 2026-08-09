import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SRC = "https://raw.githubusercontent.com/civictech-India/constitution-of-india/main/constitution_of_india.json";

const PARTS: [string, string, number][] = [
  ["I", "संघ आणि त्याचे राज्यक्षेत्र", 1],
  ["II", "नागरिकत्व", 2],
  ["III", "मूलभूत अधिकार", 3],
  ["IV", "राज्याच्या धोरणाची निदेशक तत्त्वे", 4],
  ["IVA", "मूलभूत कर्तव्ये", 5],
  ["V", "संघराज्य", 6],
  ["VI", "राज्ये", 7],
  ["VII", "पहिल्या अनुसूचीतील ब वर्गातील राज्ये (निरसित)", 8],
  ["VIII", "संघराज्य क्षेत्रे", 9],
  ["IX", "पंचायती", 10],
  ["IXA", "नगरपालिका", 11],
  ["IXB", "सहकारी संस्था", 12],
  ["X", "अनुसूचित व जनजाती क्षेत्रे", 13],
  ["XI", "संघ व राज्ये यांतील संबंध", 14],
  ["XII", "वित्त, मालमत्ता, करार व दावे", 15],
  ["XIII", "भारताच्या राज्यक्षेत्रातील व्यापार व वाणिज्य", 16],
  ["XIV", "संघ व राज्यांच्या अधिपत्याखालील सेवा", 17],
  ["XIVA", "न्यायाधिकरणे", 18],
  ["XV", "निवडणुका", 19],
  ["XVI", "विशिष्ट वर्गांसंबंधी विशेष तरतुदी", 20],
  ["XVII", "राजभाषा", 21],
  ["XVIII", "आणीबाणीविषयक तरतुदी", 22],
  ["XIX", "संकीर्ण", 23],
  ["XX", "संविधान दुरुस्ती", 24],
  ["XXI", "तात्पुरत्या, संक्रमणकालीन व विशेष तरतुदी", 25],
  ["XXII", "संक्षिप्त नाव, प्रारंभ व निरसन", 26],
];

function partOf(n: number, s: string): string {
  if (n <= 4) return "I";
  if (n <= 11) return "II";
  if (n <= 35) return "III";
  if (n === 51 && s === "A") return "IVA";
  if (n <= 51) return "IV";
  if (n <= 151) return "V";
  if (n <= 237) return "VI";
  if (n === 238) return "VII";
  if (n <= 242) return "VIII";
  if (n === 243) {
    if (s === "" || (s.length === 1 && s <= "O")) return "IX";
    if ((s.length === 1 && s <= "Z") || (s.startsWith("Z") && s <= "ZG")) return "IXA";
    return "IXB";
  }
  if (n <= 244) return "X";
  if (n <= 263) return "XI";
  if (n <= 300) return "XII";
  if (n <= 307) return "XIII";
  if (n <= 322) return "XIV";
  if (n === 323) return s ? "XIVA" : "XIV";
  if (n <= 329) return "XV";
  if (n <= 342) return "XVI";
  if (n <= 351) return "XVII";
  if (n <= 360) return "XVIII";
  if (n <= 367) return "XIX";
  if (n === 368) return "XX";
  if (n <= 392) return "XXI";
  return "XXII";
}

function sortKey(n: number, s: string): number {
  let v = 0;
  if (s.length === 1) v = s.charCodeAt(0) - 64;
  else if (s.length === 2) v = (s.charCodeAt(0) - 64) * 26 + (s.charCodeAt(1) - 64);
  return Math.round((n + v / 1000) * 10000) / 10000;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const res = await fetch(SRC);
  if (!res.ok) return new Response(JSON.stringify({ error: `source fetch failed ${res.status}` }), { status: 502 });
  const data = await res.json() as { article: number | string; title: string; description: string }[];

  const skipped: string[] = [];
  const partRows = PARTS.map(([code, name, order]) => ({ part_code: code, name_mr: name, display_order: order, is_active: true }));
  const { error: pErr } = await admin.from("constitution_parts").upsert(partRows, { onConflict: "part_code" });
  if (pErr) return new Response(JSON.stringify({ error: pErr.message }), { status: 500 });

  const { data: parts } = await admin.from("constitution_parts").select("id, part_code");
  const partMap = new Map((parts || []).map((p: any) => [p.part_code, p.id]));

  const rows: any[] = [];
  for (const x of data) {
    const num = String(x.article).replace(/\s+/g, "");
    if (num === "0") continue;
    const m = /^(\d+)([A-Z]*)$/.exec(num);
    const title = (x.title || "").trim();
    const text = (x.description || "").trim();
    if (!m || !title || title.length > 500 || !text) { skipped.push(num); continue; }
    const n = parseInt(m[1], 10);
    const s = m[2];
    const pid = partMap.get(partOf(n, s));
    if (!pid) { skipped.push(num); continue; }
    rows.push({
      article_number: num,
      sort_key: sortKey(n, s),
      part_id: pid,
      title_en: title,
      official_text_en: text,
      display_order: Math.round(sortKey(n, s) * 10),
      is_active: true,
    });
  }

  let inserted = 0, updated = 0;
  for (const r of rows) {
    const { data: existing } = await admin.from("constitution_articles").select("id").eq("article_number", r.article_number).maybeSingle();
    if (existing) {
      const { error } = await admin.from("constitution_articles")
        .update({ title_en: r.title_en, official_text_en: r.official_text_en, part_id: r.part_id, sort_key: r.sort_key, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (error) skipped.push(r.article_number); else updated++;
    } else {
      const { error } = await admin.from("constitution_articles").insert({ ...r, title_mr: r.title_en });
      if (error) skipped.push(r.article_number); else inserted++;
    }
  }

  return new Response(JSON.stringify({ source: SRC, total: rows.length, inserted, updated, skipped }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
});
