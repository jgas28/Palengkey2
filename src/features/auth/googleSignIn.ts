import { Capacitor } from "@capacitor/core";
import { SocialLogin } from "@capgo/capacitor-social-login";
import { env } from "@/config/env";

let initialized: Promise<void> | null = null;

function initialize(): Promise<void> {
  const webClientId = env.googleClientId;
  if (!webClientId) {
    return Promise.reject(
      new Error("Google sign-in isn't set up yet (missing VITE_GOOGLE_CLIENT_ID)."),
    );
  }
  if (Capacitor.getPlatform() === "ios" && !env.googleIosClientId) {
    return Promise.reject(
      new Error(
        "Google sign-in isn't set up for iPhone yet (missing VITE_GOOGLE_IOS_CLIENT_ID).",
      ),
    );
  }

  initialized ??= SocialLogin.initialize({
    google: {
      // Web + Android use the web client ID; Android's ID token is issued for it.
      webClientId,
      iOSClientId: env.googleIosClientId,
      iOSServerClientId: webClientId,
      mode: "online",
    },
  }).catch((error: unknown) => {
    initialized = null; // allow a retry
    throw error;
  });

  return initialized;
}

/** The user cancelled the Google prompt — not an error worth showing. */
export function isGoogleSignInCancelled(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /cancel|closed|dismiss|12501|popup_closed/i.test(message);
}

/**
 * Opens Google's account picker (popup on web, native sheet on Android/iOS) and
 * returns the Google ID token, which the API verifies with Google.
 */
export async function getGoogleIdToken(): Promise<string> {
  await initialize();

  const response = await SocialLogin.login({ provider: "google", options: {} });
  const result = response.result as { idToken?: string | null };

  if (!result.idToken) {
    throw new Error("Google didn't return a sign-in token. Please try again.");
  }

  return result.idToken;
}
