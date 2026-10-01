// Turns database errors into the real, human reason (Marathi).
export function explainDbError(err: { message?: string; code?: string } | null | undefined): string {
  const msg = err?.message || "";
  if (/archived/i.test(msg)) {
    return "ही नोंद (किंवा तिच्याशी जोडलेली नोंद) वार्षिक अभिलेखागारात संग्रहित आहे — ती बदलता/हटवता येत नाही. आवश्यक असल्यास सेटिंग्ज → वार्षिक अभिलेखागार मधून ते वर्ष पुन्हा उघडा.";
  }
  if (err?.code === "23503" || /foreign key/i.test(msg)) {
    return "या नोंदीशी इतर नोंदी जोडलेल्या असल्याने हटवता येत नाही.";
  }
  if (err?.code === "42501" || /permission|row-level security/i.test(msg)) {
    return "ही क्रिया करण्याची परवानगी नाही (फक्त व्यवस्थापक).";
  }
  return "त्रुटी: " + (msg || "अज्ञात");
}

export const ARCHIVED_LABEL = "संग्रहित";
export const ARCHIVED_HINT = "संग्रहित नोंद — फक्त वाचनासाठी";
