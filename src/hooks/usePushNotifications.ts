// Push-notification registration + device token storage.
// Tracks an FCM token per device so the admin can broadcast pushes.
import { useEffect, useState, useCallback } from 'react';
import { enablePush, type PushResult } from '@/lib/firebase';
import { supabase } from '@/integrations/supabase/client';

// Persisted so we only ask once per device.
const LS_KEY = 'vicharmanch.push.registered';

function deviceFingerprint(): string {
  try {
    const parts = [
      navigator.userAgent,
      navigator.language,
      String(screen.width) + 'x' + screen.height,
      String(new Date().getTimezoneOffset()),
      String((navigator as any).hardwareConcurrency || 0),
    ];
    // Simple non-crypto hash; uniqueness within this device is enough.
    let h = 0;
    for (let i = 0; i < parts.join('|').length; i++) {
      h = (h * 31 + parts.join('|').charCodeAt(i)) | 0;
    }
    return 'fp_' + Math.abs(h).toString(36);
  } catch {
    return 'fp_unknown';
  }
}

export function usePushNotifications() {
  const [status, setStatus] = useState<PushResult['status'] | 'idle'>('idle');
  const [token, setToken] = useState<string | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  const register = useCallback(async (): Promise<PushResult> => {
    setRegistrationError(null);
    try {
      const result = await enablePush();
      if (result.status !== 'registered') {
        setStatus(result.status);
        return result;
      }
      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          token: result.token,
          device_fingerprint: deviceFingerprint(),
          user_agent: navigator.userAgent,
          platform: /android/i.test(navigator.userAgent)
            ? 'android'
            : /iphone|ipad/i.test(navigator.userAgent)
              ? 'ios'
              : 'web',
        },
        { onConflict: 'token' }
      );
      if (error) {
        setStatus('denied');
        setRegistrationError('या उपकरणाची नोंद सुरक्षितपणे जतन करता आली नाही.');
        return { status: 'denied' };
      }
      setToken(result.token);
      setStatus(result.status);
      localStorage.setItem(LS_KEY, '1');
      return result;
    } catch (error) {
      setStatus('unsupported');
      setRegistrationError(error instanceof Error ? error.message : 'सूचना नोंदणी अयशस्वी झाली.');
      return { status: 'unsupported' };
    }
  }, []);

  // Heartbeat: refresh last_seen_at for the registered token periodically.
  useEffect(() => {
    if (!token) return;
    const tick = async () => {
      try {
        await supabase
          .from('push_subscriptions')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('token', token);
      } catch {
        /* ignore */
      }
    };
    tick();
    const id = setInterval(tick, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [token]);

  return { status, token, register, registrationError };
}

// Convenience helper to run a one-time prompt on first eligible visit.
export function useAutoPromptPush() {
  const { register, status } = usePushNotifications();
  // Permissions are never requested automatically on page load. Registration
  // is invoked only from the Permission Manager or an explicit test action.
  return { register, status };
}
