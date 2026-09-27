import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { register } from "@/services/api/auth";
import { useAuthStore } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { getDeviceId } from "@/utils/deviceId";
import type { OtpChannel } from "@/types/auth";

const PHONE_PATTERN = /^\d{10}$/;

const FEATURED_IMAGES = [
  "photo-1695653422259-8a74ffe90401",
  "photo-1582284540020-8acbe03f4924",
  "photo-1629637272678-9b0d5a41b1e5",
];

const PERKS = [
  { emoji: "🚀", label: "Same-day delivery" },
  { emoji: "🥬", label: "Market-fresh produce" },
  { emoji: "🔒", label: "Secure & easy checkout" },
  { emoji: "🍱", label: "Paluto — stall-cooked meals" },
];

interface FormValues {
  fname: string;
  mname: string;
  lname: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
}

const initialValues: FormValues = {
  fname: "",
  mname: "",
  lname: "",
  email: "",
  phone: "",
  password: "",
  password_confirmation: "",
};

function validate(
  values: FormValues,
  privacy: boolean,
  terms: boolean,
): Partial<Record<keyof FormValues | "privacy" | "terms", string>> {
  const errors: Partial<Record<keyof FormValues | "privacy" | "terms", string>> = {};

  if (!values.fname.trim()) errors.fname = "Required";
  if (!values.lname.trim()) errors.lname = "Required";
  if (!/^\S+@\S+\.\S+$/.test(values.email)) errors.email = "Valid email required";
  if (!PHONE_PATTERN.test(values.phone))
    errors.phone = "Valid 10-digit mobile number required";
  if (values.password.length < 8) errors.password = "At least 8 characters";
  if (values.password_confirmation !== values.password) {
    errors.password_confirmation = "Passwords do not match";
  }
  if (!privacy) errors.privacy = "Required";
  if (!terms) errors.terms = "Required";

  return errors;
}

function fieldBorder(hasError?: boolean, isFocused?: boolean) {
  return {
    borderColor: hasError ? "#F05A47" : isFocused ? "#0097A7" : "#DDE9EA",
    boxShadow: hasError
      ? "0 0 0 3px rgba(240,90,71,0.08)"
      : isFocused
        ? "0 0 0 3px rgba(0,151,167,0.08)"
        : "none",
  };
}

