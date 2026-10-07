import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import PkField from "@/components/pk/PkField";
import { updateProfile } from "@/services/api/profile";
import { refreshCurrentUser } from "@/features/profile/refreshCurrentUser";
import { useAuthStore } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";

const PHONE_PATTERN = /^\+63\d{10}$/;

export default function EditProfileForm() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);

  const [fname, setFname] = useState(user?.fname ?? "");
  const [mname, setMname] = useState(user?.mname ?? "");
  const [lname, setLname] = useState(user?.lname ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "+63");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateProfile>[0]) => updateProfile(payload),
    onSuccess: async ({ message }) => {
      await refreshCurrentUser();
      showToast(message, "success");
      navigate("/profile");
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Update failed.", "error");
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (!fname.trim()) nextErrors.fname = "First name is required.";
    if (!lname.trim()) nextErrors.lname = "Last name is required.";
    if (phone && !PHONE_PATTERN.test(phone)) {
      nextErrors.phone = "Use +63 followed by 10 digits, e.g. +639171234567.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    updateMutation.mutate({
      fname: fname.trim(),
      mname: mname.trim() || undefined,
      lname: lname.trim(),
      phone: phone.trim() || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: 14 }}>

      <PkField
        label="First name"
        value={fname}
        onChange={(event) => setFname(event.target.value)}
        error={errors.fname}
      />
      <PkField
        label="Middle name (optional)"
        value={mname}
        onChange={(event) => setMname(event.target.value)}
      />
      <PkField
        label="Last name"
        value={lname}
        onChange={(event) => setLname(event.target.value)}
        error={errors.lname}
      />
      <PkField
        label="Phone"
        type="tel"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        error={errors.phone}
      />

      <button type="submit" className="btn primary" disabled={updateMutation.isPending}>
        {updateMutation.isPending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
