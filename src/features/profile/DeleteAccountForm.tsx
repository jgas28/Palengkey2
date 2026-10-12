import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import PkField from "@/components/pk/PkField";
import { confirmAccountDeletion, requestAccountDeletion } from "@/services/api/profile";
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
      showToast(
        error instanceof Error ? error.message : "Could not delete account.",
        "error",
      );
    } finally {
      setDeleting(false);
    }
  }

  if (step === "verify") {
    return (
      <form onSubmit={handleConfirm} noValidate style={{ display: "grid", gap: 14 }}>
        <h2>Confirm deletion</h2>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 12 }}>
          Enter the 6-digit code we sent you to permanently delete your account.
        </p>

        <PkField
          label="6-digit code"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
          error={otpError}
        />

        <button
          type="submit"
          className="btn primary"
          style={{ background: "#b82f2f" }}
          disabled={deleting}
        >
          {deleting ? "Deleting…" : "Permanently delete my account"}
        </button>
        <button
          type="button"
          className="btn outline"
          onClick={() => setStep("warn")}
          disabled={deleting}
        >
          Back
        </button>
      </form>
    );
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="checkout-cutoff" style={{ margin: 0 }}>
        <div style={{ display: "grid", gap: 6, fontSize: 11, lineHeight: 1.6 }}>
          <strong>This can&apos;t be undone.</strong>
          <p>
            Your name, email, phone, saved addresses, and ID documents will be permanently
            removed. Your order history is kept for tax/financial records, but won&apos;t
            be linked to your identity anymore.
          </p>
          <p>
            Your email and phone number will be locked from re-registration for 120 days.
          </p>
        </div>
      </div>

      <p style={{ margin: 0, color: "var(--muted)", fontSize: 12 }}>
        We&apos;ll send a confirmation code before anything is deleted.
      </p>

      <button
        type="button"
        className="btn primary"
        disabled={requesting !== null}
        onClick={() => void requestCode("email")}
      >
        {requesting === "email" ? "Sending…" : "Send code via email"}
      </button>
      <button
        type="button"
        className="btn outline"
        disabled={requesting !== null}
        onClick={() => void requestCode("sms")}
      >
        {requesting === "sms" ? "Sending…" : "Send code via SMS"}
      </button>
    </div>
  );
}
