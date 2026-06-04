import { useEffect, useState, useRef } from "react";

export type ConnStatus = "online" | "slow" | "offline" | "checking";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

/**
 * Polls a lightweight REST endpoint and classifies the connection.
 * Future-ready for offline queue: exposes lastSuccessAt + retry().
 */
export function useConnectionHealth(intervalMs = 30000) {
  const [status, setStatus] = useState<ConnStatus>("checking");
  const [latency, setLatency] = useState<number | null>(null);
  const [lastSuccessAt, setLastSuccessAt] = useState<number | null>(null);
  const timer = useRef<number | null>(null);

  const ping = async () => {
    if (!navigator.onLine) {
      setStatus("offline");
      setLatency(null);
      return;
    }
    const controller = new AbortController();
    const t = window.setTimeout(() => controller.abort(), 5000);
    const start = performance.now();
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/site_settings?select=key&limit=1`, {
        method: "GET",
        headers: { apikey: PUBLISHABLE_KEY, Authorization: `Bearer ${PUBLISHABLE_KEY}` },
        signal: controller.signal,
        cache: "no-store",
      });
      const ms = performance.now() - start;
      setLatency(Math.round(ms));
      if (!res.ok) { setStatus("offline"); return; }
      setLastSuccessAt(Date.now());
      setStatus(ms > 1500 ? "slow" : "online");
    } catch {
      setStatus("offline");
      setLatency(null);
    } finally {
      window.clearTimeout(t);
    }
  };

  useEffect(() => {
    ping();
    timer.current = window.setInterval(ping, intervalMs);
    const onOnline = () => ping();
    const onOffline = () => setStatus("offline");
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [intervalMs]);

  return { status, latency, lastSuccessAt, retry: ping };
}
