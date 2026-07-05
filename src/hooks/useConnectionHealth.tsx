import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ConnStatus = "online" | "slow" | "offline" | "checking";

const SLOW_THRESHOLD = 1500;   // ms – above this = slow
const TIMEOUT_MS     = 8000;   // ms – single-attempt timeout
const RETRY_ATTEMPTS = 2;      // retries before flipping to offline
const RETRY_DELAY    = 1500;   // ms between retries

/**
 * Health monitor for the Lovable Cloud backend.
 *
 * Strategy:
 *  - Poll a tiny SELECT on `app_settings` (small config table, 1 row).
 *  - Never trust `navigator.onLine` alone; only use it as an early hint.
 *  - Before declaring "offline", retry `RETRY_ATTEMPTS` times.
 *  - Debounce state transitions so the badge never flickers between
 *    online/offline within a single poll cycle.
 */
export function useConnectionHealth(intervalMs = 30000) {
  const [status, setStatus] = useState<ConnStatus>("checking");
  const [latency, setLatency] = useState<number | null>(null);
  const [lastSuccessAt, setLastSuccessAt] = useState<number | null>(null);
  const timer = useRef<number | null>(null);
  const inflight = useRef(false);

  /** Single attempt against Supabase. Returns latency or null on failure. */
  const singleProbe = async (): Promise<number | null> => {
    const start = performance.now();
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      // Lightweight query — HEAD + count only, no rows returned.
      const { error } = await supabase
        .from("app_settings")
        .select("key", { count: "exact", head: true })
        .abortSignal(controller.signal);
      if (error) return null;
      return Math.round(performance.now() - start);
    } catch {
      return null;
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const runCheck = useCallback(async () => {
    if (inflight.current) return;
    inflight.current = true;
    try {
      // Try up to RETRY_ATTEMPTS + 1 times before declaring offline
      let ms: number | null = null;
      for (let i = 0; i <= RETRY_ATTEMPTS; i++) {
        ms = await singleProbe();
        if (ms !== null) break;
        // Only retry if the browser thinks we're online; skip waiting if hard-offline
        if (!navigator.onLine) break;
        await new Promise((r) => setTimeout(r, RETRY_DELAY));
      }

      if (ms === null) {
        // All attempts failed → truly unreachable
        setStatus("offline");
        setLatency(null);
        return;
      }

      setLatency(ms);
      setLastSuccessAt(Date.now());
      setStatus(ms > SLOW_THRESHOLD ? "slow" : "online");
    } finally {
      inflight.current = false;
    }
  }, []);

  useEffect(() => {
    runCheck();
    timer.current = window.setInterval(runCheck, intervalMs);
    const onOnline = () => runCheck();
    // Do NOT immediately flip to offline on browser event — verify with a probe.
    const onOffline = () => runCheck();
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [intervalMs, runCheck]);

  return { status, latency, lastSuccessAt, retry: runCheck };
}
