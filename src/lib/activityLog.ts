import { supabase } from "@/integrations/supabase/client";

/**
 * Log an admin action. Best-effort: failures are swallowed (UI must not break on logging).
 * Used by Module 5: Admin Activity Log.
 */
export async function logAdminAction(
  action: string,
  entity_type?: string,
  entity_id?: string,
  details?: Record<string, unknown>,
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("admin_activity_logs").insert({
      actor_user_id: user.id,
      actor_email: user.email ?? null,
      action,
      entity_type: entity_type ?? null,
      entity_id: entity_id ?? null,
      details: (details as any) ?? null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
  } catch {
    /* swallow */
  }
}
