import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import PkField from "@/components/pk/PkField";
import AuthShell from "@/features/auth/AuthShell";
import { forgotPassword } from "@/services/api/auth";
import { useToastStore } from "@/stores/toastStore";
import type { OtpChannel } from "@/types/auth";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState<OtpChannel | null>(null);
  const showToast = useToastStore((state) => state.showToast);
  const navigate = useNavigate();

  async function requestCode(channel: OtpChannel) {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email.");
      return;
    }
    setError(undefined);
    setSubmitting(channel);
    try {
      const { message } = await forgotPassword(email.trim(), channel);
      showToast(message, "success");
      navigate("/reset-password", { state: { email: email.trim() } });
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not send code.", "error");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <AuthShell>
      <p className="kicker">Forgot your password?</p>
      <h1>Reset your password</h1>
      <p>Enter your email and we&apos;ll send you a reset code.</p>
      <form onSubmit={(event: FormEvent) => event.preventDefault()} noValidate style={{ marginTop: 18 }}>
        <PkField
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={error}
        />
        <button
          type="button"
          className="btn primary auth-submit"
          disabled={submitting !== null}
          onClick={() => requestCode("email")}
        >
          {submitting === "email" ? "Sending…" : "Send code via email"}
        </button>
        <button
          type="button"
          className="btn social-login"
          disabled={submitting !== null}
          onClick={() => requestCode("sms")}
        >
          {submitting === "sms" ? "Sending…" : "Send code via SMS"}
        </button>
      </form>
      <p className="auth-switch">
        Remembered your password?{" "}
        <button type="button" onClick={() => navigate("/login")}>
          Log in
        </button>
      </p>
    </AuthShell>
  );
}
