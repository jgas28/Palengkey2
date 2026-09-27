import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { RefreshCw, Smartphone } from "lucide-react";
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
  const [imageFailed, setImageFailed] = useState(false);
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

  function handleDigitChange(index: number, value: string) {
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
    <div className="flex min-h-full">
      {/* Left: image panel */}
      <div className="relative hidden overflow-hidden bg-gradient-brand lg:block lg:w-1/2">
        {!imageFailed && (
          <img
            src="https://images.unsplash.com/photo-1695653422259-8a74ffe90401?w=900&h=1200&fit=crop&auto=format"
            alt="Delivery"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute left-8 top-8">
          <img
            src="/assets/name.png"
            alt="Palengkey"
            className="h-10 w-auto opacity-90 brightness-0 invert"
          />
        </div>
        <div className="absolute bottom-10 left-10 right-10">
          <p className="mb-2 font-display text-3xl font-bold leading-tight text-white">
            Almost there!
          </p>
          <p className="text-sm text-white/70">
            Verify your account to start ordering fresh from your local market.
          </p>
        </div>
      </div>

      {/* Right: OTP form */}
      <div className="flex flex-1 items-center justify-center bg-[#F7FAFA] px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:hidden">
            <img src="/assets/name.png" alt="Palengkey" className="mx-auto h-12 w-auto" />
          </div>

          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#E8F7F7] shadow-sm">
              <Smartphone
                className="h-10 w-10 text-[#0097A7]"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="mb-8 text-center">
            <h1 className="mb-1 font-display text-3xl font-bold text-[#203238]">
              Enter OTP
            </h1>
            <p className="text-sm text-[#66777C]">
              {ready
                ? "We sent a 6-digit code — enter it below."
                : "Choose how you'd like to receive your code."}
            </p>
          </div>

          {!ready ? (
            <div className="space-y-3">
              <button
                type="button"
                disabled={sending}
                onClick={() => void sendCodes(["email"])}
                className="w-full rounded-xl bg-[#0097A7] py-3.5 font-bold text-white shadow-sm transition-all hover:bg-[#006D77] disabled:opacity-60"
              >
                Send code via email
              </button>
              <button
                type="button"
                disabled={sending}
                onClick={() => void sendCodes(["sms"])}
                className="w-full rounded-xl border-2 border-[#DDE9EA] py-3.5 font-bold text-[#66777C] transition-all hover:border-[#0097A7] hover:text-[#0097A7] disabled:opacity-60"
              >
                Send code via SMS
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8 flex justify-center gap-2.5">
                {digits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      refs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(event) => handleDigitChange(i, event.target.value)}
                    onKeyDown={(event) => handleKeyDown(i, event)}
                    disabled={verifying}
                    className="h-14 w-12 rounded-2xl border-2 bg-white text-center text-xl font-bold text-[#203238] outline-none transition-all"
                    style={{
                      borderColor: digit ? "#0097A7" : "#DDE9EA",
                      boxShadow: digit ? "0 0 0 3px rgba(0,151,167,0.12)" : "none",
                    }}
                  />
                ))}
              </div>

              <button
                type="button"
                disabled={verifying || digits.some((d) => !d)}
                onClick={() => void handleVerify(digits.join(""))}
                className="mb-4 w-full rounded-xl bg-[#0097A7] py-3.5 font-bold text-white shadow-sm transition-all hover:bg-[#006D77] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {verifying ? "Verifying…" : "Verify & Continue"}
              </button>

              <div className="space-y-3 text-center">
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => void sendCodes(presetChannels ?? ["email"])}
                  className="mx-auto flex items-center justify-center gap-2 text-sm text-[#66777C] transition-colors hover:text-[#0097A7]"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  Didn&apos;t receive it?{" "}
                  <span className="font-semibold text-[#0097A7]">Resend OTP</span>
                </button>
                <Link
                  to="/login"
                  className="block border-t border-[#DDE9EA] pt-2 text-sm text-[#66777C] transition-colors hover:text-[#203238]"
                >
                  ← Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
