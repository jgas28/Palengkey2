import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import AuthShell from "@/features/auth/AuthShell";
import { me, resendOtp, verifyOtp } from "@/services/api/auth";
import { useAuthStore } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { getDeviceId } from "@/utils/deviceId";
import type { OtpChannel } from "@/types/auth";

interface LocationState {
  email?: string;
  /** Channel(s) already chosen at registration — skip the picker and send immediately. */
  channels?: OtpChannel[];
}

const OTP_LENGTH = 6;

export default function OtpVerifyForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;
  const email = state?.email;
  const presetChannels = state?.channels;
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setSession = useAuthStore((state) => state.setSession);
  const setUser = useAuthStore((state) => state.setUser);
  const showToast = useToastStore((state) => state.showToast);

  const [ready, setReady] = useState(Boolean(presetChannels));
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const autoSent = useRef(false);
  const submittedCodeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!email) {
      navigate("/login", { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    if (presetChannels && !autoSent.current && email) {
      autoSent.current = true;
      void sendCodes(presetChannels);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetChannels, email]);

  // Auto-verify once all 6 boxes are filled. This must live in its own effect
  // rather than inside the setDigits updater above it — React (StrictMode, in
  // dev) can invoke a state updater function twice, which would fire this
  // real API call/navigation twice and race two verify attempts against the
  // same single-use OTP.
  useEffect(() => {
    const code = digits.join("");
    if (
      code.length === OTP_LENGTH &&
      digits.every((d) => d !== "") &&
      submittedCodeRef.current !== code
    ) {
      submittedCodeRef.current = code;
      void handleVerify(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits]);

  if (!email) return null;

  async function sendCodes(channels: OtpChannel[]) {
    setSending(true);
    try {
      for (const channel of channels) {
        await resendOtp(email!, channel);
      }
      showToast(
        channels.length > 1
          ? "Codes sent to your email and phone."
          : "A 6-digit code has been sent.",
        "success",
      );
      setReady(true);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not send code.", "error");
    } finally {
      setSending(false);
    }
  }

  /** Spread several digits (paste, SMS autofill) over the boxes from `index`. */
  function fillFrom(index: number, raw: string) {
    const incoming = raw
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH - index)
      .split("");
    if (incoming.length === 0) return;
    setDigits((prev) => {
      const next = [...prev];
      incoming.forEach((digit, offset) => {
        next[index + offset] = digit;
      });
      return next;
    });
    refs.current[Math.min(index + incoming.length, OTP_LENGTH - 1)]?.focus();
  }

  function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    // A full code always starts at the first box, wherever it was pasted.
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    fillFrom(pasted.length >= OTP_LENGTH ? 0 : index, pasted);
  }

  function handleDigitChange(index: number, value: string) {
    const typed = value.replace(/\D/g, "");
    // SMS autofill drops the whole code into one box.
    if (typed.length >= OTP_LENGTH) return fillFrom(0, typed);
    // Typing into a box that already holds a digit: keep the new one.
    if (typed.length === 2 && digits[index]) value = typed.slice(-1);
    else if (typed.length > 1) return fillFrom(index, typed);
    if (!/^[0-9]?$/.test(value)) return;
    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (value && index < OTP_LENGTH - 1) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  async function handleVerify(code: string) {
    setVerifying(true);
    try {
      const result = await verifyOtp({
        email: email!,
        otp: code,
        device_id: getDeviceId(),
        device_name: navigator.userAgent,
        platform: Capacitor.getPlatform(),
      });

      if (result.token && result.user) {
        await setSession(result.token, result.user);
        navigate("/shop", { replace: true });
        return;
      }

      if (isAuthenticated) {
        const { user } = await me();
        await setUser(user);
        navigate("/shop", { replace: true });
        return;
      }

      showToast("Verification failed. Please log in again.", "error");
      navigate("/login", { replace: true });
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Invalid code.", "error");
      submittedCodeRef.current = null;
      setDigits(Array(OTP_LENGTH).fill(""));
      refs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  }

  return (
    <AuthShell>
      <p className="kicker">Almost there</p>
      <h1>Enter your code</h1>
      <p>
        {ready
          ? "We sent a 6-digit code — enter it below to verify your account."
          : "Choose how you'd like to receive your verification code."}
      </p>

      {!ready ? (
        <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
          <button
            type="button"
            className="btn primary auth-submit"
            disabled={sending}
            onClick={() => void sendCodes(["email"])}
          >
            Send code via email
          </button>
          <button
            type="button"
            className="btn social-login"
            style={{ marginTop: 0 }}
            disabled={sending}
            onClick={() => void sendCodes(["sms"])}
          >
            Send code via SMS
          </button>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              margin: "22px 0",
            }}
          >
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                aria-label={`Digit ${i + 1}`}
                value={digit}
                onChange={(event) => handleDigitChange(i, event.target.value)}
                onKeyDown={(event) => handleKeyDown(i, event)}
                onPaste={(event) => handlePaste(i, event)}
                onFocus={(event) => event.target.select()}
                disabled={verifying}
                style={{
                  width: 46,
                  height: 54,
                  padding: 0,
                  textAlign: "center",
                  fontSize: 20,
                  fontWeight: 800,
                  borderColor: digit ? "var(--teal)" : undefined,
                  boxShadow: digit ? "0 0 0 3px rgba(0,151,167,.12)" : undefined,
                }}
              />
            ))}
          </div>

          <button
            type="button"
            className="btn primary auth-submit"
            disabled={verifying || digits.some((d) => !d)}
            onClick={() => void handleVerify(digits.join(""))}
          >
            {verifying ? "Verifying…" : "Verify & continue"}
          </button>

          <p className="auth-switch">
            Didn&apos;t receive it?{" "}
            <button
              type="button"
              disabled={sending}
              onClick={() => void sendCodes(presetChannels ?? ["email"])}
            >
              Resend code
            </button>
          </p>
        </>
      )}
      <button type="button" className="guest" onClick={() => navigate("/login")}>
        ← Back to log in
      </button>
    </AuthShell>
  );
}
