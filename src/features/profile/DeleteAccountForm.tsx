import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import {
  confirmAccountDeletion,
  requestAccountDeletion,
} from "@/services/api/profile";
import { useAuthStore } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import type { OtpChannel } from "@/types/auth";

export default function DeleteAccountForm() {
  const navigate = useNavigate();
  const clearSession = useAuthStore((state) => state.clearSession);
  const showToast = useToastStore((state) => state.showToast);

  const [step, setStep] = useState<"warn" | "verify">("warn");
  const [requesting, setRequesting] = useState<OtpChannel | null>(null);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string>();
  const [deleting, setDeleting] = useState(false);

  async function requestCode(channel: OtpChannel) {
    setRequesting(channel);
    try {
      const { message } = await requestAccountDeletion(channel);
      showToast(message, "success");
      setStep("verify");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not send code.", "error");
    } finally {
      setRequesting(null);
    }
  }

  async function handleConfirm(event: FormEvent) {
    event.preventDefault();

    if (otp.length !== 6) {
      setOtpError("Enter the 6-digit code.");
      return;
    }
    setOtpError(undefined);

    setDeleting(true);
    try {
      const { message } = await confirmAccountDeletion(otp);
      showToast(message, "success");
      await clearSession();
      navigate("/login", { replace: true });
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not delete account.", "error");
    } finally {
      setDeleting(false);
    }
  }

  if (step === "verify") {
    return (
      <form onSubmit={handleConfirm} className="flex flex-col gap-4">
        <h1 className="font-display text-xl font-bold text-text">Confirm deletion</h1>
        <p className="text-sm text-text-muted">
          Enter the 6-digit code we sent you to permanently delete your account.
        </p>

        <Input
          label="6-digit code"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
          error={otpError}
        />

        <Button variant="danger" type="submit" fullWidth loading={deleting}>
          Permanently delete my account
        </Button>
        <Button variant="ghost" type="button" onClick={() => setStep("warn")} disabled={deleting}>
          Back
        </Button>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-bold text-text">Delete account</h1>

      <div className="flex flex-col gap-2 rounded-card border border-status-cancelled/30 bg-status-cancelled/5 p-4 text-sm text-text">
        <p className="font-semibold text-status-cancelled">This can&apos;t be undone.</p>
        <p>
          Your name, email, phone, saved addresses, and ID documents will be permanently
          removed. Your order history is kept for tax/financial records, but won&apos;t be
          linked to your identity anymore.
        </p>
        <p>
          Your email and phone number will be locked from re-registration for 120 days.
        </p>
      </div>

      <p className="text-sm text-text-muted">
        We&apos;ll send a confirmation code before anything is deleted.
      </p>

      <Button
        variant="solid"
        loading={requesting === "email"}
        disabled={requesting !== null}
        onClick={() => void requestCode("email")}
      >
        Send code via email
      </Button>
      <Button
        variant="secondary"
        loading={requesting === "sms"}
        disabled={requesting !== null}
        onClick={() => void requestCode("sms")}
      >
        Send code via SMS
      </Button>
    </div>
  );
}
