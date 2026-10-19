import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { GoogleGIcon } from "@/components/icons/BrandIcons";
import AuthShell from "@/features/auth/AuthShell";
import { login } from "@/services/api/auth";
import { useGoogleSignIn } from "@/features/auth/useGoogleSignIn";
import { useAuthStore } from "@/stores/authStore";
import { getDeviceId } from "@/utils/deviceId";
import { authErrorMessage } from "@/features/auth/authErrorMessage";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { signIn: signInWithGoogle, loading: googleLoading } =
    useGoogleSignIn(setFormError);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setFormError(null);
    const nextErrors: typeof errors = {};
    if (!email.trim()) nextErrors.email = "Enter your email address.";
    else if (!/^\S+@\S+\.\S+$/.test(email.trim()))
      nextErrors.email = "That doesn't look like an email address.";
    if (!password) nextErrors.password = "Enter your password.";
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
      setFormError(authErrorMessage(error));
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
        disabled={googleLoading || submitting}
        onClick={() => {
          setFormError(null);
          void signInWithGoogle();
        }}
      >
        <GoogleGIcon />{" "}
        <span>{googleLoading ? "Opening Google…" : "Continue with Google"}</span>
      </button>
      {formError && (
        <div
          role="alert"
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            margin: "14px 0 0",
            padding: "12px 14px",
            borderRadius: 14,
            background: "#fdecec",
            border: "1px solid #f5c2c2",
            color: "#9f1c1c",
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.45,
          }}
        >
          <span aria-hidden="true" style={{ fontSize: 15, lineHeight: 1.2 }}>
            !
          </span>
          <span>{formError}</span>
        </div>
      )}
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
            onChange={(event) => {
              setEmail(event.target.value);
              setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            aria-invalid={Boolean(errors.email)}
            style={errors.email ? { borderColor: "#dc2626" } : undefined}
          />
          {errors.email && (
            <small style={{ color: "#dc2626", fontWeight: 500 }}>{errors.email}</small>
          )}
        </label>
        <label htmlFor="login-password">
          Password
          <span style={{ position: "relative", display: "block" }}>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              aria-invalid={Boolean(errors.password)}
              style={
                errors.password
                  ? { borderColor: "#dc2626", paddingRight: 64 }
                  : { paddingRight: 64 }
              }
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--teal-dark)",
                background: "none",
                border: 0,
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </span>
          {errors.password && (
            <small style={{ color: "#dc2626", fontWeight: 500 }}>{errors.password}</small>
          )}
        </label>
        <p style={{ margin: "-6px 0 14px", textAlign: "right", fontSize: 10 }}>
          <Link
            to="/forgot-password"
            style={{ color: "var(--teal-dark)", fontWeight: 700 }}
          >
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
