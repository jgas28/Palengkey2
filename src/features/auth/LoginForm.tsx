import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import AuthShell from "@/features/auth/AuthShell";
import { login } from "@/services/api/auth";
import { useAuthStore } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { getDeviceId } from "@/utils/deviceId";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const showToast = useToastStore((state) => state.showToast);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const nextErrors: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = "Enter a valid email.";
    if (!password) nextErrors.password = "Password is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      // Drop any leftover session first — otherwise a still-valid token from a
      // previous login would ride along on the OTP-verification request that
      // follows and confuse the server about whether this is a fresh login.
      await clearSession();

      const { token, user } = await login({
        email: email.trim(),
        password,
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

      // Every login now requires a fresh OTP challenge — server withholds the token.
      navigate("/verify-otp", { state: { email: user.email, requiresToken: true } });
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Login failed.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <p className="kicker">Welcome back, suki</p>
      <h1>Log in to your account</h1>
      <p>Track orders, save addresses, and enjoy a faster checkout.</p>
      <button
        type="button"
        className="btn social-login"
        onClick={() => showToast("Google sign-in is coming soon.", "info")}
      >
        G <span>Continue with Google</span>
      </button>
      <div className="divider">
        <span>or continue with email</span>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="login-email">
          Email Address
          <input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(errors.email)}
            style={errors.email ? { borderColor: "#dc2626" } : undefined}
          />
          {errors.email && <small style={{ color: "#dc2626", fontWeight: 500 }}>{errors.email}</small>}
        </label>
        <label htmlFor="login-password">
          Password
          <span style={{ position: "relative", display: "block" }}>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(errors.password)}
              style={errors.password ? { borderColor: "#dc2626", paddingRight: 64 } : { paddingRight: 64 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--teal-dark)", background: "none", border: 0, fontSize: 10, fontWeight: 700 }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </span>
          {errors.password && <small style={{ color: "#dc2626", fontWeight: 500 }}>{errors.password}</small>}
        </label>
        <p style={{ margin: "-6px 0 14px", textAlign: "right", fontSize: 10 }}>
          <Link to="/forgot-password" style={{ color: "var(--teal-dark)", fontWeight: 700 }}>
            Forgot password?
          </Link>
        </p>
        <button type="submit" className="btn primary auth-submit" disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="auth-switch">
        New to Palengkey?{" "}
        <button type="button" onClick={() => navigate("/register")}>
          Create account
        </button>
      </p>
      <button type="button" className="guest" onClick={() => navigate("/shop")}>
        ← Continue as guest
      </button>
    </AuthShell>
  );
}