export default function RegisterForm() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [otpMethod, setOtpMethod] = useState<"phone" | "email" | "both">("phone");
  const [focused, setFocused] = useState("");
  const [errors, setErrors] = useState<ReturnType<typeof validate>>({});
  const [submitting, setSubmitting] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const setSession = useAuthStore((state) => state.setSession);
  const showToast = useToastStore((state) => state.showToast);
  const navigate = useNavigate();

  const set = (key: keyof FormValues) => (event: ChangeEvent<HTMLInputElement>) =>
    setValues((prev) => ({ ...prev, [key]: event.target.value }));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const validationErrors = validate(values, agreedPrivacy, agreedTerms);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const { token, user } = await register({
        fname: values.fname.trim(),
        mname: values.mname.trim() || undefined,
        lname: values.lname.trim(),
        email: values.email.trim(),
        phone: `+63${values.phone.trim()}`,
        password: values.password,
        password_confirmation: values.password_confirmation,
        privacy_policy: agreedPrivacy,
        terms_conditions: agreedTerms,
        device_id: getDeviceId(),
      });

      if (token) {
        await setSession(token, user);
      }

      // Send the OTP via whichever channel(s) the customer picked, then land
      // straight on the code-entry step (no separate channel-choice screen —
      // that choice was already made here).
      const channels: OtpChannel[] =
        otpMethod === "both"
          ? ["email", "sms"]
          : [otpMethod === "phone" ? "sms" : "email"];

      navigate("/verify-otp", {
        state: { email: user.email, channels },
      });
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Registration failed.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-full">
      {/* Left: form panel */}
      <div className="flex flex-1 items-start justify-center overflow-y-auto bg-white px-6 py-10">
        <div className="w-full max-w-md">
          <div className="mb-7">
            <img src="/assets/name.png" alt="Palengkey" className="mb-5 h-11 w-auto" />
            <h1 className="mb-1 font-display text-2xl font-bold text-[#203238]">
              Create your account
            </h1>
            <p className="text-sm text-[#66777C]">
              Ang paboritong palengke mo, online na — sign up to get started.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#203238]">
                  First Name <span className="text-[#F05A47]">*</span>
                </label>
                <div
                  className="flex items-center overflow-hidden rounded-xl border bg-white transition-all"
                  style={fieldBorder(Boolean(errors.fname), focused === "fname")}
                >
                  <span className="border-r border-[#DDE9EA] bg-[#F7FAFA] px-3 py-3 text-[#66777C]">
                    <User className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <input
                    type="text"
                    placeholder="Maria"
                    value={values.fname}
                    onChange={set("fname")}
                    onFocus={() => setFocused("fname")}
                    onBlur={() => setFocused("")}
                    className="min-w-0 flex-1 bg-white px-3 py-3 text-sm text-[#203238] outline-none"
                  />
                </div>
                {errors.fname && (
                  <p className="mt-1 text-[10px] text-[#F05A47]">{errors.fname}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#203238]">
                  Last Name <span className="text-[#F05A47]">*</span>
                </label>
                <div
                  className="flex items-center overflow-hidden rounded-xl border bg-white transition-all"
                  style={fieldBorder(Boolean(errors.lname), focused === "lname")}
                >
                  <input
                    type="text"
                    placeholder="Santos"
                    value={values.lname}
                    onChange={set("lname")}
                    onFocus={() => setFocused("lname")}
                    onBlur={() => setFocused("")}
                    className="min-w-0 flex-1 bg-white px-3 py-3 text-sm text-[#203238] outline-none"
                  />
                </div>
                {errors.lname && (
                  <p className="mt-1 text-[10px] text-[#F05A47]">{errors.lname}</p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#203238]">
                Middle Name
                <span className="rounded-full border border-[#DDE9EA] bg-[#F7FAFA] px-1.5 py-0.5 text-[10px] font-normal text-[#66777C]">
                  Optional
                </span>
              </label>
              <div
                className="flex items-center overflow-hidden rounded-xl border bg-white transition-all"
                style={fieldBorder(false, focused === "mname")}
              >
                <span className="border-r border-[#DDE9EA] bg-[#F7FAFA] px-3 py-3 text-[#66777C]">
                  <User className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <input
                  type="text"
                  placeholder="Reyes"
                  value={values.mname}
                  onChange={set("mname")}
                  onFocus={() => setFocused("mname")}
                  onBlur={() => setFocused("")}
                  className="flex-1 bg-white px-3 py-3 text-sm text-[#203238] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#203238]">
                Email Address <span className="text-[#F05A47]">*</span>
              </label>
              <div
                className="flex items-center overflow-hidden rounded-xl border bg-white transition-all"
                style={fieldBorder(Boolean(errors.email), focused === "email")}
              >
                <span className="border-r border-[#DDE9EA] bg-[#F7FAFA] px-3 py-3 text-[#66777C]">
                  <Mail className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <input
                  type="email"
                  placeholder="maria@email.com"
                  value={values.email}
                  onChange={set("email")}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused("")}
                  className="flex-1 bg-white px-3 py-3 text-sm text-[#203238] outline-none"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-[10px] text-[#F05A47]">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#203238]">
                Mobile Number <span className="text-[#F05A47]">*</span>
              </label>
              <div
                className="flex items-center overflow-hidden rounded-xl border bg-white transition-all"
                style={fieldBorder(Boolean(errors.phone), focused === "phone")}
              >
                <span className="border-r border-[#DDE9EA] bg-[#F7FAFA] px-3 py-3 text-[#66777C]">
                  <Phone className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <span className="border-r border-[#DDE9EA] bg-[#F7FAFA] px-3 py-3 text-sm font-semibold text-[#66777C]">
                  +63
                </span>
                <input
                  type="tel"
                  placeholder="9XXXXXXXXX"
                  value={values.phone}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      phone: event.target.value.replace(/\D/g, "").slice(0, 10),
                    }))
                  }
                  onFocus={() => setFocused("phone")}
                  onBlur={() => setFocused("")}
                  maxLength={10}
                  inputMode="numeric"
                  className="flex-1 bg-white px-3 py-3 text-sm text-[#203238] outline-none"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-[10px] text-[#F05A47]">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#203238]">
                Password <span className="text-[#F05A47]">*</span>
              </label>
              <div
                className="flex items-center overflow-hidden rounded-xl border bg-white transition-all"
                style={fieldBorder(Boolean(errors.password), focused === "password")}
              >
                <span className="border-r border-[#DDE9EA] bg-[#F7FAFA] px-3 py-3 text-[#66777C]">
                  <Lock className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={values.password}
                  onChange={set("password")}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused("")}
                  className="flex-1 bg-white px-3 py-3 text-sm text-[#203238] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
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
                <p className="mt-1 text-[10px] text-[#F05A47]">{errors.password}</p>
              )}
              {values.password && (
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="h-1 flex-1 rounded-full transition-colors"
                      style={{
                        background:
                          values.password.length >= n * 2
                            ? values.password.length >= 8
                              ? "#159447"
                              : values.password.length >= 6
                                ? "#F0A500"
                                : "#F05A47"
                            : "#DDE9EA",
                      }}
                    />
                  ))}
                  <span className="ml-1 self-center text-[10px] text-[#66777C]">
                    {values.password.length < 4
                      ? "Weak"
                      : values.password.length < 8
                        ? "Fair"
                        : "Strong"}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#203238]">
                Confirm Password <span className="text-[#F05A47]">*</span>
              </label>
              <div
                className="flex items-center overflow-hidden rounded-xl border bg-white transition-all"
                style={fieldBorder(
                  Boolean(errors.password_confirmation),
                  focused === "confirm",
                )}
              >
                <span className="border-r border-[#DDE9EA] bg-[#F7FAFA] px-3 py-3 text-[#66777C]">
                  <Lock className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={values.password_confirmation}
                  onChange={set("password_confirmation")}
                  onFocus={() => setFocused("confirm")}
                  onBlur={() => setFocused("")}
                  className="flex-1 bg-white px-3 py-3 text-sm text-[#203238] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="px-3 text-[#66777C] transition-colors hover:text-[#203238]"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" strokeWidth={1.8} />
                  ) : (
                    <Eye className="h-4 w-4" strokeWidth={1.8} />
                  )}
                </button>
              </div>
              {errors.password_confirmation && (
                <p className="mt-1 text-[10px] text-[#F05A47]">
                  {errors.password_confirmation}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#203238]">
                <MessageSquare
                  className="h-3.5 w-3.5 text-[#0097A7]"
                  aria-hidden="true"
                />
                Send OTP verification via
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { value: "phone", label: "SMS", icon: "📱" },
                    { value: "email", label: "Email", icon: "📧" },
                    { value: "both", label: "Both", icon: "✉️" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setOtpMethod(opt.value)}
                    className="flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-2.5 text-xs font-semibold transition-all"
                    style={{
                      borderColor: otpMethod === opt.value ? "#0097A7" : "#DDE9EA",
                      background:
                        otpMethod === opt.value ? "rgba(0,151,167,0.06)" : "white",
                      color: otpMethod === opt.value ? "#0097A7" : "#66777C",
                    }}
                  >
                    <span className="text-base">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <label className="group flex cursor-pointer items-start gap-3">
                <button
                  type="button"
                  onClick={() => setAgreedPrivacy((v) => !v)}
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all"
                  style={{
                    borderColor: errors.privacy
                      ? "#F05A47"
                      : agreedPrivacy
                        ? "#0097A7"
                        : "#DDE9EA",
                    background: agreedPrivacy ? "#0097A7" : "white",
                  }}
                >
                  {agreedPrivacy && (
                    <svg
                      className="h-3 w-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
                <span className="text-xs leading-relaxed text-[#66777C]">
                  I have read and agree to the{" "}
                  <Link
                    to="/privacy-policy"
                    target="_blank"
                    className="font-semibold text-[#0097A7] hover:underline"
                  >
                    Privacy Policy
                  </Link>{" "}
                  of Palengkey.
                </span>
              </label>
              {errors.privacy && (
                <p className="-mt-1 ml-8 text-[10px] text-[#F05A47]">{errors.privacy}</p>
              )}

              <label className="group flex cursor-pointer items-start gap-3">
                <button
                  type="button"
                  onClick={() => setAgreedTerms((v) => !v)}
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all"
                  style={{
                    borderColor: errors.terms
                      ? "#F05A47"
                      : agreedTerms
                        ? "#0097A7"
                        : "#DDE9EA",
                    background: agreedTerms ? "#0097A7" : "white",
                  }}
                >
                  {agreedTerms && (
                    <svg
                      className="h-3 w-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
                <span className="text-xs leading-relaxed text-[#66777C]">
                  I agree to the{" "}
                  <Link
                    to="/terms-of-service"
                    target="_blank"
                    className="font-semibold text-[#0097A7] hover:underline"
                  >
                    Terms and Conditions
                  </Link>{" "}
                  of Palengkey.
                </span>
              </label>
              {errors.terms && (
                <p className="-mt-1 ml-8 text-[10px] text-[#F05A47]">{errors.terms}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0097A7] py-3.5 font-bold text-white shadow-sm transition-all hover:bg-[#006D77] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating account…" : "Create Account"}{" "}
              <ChevronRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-5 border-t border-[#DDE9EA] pt-5 text-center">
            <p className="text-sm text-[#66777C]">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-[#0097A7] hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right: image panel */}
      <div className="relative hidden overflow-hidden bg-[#006D77] lg:flex lg:w-[42%]">
        <div className="absolute inset-0 grid grid-rows-3 gap-1">
          {FEATURED_IMAGES.map((img) => (
            <div key={img} className="overflow-hidden">
              {!failedImages.has(img) && (
                <img
                  src={`https://images.unsplash.com/${img}?w=700&h=400&fit=crop&auto=format`}
                  alt=""
                  onError={() => setFailedImages((prev) => new Set(prev).add(img))}
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              )}
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#006D77]/80 via-transparent to-[#006D77]/60" />
        <div className="relative z-10 flex w-full flex-col justify-between p-10">
          <img
            src="/assets/name.png"
            alt="Palengkey"
            className="h-10 w-auto opacity-90 brightness-0 invert"
          />
          <div>
            <p className="mb-5 font-display text-2xl font-bold leading-tight text-white">
              Everything from your palengke, without leaving home.
            </p>
            <div className="space-y-3">
              {PERKS.map((p) => (
                <div key={p.label} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-lg">
                    {p.emoji}
                  </span>
                  <span className="text-sm font-medium text-white/90">{p.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
