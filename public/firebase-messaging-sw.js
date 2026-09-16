// Firebase Messaging service worker.
// Config arrives via the query string the registration passed in; the SW
// file itself cannot read import.meta.env. messagingSenderId is required
// or getToken() throws "missing-app-config-values".
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp(Object.fromEntries(new URL(self.location).searchParams));
const messaging = firebase.messaging();

// When a push arrives while the app is in the background, show a
// notification. Clicking it opens the deep-link path in the payload.
messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const title = payload.notification?.title || data.title || 'विचारमंच';
  const body = payload.notification?.body || data.body || '';
  const link = data.link || '/';

  self.registration.showNotification(title, {
    body,
    icon: '/favicon.jpeg',
    badge: '/favicon.jpeg',
    data: { link },
    tag: data.tag || 'vicharmanch',
  });
});

// Click handler: focus/forward existing window or open the deep link.
self.addEventListener('notificationclick', (event) => {
  const link = event.notification.data?.link || '/';
  event.notification.close();
  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of allClients) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          client.postMessage({ type: 'notification-click', link });
          return;
        }
      }
      return clients.openWindow(link);
    })()
  );
});
