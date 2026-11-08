import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { googleLogin } from "@/services/api/auth";
import {
  getGoogleIdToken,
  isGoogleSignInCancelled,
  startGoogleRedirect,
  takeGoogleRedirectResult,
  usesGoogleRedirect,
} from "@/features/auth/googleSignIn";
import { useAuthStore } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { getDeviceId } from "@/utils/deviceId";
import { authErrorMessage } from "@/features/auth/authErrorMessage";

/**
 * "Continue with Google" for the login and sign-up pages (web, Android, iOS).
 * New Google users get an account; everyone then confirms the one-time code
 * sent to their Google email, same as email login.
 *
 * Web leaves for Google in this tab and finishes when Google sends it back here.
 */
export function useGoogleSignIn(onError?: (message: string) => void) {
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const showToast = useToastStore((state) => state.showToast);
  const navigate = useNavigate();
  const location = useLocation();

  function fail(error: unknown) {
    if (isGoogleSignInCancelled(error)) return;
    const message = authErrorMessage(error, "Google sign-in failed. Please try again.");
    if (onError) onError(message);
    else showToast(message, "error");
  }

  async function finish(idToken: string, from?: string) {
    await clearSession();

    const { token, user } = await googleLogin({
      id_token: idToken,
      device_id: getDeviceId(),
      device_name: navigator.userAgent,
      platform: Capacitor.getPlatform(),
    });

    if (token) {
      await setSession(token, user);
      navigate(from ?? "/shop", { replace: true });
      return;
    }

    navigate("/verify-otp", { state: { email: user.email, requiresToken: true } });
  }

  // Back from Google's account picker (web).
  useEffect(() => {
    if (!usesGoogleRedirect()) return;
    let result: ReturnType<typeof takeGoogleRedirectResult>;
    try {
      result = takeGoogleRedirectResult();
    } catch (error) {
      fail(error);
      return;
    }
    if (!result) return;

    setLoading(true);
    finish(result.idToken, result.from)
      .catch(fail)
      .finally(() => setLoading(false));
    // Runs once on arrival; the result is consumed on the first read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signIn() {
    const from = (location.state as { from?: Location })?.from?.pathname;
    setLoading(true);
    try {
      if (usesGoogleRedirect()) {
        startGoogleRedirect(from);
        return; // leaving the page; keep the button in its loading state
      }
      await finish(await getGoogleIdToken(), from);
    } catch (error) {
      fail(error);
    }
    setLoading(false);
  }

  return { signIn, loading };
}
