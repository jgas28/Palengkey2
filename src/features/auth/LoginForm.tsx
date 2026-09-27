import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { Eye, EyeOff, Lock, Mail, ChevronRight } from "lucide-react";
import { login } from "@/services/api/auth";
import { useAuthStore } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { getDeviceId } from "@/utils/deviceId";

const SLIDES = [
  {
    img: "photo-1489450278009-822e9be04dff",
    caption: "Fresh from the palengke",
    sub: "Vegetables picked this morning, at your door by afternoon.",
  },
  {
    img: "photo-1615141982883-c7ad0e69fd62",
    caption: "Market-fresh seafood",
    sub: "Daily catch delivered straight from local coastal markets.",
  },
  {
    img: "photo-1609780447631-05b93e5a88ea",
    caption: "Tropical fruits you love",
    sub: "Carabao mangoes, langka, and more — in season, every day.",
  },
];

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [active, setActive] = useState(0);
  const [failedSlides, setFailedSlides] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const showToast = useToastStore((state) => state.showToast);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const nextErrors: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = "Enter a valid email.";
    if (!password) nextErrors.password = "Password is required.";
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
      showToast(error instanceof Error ? error.message : "Login failed.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-full">
      {/* Left: image slideshow */}
      <div className="relative hidden overflow-hidden bg-gradient-brand lg:flex lg:w-1/2">
        {SLIDES.map((s, i) => (
          <div
            key={s.img}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: active === i ? 1 : 0 }}
          >
            {!failedSlides.has(s.img) && (
              <img
                src={`https://images.unsplash.com/${s.img}?w=900&h=1200&fit=crop&auto=format`}
                alt={s.caption}
                onError={() =>
                  setFailedSlides((prev) => new Set(prev).add(s.img))
                }
                className="h-full w-full object-cover"
              />
            )}
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-10">
          {SLIDES.map((s, i) => (
            <div
              key={s.img}
              className="transition-all duration-500"
              style={{
                opacity: active === i ? 1 : 0,
                transform: active === i ? "translateY(0)" : "translateY(12px)",
                position: active === i ? "relative" : "absolute",
                pointerEvents: active === i ? "auto" : "none",
              }}
            >
              <p className="mb-2 font-display text-3xl font-bold leading-tight text-white">
                {s.caption}
              </p>
              <p className="text-sm leading-relaxed text-white/70">{s.sub}</p>
            </div>
          ))}
          <div className="mt-6 flex gap-2">
            {SLIDES.map((s, i) => (
              <button
                key={s.img}
                type="button"
                aria-label={`Show slide ${i + 1}`}
                onClick={() => setActive(i)}
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: active === i ? "24px" : "8px",
                  background: active === i ? "#0097A7" : "rgba(255,255,255,0.4)",
                }}
              />
            ))}
          </div>
        </div>

        <div className="absolute left-8 top-8">
          <img
            src="/assets/name.png"
            alt="Palengkey"
            className="h-10 w-auto opacity-90 brightness-0 invert"
          />
        </div>
      </div>

      {/* Right: form panel */}
      <div className="flex flex-1 items-center justify-center bg-[#F7FAFA] px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:hidden">
            <img
              src="/assets/name.png"
              alt="Palengkey"
              className="mx-auto mb-2 h-14 w-auto"
            />
            <p className="text-sm text-[#66777C]">Fresh market goodness, delivered.</p>
          </div>

          <div className="mb-7">
            <h1 className="mb-1 font-display text-3xl font-bold text-[#203238]">
              Welcome back
            </h1>
            <p className="text-sm text-[#66777C]">Sign in to continue shopping fresh.</p>
          </div>

          <div className="mb-6 space-y-3">
            <button
              type="button"
              onClick={() => showToast("Google sign-in is coming soon.", "info")}
              className="flex w-full items-center gap-3 rounded-xl border border-[#DDE9EA] bg-white px-4 py-3 transition-all hover:border-[#0097A7] hover:shadow-sm active:scale-[0.98]"
            >
              <GoogleIcon />
              <span className="flex-1 text-center text-sm font-semibold text-[#203238]">
                Continue with Google
              </span>
            </button>

            <div className="group relative">
              <button
                type="button"
                disabled
                className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl border border-[#DDE9EA] bg-white px-4 py-3 opacity-50"
              >
                <AppleIcon />
                <span className="flex-1 text-center text-sm font-semibold text-[#203238]">
                  Continue with Apple
                </span>
                <span className="shrink-0 rounded-full bg-[#66777C] px-2 py-0.5 text-[10px] font-bold text-white">
                  Soon
                </span>
              </button>
              <div className="pointer-events-none absolute -bottom-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#203238] px-3 py-1.5 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                Apple Sign-In coming soon!
                <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-[#203238]" />
              </div>
            </div>
          </div>

          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#DDE9EA]" />
            <span className="text-xs font-medium text-[#66777C]">
              or sign in with email
            </span>
            <div className="h-px flex-1 bg-[#DDE9EA]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="mb-1.5 block text-sm font-medium text-[#203238]"
              >
                Email Address
              </label>
              <div
                className="flex items-center overflow-hidden rounded-xl border bg-white transition-all"
                style={{
                  borderColor: errors.email ? "#F05A47" : "#DDE9EA",
                  boxShadow: errors.email ? "0 0 0 3px rgba(240,90,71,0.08)" : "none",
                }}
              >
                <span className="border-r border-[#DDE9EA] bg-[#F7FAFA] px-3 py-3.5 text-[#66777C]">
                  <Mail className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <input
                  id="login-email"
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="flex-1 bg-white px-4 py-3.5 text-sm text-[#203238] outline-none"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-[11px] text-[#F05A47]">{errors.email}</p>
              )}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="login-password" className="text-sm font-medium text-[#203238]">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-[#0097A7] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div
                className="flex items-center overflow-hidden rounded-xl border bg-white transition-all"
                style={{
                  borderColor: errors.password ? "#F05A47" : "#DDE9EA",
                  boxShadow: errors.password ? "0 0 0 3px rgba(240,90,71,0.08)" : "none",
                }}
              >
                <span className="border-r border-[#DDE9EA] bg-[#F7FAFA] px-3 py-3.5 text-[#66777C]">
                  <Lock className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="flex-1 bg-white px-4 py-3.5 text-sm text-[#203238] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="px-3 text-[#66777C] transition-colors hover:text-[#203238]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" strokeWidth={1.8} />
                  ) : (
                    <Eye className="h-4 w-4" strokeWidth={1.8} />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-[11px] text-[#F05A47]">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0097A7] py-3.5 font-bold text-white shadow-sm transition-all hover:bg-[#006D77] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Sign In"}{" "}
              <ChevronRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 space-y-3 text-center">
            <p className="text-xs text-[#66777C]">
              By signing in you agree to our{" "}
              <Link to="/terms-of-service" className="text-[#0097A7] hover:underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link to="/privacy-policy" className="text-[#0097A7] hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
            <div className="border-t border-[#DDE9EA] pt-3">
              <p className="text-sm text-[#66777C]">
                New to Palengkey?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-[#0097A7] hover:underline"
                >
                  Create Account
                </Link>
              </p>
            </div>
            <Link
              to="/shop"
              className="block pt-1 text-sm text-[#66777C] transition-colors hover:text-[#203238]"
            >
              ← Continue as Guest
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
