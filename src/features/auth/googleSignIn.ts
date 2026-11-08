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

/**
 * Web uses a same-tab redirect instead of the plugin's popup: browsers cut the
 * popup off from this tab once it passes through Google, so the popup came back
 * to a second copy of the login page and the first tab never heard of it.
 */
const REDIRECT_KEY = "palengkey_google_redirect";
// The plugin's popup markers; a stale one makes it treat our return as its popup.
const PLUGIN_POPUP_KEYS = ["social_login_oauth_pending", "social_login_oauth_popup"];

interface PendingRedirect {
  state: string;
  nonce: string;
  /** Where to go after sign-in (the page that sent the customer to /login). */
  from?: string;
}

export function usesGoogleRedirect(): boolean {
  return Capacitor.getPlatform() === "web";
}

/** Sends this tab to Google's account picker; it comes back to this page. */
export function startGoogleRedirect(from?: string): void {
  if (!env.googleClientId) {
    throw new Error("Google sign-in isn't set up yet (missing VITE_GOOGLE_CLIENT_ID).");
  }
  const pending: PendingRedirect = {
    state: crypto.randomUUID(),
    nonce: crypto.randomUUID(),
    from,
  };
  try {
    PLUGIN_POPUP_KEYS.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    sessionStorage.setItem(REDIRECT_KEY, JSON.stringify(pending));
  } catch {
    throw new Error("Google sign-in needs browser storage. Please turn off private mode.");
  }

  const params = new URLSearchParams({
    client_id: env.googleClientId,
    redirect_uri: window.location.origin + window.location.pathname,
    response_type: "id_token",
    scope: "openid email profile",
    state: pending.state,
    nonce: pending.nonce,
    prompt: "select_account",
  });
  window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}

/**
 * On the page Google sent the customer back to: the ID token and where to go
 * next, or null when this isn't a return from Google. Takes it only once.
 */
export function takeGoogleRedirectResult(): { idToken: string; from?: string } | null {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  if (!hash.has("id_token") && !hash.has("error")) return null;

  let pending: PendingRedirect | null = null;
  try {
    pending = JSON.parse(sessionStorage.getItem(REDIRECT_KEY) ?? "null") as PendingRedirect | null;
    sessionStorage.removeItem(REDIRECT_KEY);
  } catch {
    // treated as not ours below
  }
  // Drop the token from the address bar and history either way.
  window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);

  if (!pending || hash.get("state") !== pending.state) return null;

  const error = hash.get("error");
  if (error) {
    throw new Error(error === "access_denied" ? "cancelled" : "Google sign-in failed. Please try again.");
  }

  const idToken = hash.get("id_token") ?? "";
  if (tokenNonce(idToken) !== pending.nonce) {
    throw new Error("Google sign-in failed. Please try again.");
  }
  return { idToken, from: pending.from };
}

function tokenNonce(idToken: string): string | null {
  try {
    const payload = idToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return (JSON.parse(atob(payload)) as { nonce?: string }).nonce ?? null;
  } catch {
    return null;
  }
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
