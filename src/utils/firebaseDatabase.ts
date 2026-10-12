import { getApps, initializeApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";
import { env } from "@/config/env";

/**
 * The Firebase Realtime Database the rider app writes live locations to
 * (`riders_location/{riderId}`, `orders/{orderId}/driver_location`).
 * Null when Firebase isn't configured — callers fall back to the API.
 */
export function firebaseDatabase(): Database | null {
  const { apiKey, projectId, appId, databaseURL } = env.firebase;
  if (!apiKey || !projectId || !appId || !databaseURL) return null;

  const app =
    getApps()[0] ??
    initializeApp({
      apiKey,
      projectId,
      appId,
      databaseURL,
      authDomain: env.firebase.authDomain,
      messagingSenderId: env.firebase.messagingSenderId,
    });

  return getDatabase(app, databaseURL);
}
