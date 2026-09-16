// Firebase Cloud Messaging client for web push.
// Public Vite vars come from the firebase_messaging connector.
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, type Messaging } from 'firebase/messaging';

const appId = import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_APP_ID;
const vapidKey = import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_VAPID_KEY;
const apiKey = import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_WEB_API_KEY;
const projectId = import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_PROJECT_ID;

// messagingSenderId is the second segment of the app id: "1:<senderId>:web:<hash>"
const messagingSenderId = appId?.split(':')[1] ?? '';

export const FIREBASE_CONFIGURED = Boolean(apiKey && projectId && appId && vapidKey && messagingSenderId);

const firebaseConfig = {
  apiKey,
  projectId,
  appId,
  messagingSenderId,
};

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

async function ensureMessaging(): Promise<Messaging | null> {
  if (!FIREBASE_CONFIGURED) return null;
  if (!(await isSupported())) return null;
  if (!app) app = initializeApp(firebaseConfig);
  if (!messaging) messaging = getMessaging(app);
  return messaging;
}

export type PushResult =
  | { status: 'registered'; token: string }
  | { status: 'not-configured' }
  | { status: 'unsupported' }
  | { status: 'open-in-new-tab' }
  | { status: 'denied' };

// Must be called from a user gesture (click). Browsers reject
// Notification.requestPermission without one, and the cross-origin
// Lovable preview iframe blocks the prompt entirely.
export async function enablePush(): Promise<PushResult> {
  if (!FIREBASE_CONFIGURED) return { status: 'not-configured' };
  if (!('Notification' in window)) return { status: 'unsupported' };
  // The preview runs inside a cross-origin iframe where the permission
  // prompt is silently suppressed. Ask the user to open in its own tab.
  if (window.top !== window.self) return { status: 'open-in-new-tab' };

  const permission =
    Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission();
  if (permission !== 'granted') return { status: 'denied' };

  const m = await ensureMessaging();
  if (!m) return { status: 'unsupported' };

  // Register the service worker with config in the query string, since
  // the SW file cannot read import.meta.env.
  const query = new URLSearchParams(firebaseConfig).toString();
  const swReg = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${query}`);
  const token = await getToken(m, { vapidKey, serviceWorkerRegistration: swReg });
  return token ? { status: 'registered', token } : { status: 'denied' };
}

export { ensureMessaging };
