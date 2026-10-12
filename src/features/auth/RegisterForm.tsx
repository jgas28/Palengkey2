import { useState, type ChangeEvent, type CSSProperties, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGoogleSignIn } from "@/features/auth/useGoogleSignIn";
import { GoogleGIcon } from "@/components/icons/BrandIcons";
import AuthShell from "@/features/auth/AuthShell";
import { register } from "@/services/api/auth";
import { useAuthStore } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { getDeviceId } from "@/utils/deviceId";
import type { OtpChannel } from "@/types/auth";

const PHONE_PATTERN = /^\d{10}$/;

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

export default function RegisterForm() {
  const { signIn: signInWithGoogle, loading: googleLoading } = useGoogleSignIn();
  const [values, setValues] = useState<FormValues>(initialValues);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [otpMethod, setOtpMethod] = useState<"phone" | "email" | "both">("phone");
  const [errors, setErrors] = useState<ReturnType<typeof validate>>({});
  const [submitting, setSubmitting] = useState(false);
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

  const errorText = (key: keyof typeof errors) =>
    errors[key] ? (
      <small style={{ color: "#dc2626", fontWeight: 500 }}>{errors[key]}</small>
    ) : null;
  const errorBorder = (key: keyof typeof errors) =>
    errors[key] ? { borderColor: "#dc2626" } : undefined;
  const checkboxRow: CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    fontWeight: 500,
    lineHeight: 1.5,
  };

  return (
    <AuthShell>
      <p className="kicker">Join Palengkey</p>
      <h1>Create your account</h1>
      <p>Fresh market shopping starts here.</p>
      <button
        type="button"
        className="btn social-login"
        disabled={googleLoading}
        onClick={() => void signInWithGoogle()}
      >
        <GoogleGIcon />{" "}
        <span>{googleLoading ? "Opening Google…" : "Sign up with Google"}</span>
      </button>
      <div className="divider">
        <span>or sign up with email</span>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <label>
            First name *
            <input
              value={values.fname}
              onChange={set("fname")}
              placeholder="Juan"
              style={errorBorder("fname")}
            />
            {errorText("fname")}
          </label>
          <label>
            Last name *
            <input
              value={values.lname}
              onChange={set("lname")}
              placeholder="Dela Cruz"
              style={errorBorder("lname")}
            />
            {errorText("lname")}
          </label>
        </div>
        <label>
          Middle name{" "}
          <small style={{ color: "var(--muted)", fontWeight: 400 }}>Optional</small>
          <input value={values.mname} onChange={set("mname")} placeholder="Santos" />
        </label>
        <label>
          Email address *
          <input
            type="email"
            value={values.email}
            onChange={set("email")}
            placeholder="you@example.com"
            style={errorBorder("email")}
          />
          {errorText("email")}
        </label>
        <label>
          Mobile number *
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <b
              style={{
                padding: "13px 10px",
                background: "var(--bg)",
                border: "1px solid #cfdddd",
                borderRadius: 10,
                fontSize: 11,
              }}
            >
              +63
            </b>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={values.phone}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  phone: event.target.value.replace(/\D/g, "").slice(0, 10),
                }))
              }
              placeholder="9XX XXX XXXX"
              style={errorBorder("phone")}
            />
          </span>
          {errorText("phone")}
        </label>
        <label>
          Password *
          <span style={{ position: "relative", display: "block" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={values.password}
              onChange={set("password")}
              placeholder="At least 8 characters"
              style={{ ...errorBorder("password"), paddingRight: 64 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--teal-dark)",
                background: "none",
                border: 0,
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </span>
          {errorText("password")}
        </label>
        <label>
          Confirm password *
          <span style={{ position: "relative", display: "block" }}>
            <input
              type={showConfirm ? "text" : "password"}
              value={values.password_confirmation}
              onChange={set("password_confirmation")}
              placeholder="Type it again"
              style={{ ...errorBorder("password_confirmation"), paddingRight: 64 }}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((prev) => !prev)}
              aria-label={showConfirm ? "Hide password" : "Show password"}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--teal-dark)",
                background: "none",
                border: 0,
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {showConfirm ? "Hide" : "Show"}
            </button>
          </span>
          {errorText("password_confirmation")}
        </label>

        <div style={{ margin: "4px 0 14px" }}>
          <p
            style={{ margin: "0 0 8px", color: "#445255", fontSize: 10, fontWeight: 700 }}
          >
            Send my verification code by
          </p>
          <div className="filter-pills" style={{ display: "inline-flex" }}>
            {(
              [
                ["phone", "SMS"],
                ["email", "Email"],
                ["both", "Both"],
              ] as const
            ).map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={otpMethod === value ? "active" : ""}
                onClick={() => setOtpMethod(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <label style={checkboxRow}>
          <input
            type="checkbox"
            checked={agreedPrivacy}
            onChange={(event) => setAgreedPrivacy(event.target.checked)}
            style={{ width: 16, padding: 0, accentColor: "var(--teal)" }}
          />
          <span>
            I agree to the{" "}
            <Link
              to="/privacy-policy"
              style={{ color: "var(--teal-dark)", fontWeight: 700 }}
            >
              Privacy Policy
            </Link>
            {errors.privacy && (
              <small style={{ display: "block", color: "#dc2626" }}>Required</small>
            )}
          </span>
        </label>
        <label style={checkboxRow}>
          <input
            type="checkbox"
            checked={agreedTerms}
            onChange={(event) => setAgreedTerms(event.target.checked)}
            style={{ width: 16, padding: 0, accentColor: "var(--teal)" }}
          />
          <span>
            I agree to the{" "}
            <Link
              to="/terms-of-service"
              style={{ color: "var(--teal-dark)", fontWeight: 700 }}
            >
              Terms of Service
            </Link>
            {errors.terms && (
              <small style={{ display: "block", color: "#dc2626" }}>Required</small>
            )}
          </span>
        </label>

        <button type="submit" className="btn primary auth-submit" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="auth-switch">
        Already have an account?{" "}
        <button type="button" onClick={() => navigate("/login")}>
          Log in
        </button>
      </p>
      <button type="button" className="guest" onClick={() => navigate("/shop")}>
        ← Continue as guest
      </button>
    </AuthShell>
  );
}
