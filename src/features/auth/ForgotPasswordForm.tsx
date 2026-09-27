import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
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
    <div className="flex min-h-full items-center justify-center bg-[#F7FAFA] px-6 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-[#DDE9EA] bg-white p-6 shadow-sm">
        <img src="/assets/name.png" alt="Palengkey" className="mb-5 h-9 w-auto" />
        <form
          onSubmit={(event: FormEvent) => event.preventDefault()}
          className="flex flex-col gap-4"
        >
          <div>
            <h1 className="font-display text-2xl font-bold text-[#203238]">
              Reset your password
            </h1>
            <p className="mt-1 text-sm text-[#66777C]">
              Enter your email and we&apos;ll send you a reset code.
            </p>
          </div>

          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={error}
          />

          <Button
            variant="solid"
            loading={submitting === "email"}
            onClick={() => requestCode("email")}
          >
            Send code via email
          </Button>
          <Button
            variant="secondary"
            loading={submitting === "sms"}
            onClick={() => requestCode("sms")}
          >
            Send code via SMS
          </Button>

          <p className="text-center text-sm text-[#66777C]">
            Remembered your password?{" "}
            <Link to="/login" className="font-semibold text-[#0097A7] hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
