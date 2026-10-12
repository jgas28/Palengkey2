import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { googleLogin } from "@/services/api/auth";
import { getGoogleIdToken, isGoogleSignInCancelled } from "@/features/auth/googleSignIn";
import { useAuthStore } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { getDeviceId } from "@/utils/deviceId";

/**
 * "Continue with Google" for the login and sign-up pages (web, Android, iOS).
 * New Google users get an account; everyone then confirms the one-time code
 * sent to their Google email, same as email login.
 */
export function useGoogleSignIn() {
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const showToast = useToastStore((state) => state.showToast);
  const navigate = useNavigate();
  const location = useLocation();

  async function signIn() {
    setLoading(true);
    try {
      const idToken = await getGoogleIdToken();
      await clearSession();

      const { token, user } = await googleLogin({
        id_token: idToken,
        device_id: getDeviceId(),
        device_name: navigator.userAgent,
        platform: Capacitor.getPlatform(),
      });

      if (token) {
        await setSession(token, user);
        const from = (location.state as { from?: Location })?.from;
        navigate(from?.pathname ?? "/shop", { replace: true });
        return;
      }

      navigate("/verify-otp", { state: { email: user.email, requiresToken: true } });
    } catch (error) {
      if (!isGoogleSignInCancelled(error)) {
        showToast(
          error instanceof Error ? error.message : "Google sign-in failed.",
          "error",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return { signIn, loading };
}
