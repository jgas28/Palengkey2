import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
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
    <div className="flex min-h-full items-center justify-center bg-[#F7FAFA] px-6 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-[#DDE9EA] bg-white p-6 shadow-sm">
        <img src="/assets/name.png" alt="Palengkey" className="mb-5 h-9 w-auto" />
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <h1 className="font-display text-2xl font-bold text-[#203238]">
            Enter new password
          </h1>

          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.email}
          />
          <Input
            label="6-digit code"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
            error={errors.otp}
          />
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password}
          />
          <Input
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            error={errors.passwordConfirmation}
          />

          <Button variant="solid" type="submit" fullWidth loading={submitting}>
            Reset password
          </Button>
        </form>
      </div>
    </div>
  );
}
