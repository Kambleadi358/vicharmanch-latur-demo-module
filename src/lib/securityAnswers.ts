// Deterministic hashing for admin security-question answers.
// Must stay byte-identical with supabase/functions/admin-reset-password/index.ts
export const normalizeAnswer = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

export async function hashAnswer(userId: string, answer: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${userId}|${normalizeAnswer(answer)}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const SECURITY_QUESTION_OPTIONS = [
  "तुमच्या आईचे पूर्ण नाव काय आहे?",
  "तुमचे जन्मगाव कोणते?",
  "तुमच्या पहिल्या शाळेचे नाव काय?",
  "तुमचा आवडता ग्रंथ कोणता?",
  "तुमच्या लहानपणीच्या जिवलग मित्राचे नाव?",
  "विचारमंचाच्या पहिल्या कार्यक्रमाचे ठिकाण?",
  "तुमच्या वडिलांचे टोपणनाव काय?",
  "तुमचा आवडता विचारवंत कोण?",
];
