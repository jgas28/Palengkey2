const required = (key: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  apiUrl: required("VITE_API_URL", import.meta.env.VITE_API_URL),
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as
      string | undefined,
    appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
    // Web Push certificate key pair — Firebase Console > Project Settings >
    // Cloud Messaging > Web Push certificates. Only needed for web push.
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined,
  },
  // Public in the browser bundle by design — restricted via HTTP referrer
  // rules in Google Cloud Console, not by being secret.
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined,
};

/** Push notifications are an enhancement — the app must work fine without them configured. */
export function isFirebaseConfigured(): boolean {
  const { apiKey, authDomain, projectId, messagingSenderId, appId } = env.firebase;
  return Boolean(apiKey && authDomain && projectId && messagingSenderId && appId);
}
