import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { initializeApp, getApps, type FirebaseOptions } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { env, isFirebaseConfigured } from "@/config/env";
import { registerPushToken } from "@/services/api/pushNotifications";
import { useToastStore } from "@/stores/toastStore";

/** Requests permission and registers this device for push, if Firebase is configured. */
export async function registerForPushNotifications(): Promise<void> {
  if (!isFirebaseConfigured()) return;

  try {
    if (Capacitor.isNativePlatform()) {
      await registerNativePush();
    } else {
      await registerWebPush();
    }
  } catch (error) {
    console.warn("Push notification registration failed.", error);
  }
}

async function registerNativePush(): Promise<void> {
  const permission = await PushNotifications.requestPermissions();
  if (permission.receive !== "granted") return;

  await PushNotifications.addListener("registration", (token) => {
    void registerPushToken(token.value).catch(() => {});
  });
  await PushNotifications.addListener("registrationError", (error) => {
    console.warn("Push registration error.", error);
  });
  await PushNotifications.addListener("pushNotificationReceived", (notification) => {
    useToastStore
      .getState()
      .showToast(notification.title ?? notification.body ?? "New notification", "info");
  });
  await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    const url = action.notification.data?.url as string | undefined;
    if (url) window.location.href = url;
  });

  await PushNotifications.register();
}

async function registerWebPush(): Promise<void> {
  if (!("serviceWorker" in navigator) || !env.firebase.vapidKey) return;
  if (!(await isSupported())) return;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;

  const firebaseConfig: FirebaseOptions = {
    apiKey: env.firebase.apiKey,
    authDomain: env.firebase.authDomain,
    projectId: env.firebase.projectId,
    storageBucket: env.firebase.storageBucket,
    messagingSenderId: env.firebase.messagingSenderId,
    appId: env.firebase.appId,
  };

  const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  const messaging = getMessaging(app);

  const registration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js",
  );
  const token = await getToken(messaging, {
    vapidKey: env.firebase.vapidKey,
    serviceWorkerRegistration: registration,
  });

  if (token) {
    await registerPushToken(token).catch(() => {});
  }

  onMessage(messaging, (payload) => {
    useToastStore
      .getState()
      .showToast(payload.notification?.title ?? "New notification", "info");
  });
}
