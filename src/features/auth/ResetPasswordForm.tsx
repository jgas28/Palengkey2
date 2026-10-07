import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PkField from "@/components/pk/PkField";
import AuthShell from "@/features/auth/AuthShell";
import { resetPassword } from "@/services/api/auth";
import { useToastStore } from "@/stores/toastStore";

interface LocationState {
  email?: string;
}

export default function ResetPasswordForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);
  const prefillEmail = (location.state as LocationState | null)?.email ?? "";

  const [email, setEmail] = useState(prefillEmail);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = "Enter a valid email.";
    if (otp.length !== 6) nextErrors.otp = "Enter the 6-digit code.";
    if (password.length < 6) nextErrors.password = "At least 6 characters.";
    if (passwordConfirmation !== password) {
      nextErrors.passwordConfirmation = "Passwords do not match.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const { message } = await resetPassword({
        email: email.trim(),
        otp,
        password,
        password_confirmation: passwordConfirmation,
      });
      showToast(message, "success");
      navigate("/login", { replace: true });
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Reset failed.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <p className="kicker">Almost done</p>
      <h1>Enter a new password</h1>
      <p>Use the 6-digit code we sent you.</p>
      <form onSubmit={handleSubmit} noValidate style={{ marginTop: 18 }}>
        <PkField
          label="Email address"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
        />
        <PkField
          label="6-digit code"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
          error={errors.otp}
        />
        <PkField
          label="New password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
        />
        <PkField
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={passwordConfirmation}
          onChange={(event) => setPasswordConfirmation(event.target.value)}
          error={errors.passwordConfirmation}
        />
        <button type="submit" className="btn primary auth-submit" disabled={submitting}>
          {submitting ? "Saving…" : "Reset password"}
        </button>
      </form>
      <button type="button" className="guest" style={{ marginTop: 16 }} onClick={() => navigate("/login")}>
        ← Back to log in
      </button>
    </AuthShell>
  );
}
