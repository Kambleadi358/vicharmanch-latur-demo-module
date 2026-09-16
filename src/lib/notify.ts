// Client-side helper: notify subscribers when admin publishes something.
// Calls the send-push-notification edge function (admin JWT required).
import { supabase } from "@/integrations/supabase/client";

export interface NotifyInput {
  title: string;
  body?: string;
  link?: string;
  category?: "notice" | "program" | "quiz" | "accounts" | "spardha" | "general";
}

// Fire-and-forget: pushes are best-effort and must never block the
// admin action that triggered them.
export function notifySubscribers(input: NotifyInput) {
  supabase.functions
    .invoke("send-push-notification", {
      body: {
        title: input.title,
        body: input.body ?? "",
        link: input.link ?? null,
        category: input.category ?? "general",
      },
    })
    .then((res) => {
      if (res.error) {
        // eslint-disable-next-line no-console
        console.warn("push notify failed:", res.error.message);
      }
    })
    .catch(() => {
      /* non-fatal */
    });
}
