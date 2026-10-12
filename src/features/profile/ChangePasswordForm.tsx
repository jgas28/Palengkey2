import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import PkField from "@/components/pk/PkField";
import { changePassword } from "@/services/api/profile";
import { useAuthStore } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const clearSession = useAuthStore((state) => state.clearSession);
  const showToast = useToastStore((state) => state.showToast);
  const navigate = useNavigate();

  const changeMutation = useMutation({
    mutationFn: (payload: Parameters<typeof changePassword>[0]) =>
      changePassword(payload),
    onSuccess: async ({ message }) => {
      // The backend revokes every token (including this session's) on password change.
      await clearSession();
      showToast(`${message}`, "success");
      navigate("/login", { replace: true });
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Could not change password.",
        "error",
      );
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (!currentPassword) nextErrors.currentPassword = "Current password is required.";
    if (password.length < 12 || !PASSWORD_PATTERN.test(password)) {
      nextErrors.password =
        "At least 12 characters, with uppercase, lowercase, a number, and a special character.";
    }
    if (passwordConfirmation !== password) {
      nextErrors.passwordConfirmation = "Passwords do not match.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    changeMutation.mutate({
      current_password: currentPassword,
      password,
      password_confirmation: passwordConfirmation,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: 14 }}>
      <PkField
        label="Current password"
        type="password"
        autoComplete="current-password"
        value={currentPassword}
        onChange={(event) => setCurrentPassword(event.target.value)}
        error={errors.currentPassword}
      />
      <PkField
        label="New password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={errors.password}
      />
      <PkField
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        value={passwordConfirmation}
        onChange={(event) => setPasswordConfirmation(event.target.value)}
        error={errors.passwordConfirmation}
      />

      <button type="submit" className="btn primary" disabled={changeMutation.isPending}>
        Change password
      </button>
    </form>
  );
}
