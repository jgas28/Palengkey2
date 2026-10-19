import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import AuthShell from "@/features/auth/AuthShell";
import { adminLogin } from "@/services/api/adminAuth";
import { useAdminAuthStore } from "@/stores/adminAuthStore";
import { authErrorMessage } from "@/features/auth/authErrorMessage";

/** Admin / super admin login — same photo-and-card layout as the customer login. */
export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const setSession = useAdminAuthStore((state) => state.setSession);
  const navigate = useNavigate();

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
      const { token, user } = await adminLogin({ email: email.trim(), password });
      await setSession(token, user);
      navigate("/admin", { replace: true });
    } catch (error) {
      setFormError(authErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      quote="“Every fresh order starts with the market team.”"
      homeHref="/admin/login"
    >
      <p className="kicker">Palengkey Admin Panel</p>
      <h1>Log in to manage</h1>
      <p>For market admins, super admins, marketing and finance staff.</p>
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
      <form onSubmit={handleSubmit} noValidate style={{ marginTop: 18 }}>
        <label htmlFor="admin-email">
          Email Address
          <input
            id="admin-email"
            type="email"
            autoComplete="email"
            placeholder="you@palengkey.ph"
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
        <label htmlFor="admin-password">
          Password
          <span style={{ position: "relative", display: "block" }}>
            <input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Your password"
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
        <button type="submit" className="btn primary auth-submit" disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="auth-switch">
        Forgot your password? Ask your super admin to reset it.
      </p>
    </AuthShell>
  );
}
