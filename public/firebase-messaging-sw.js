// Handles Web Push notifications received while the site isn't in the
// foreground (tab closed/backgrounded). Must live at the origin root so its
// scope covers the whole app. Uses the Firebase compat SDK — service workers
// can't use bundler imports, so this loads it from Google's CDN directly.
importScripts("https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js");

// Public web config — safe to embed (see src/config/env.ts for the same values).
firebase.initializeApp({
  apiKey: "AIzaSyAJmlwbqU0jJMx4foIDsKLsLYaFGTk17jg",
  authDomain: "palengkey-delivery.firebaseapp.com",
  projectId: "palengkey-delivery",
  storageBucket: "palengkey-delivery.firebasestorage.app",
  messagingSenderId: "1006959670311",
  appId: "1:1006959670311:web:069948d8a7ad9d63754a02",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "Palengkey";
  const options = {
    body: payload.notification?.body,
    data: payload.data,
  };
  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(self.clients.openWindow(url));
});
