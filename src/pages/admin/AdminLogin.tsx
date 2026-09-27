import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { adminLogin } from "@/services/api/adminAuth";
import { useAdminAuthStore } from "@/stores/adminAuthStore";
import { useToastStore } from "@/stores/toastStore";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const setSession = useAdminAuthStore((state) => state.setSession);
  const showToast = useToastStore((state) => state.showToast);
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const nextErrors: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = "Enter a valid email.";
    if (!password) nextErrors.password = "Password is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const { token, user } = await adminLogin({ email: email.trim(), password });
      await setSession(token, user);
      navigate("/admin", { replace: true });
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Login failed.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center overflow-hidden bg-gradient-brand px-4 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent/25 blur-3xl"
      />
      <div className="relative w-full max-w-sm">
        <p className="mb-1 text-center text-2xl font-semibold text-white">Palengkey</p>
        <p className="mb-8 text-center text-sm text-white/80">Admin Panel</p>
        <div className="animate-scale-in rounded-card bg-surface p-6 shadow-lifted">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <h1 className="text-lg font-semibold">Log in</h1>

            <Input
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={errors.email}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={errors.password}
            />

            <Button type="submit" fullWidth loading={submitting}>
              Log in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
