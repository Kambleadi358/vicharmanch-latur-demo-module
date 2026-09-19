import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

// Broadcast a push notification to every registered FCM token.
// Admin-only: validates the caller's JWT and has_role('admin').
// Persists the message to public.notifications so the in-app center
// also shows it, then fans the push out to all device tokens.

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL") ?? "";
// On Lovable Cloud the project id is exposed for edge functions.
const PROJECT_ID = Deno.env.get("VITE_SUPABASE_PROJECT_ID") ?? Deno.env.get("SUPABASE_PROJECT_ID") ?? "";
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/firebase_messaging";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const FIREBASE_API_KEY = Deno.env.get("FIREBASE_MESSAGING_API_KEY");

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function isAdmin(req: Request): Promise<{ ok: boolean; userId?: string }> {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return { ok: false };
  const token = auth.slice(7);

  const url = SUPABASE_URL || `https://${PROJECT_ID}.supabase.co`;
  const admin = createClient(url, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: ud, error } = await admin.auth.getUser();
  if (error || !ud.user) return { ok: false };

  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", ud.user.id)
    .eq("role", "admin");
  if (!roles || roles.length === 0) return { ok: false };
  return { ok: true, userId: ud.user.id };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await isAdmin(req);
  if (!auth.ok) {
    return json({ error: "unauthorized" }, 401);
  }

  let payload: { title?: string; body?: string; link?: string; category?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }
  const title = (payload.title ?? "").trim();
  const body = (payload.body ?? "").trim();
  const link = payload.link ?? null;
  const category = payload.category ?? "general";
  if (!title) return json({ error: "title required" }, 400);

  // Use the caller's own JWT (admin) for DB writes/reads — RLS allows
  // admin to insert notifications and read all push tokens. No service
  // role key is available on Lovable Cloud, so we cannot bypass RLS.
  const url = SUPABASE_URL || `https://${PROJECT_ID}.supabase.co`;
  const callerToken = req.headers.get("Authorization")!.slice(7);
  const adminClient = createClient(url, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${callerToken}` } },
  });

  const { data: notifRow, error: notifErr } = await adminClient
    .from("notifications")
    .insert({
      title,
      body,
      link,
      category,
      created_by: auth.userId,
    })
    .select("id")
    .single();
  const notifId = notifRow?.id ?? null;

  // Fetch all device tokens (admin can read all per RLS policy).
  const { data: subs } = await adminClient
    .from("push_subscriptions")
    .select("token")
    .order("created_at", { ascending: true });

  const tokens: string[] = (subs ?? []).map((s) => s.token).filter(Boolean);

  if (!LOVABLE_API_KEY || !FIREBASE_API_KEY) {
    return json({
      ok: true,
      notification_id: notifId,
      pushed: 0,
      warning: "firebase credentials not configured; notification saved only",
      insert_error: notifErr?.message ?? null,
    });
  }

  const headers = {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": FIREBASE_API_KEY,
    "Content-Type": "application/json",
  };

  let delivered = 0;
  let failed = 0;
  const staleTokens: string[] = [];

  // Fan out to each token. FCM v1 accepts one token per message.
  await Promise.all(
    tokens.map(async (token) => {
      try {
        const res = await fetch(`${GATEWAY_URL}/v1/projects/_/messages:send`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            message: {
              token,
              notification: { title, body },
              data: {
                link: link ?? "/",
                tag: category,
                notification_id: notifId ?? "",
                title,
                body,
              },
              android: { notification: { tag: category } },
            },
          }),
        });
        if (res.ok) {
          delivered++;
          return;
        }
        // 404 UNREGISTERED / 400 INVALID_ARGUMENT => stale token
        if (res.status === 404 || res.status === 400) {
          staleTokens.push(token);
        }
        failed++;
      } catch {
        failed++;
      }
    })
  );

  // Clean up stale tokens so we don't keep retrying them.
  if (staleTokens.length > 0) {
    await adminClient
      .from("push_subscriptions")
      .delete()
      .in("token", staleTokens);
  }

  return json({
    ok: true,
    notification_id: notifId,
    pushed: delivered,
    failed,
    stale_removed: staleTokens.length,
    total_subscribers: tokens.length,
    insert_error: notifErr?.message ?? null,
  });
});
