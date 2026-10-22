/* Firebase Cloud Messaging service worker (web push).
 *
 * The page registers this file with the public Firebase SDK config in
 * the query string (see lib/web-push.ts `serviceWorkerConfigQuery`), so
 * no config is duplicated here. Background/killed delivery renders from
 * the FCM `notification` block; `data.session_id` carries the deep link,
 * exactly like the Android/iOS contract in exur-mobile-app (ExurPush).
 */
importScripts(
  "https://www.gstatic.com/firebasejs/13.1.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/13.1.0/firebase-messaging-compat.js"
);

const params = new URLSearchParams(self.location.search);
firebase.initializeApp({
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  storageBucket: params.get("storageBucket"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
});

const messaging = firebase.messaging();

function targetPath(data) {
  if (data && typeof data.url === "string" && data.url.startsWith("/")) {
    return data.url;
  }
  const sessionId = data && (data.session_id || data.sessionId);
  return sessionId ? "/?session_id=" + encodeURIComponent(sessionId) : "/";
}

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const title =
    (payload.notification && payload.notification.title) || data.title || "Exur";
  const body =
    (payload.notification && payload.notification.body) ||
    data.body ||
    data.message;
  if (!body) return;
  self.registration.showNotification(title, {
    body,
    icon: "/icon-192.png",
    badge: "/favicon-48.png",
    data: { ...data, targetPath: targetPath(data) },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path =
    (event.notification.data && event.notification.data.targetPath) || "/";
  const url = new URL(path, self.location.origin).href;
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (client.url.startsWith(self.location.origin) && "focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      })
  );
});
