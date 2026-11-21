import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PkField from "@/components/pk/PkField";
import { ButtonSpinner, Spinner } from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import {
  discountIdQueryKey,
  getDiscountId,
  submitDiscountId,
} from "@/services/api/discountId";
import { useToastStore } from "@/stores/toastStore";
import type { DiscountIdType } from "@/types/discountId";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";

const STATUS_TEXT = {
  pending: {
    title: "Your ID is being reviewed",
    body: "We'll check it shortly. Once approved, you can turn on the discount at checkout.",
    color: "#b45309",
    background: "#fff7ed",
  },
  approved: {
    title: "Your ID is approved",
    body: "Turn on “Apply PWD / Senior discount” at checkout to get 20% off the delivery fee (VAT-exclusive).",
    color: "#15803d",
    background: "#f0fdf4",
  },
  rejected: {
    title: "Your ID was not approved",
    body: "Please upload it again.",
    color: "#b91c1c",
    background: "#fef2f2",
  },
} as const;

function FileField({
  label,
  hint,
  file,
  error,
  onChange,
}: {
  label: string;
  hint?: string;
  file: File | null;
  error?: string;
  onChange: (file: File | null) => void;
}) {
  return (
    <label>
      {label}
      <input
        type="file"
        accept={ACCEPT}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
      {file && <small>{file.name}</small>}
      {hint && !error && <small style={{ color: "var(--muted, #64748b)" }}>{hint}</small>}
      {error && <small style={{ color: "#dc2626", fontWeight: 500 }}>{error}</small>}
    </label>
  );
}

/**
 * The customer's PWD / Senior Citizen ID: its review status, and the upload form
 * when there's no ID yet or the last one was rejected.
 */
export default function DiscountIdPanel() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [type, setType] = useState<DiscountIdType>("pwd");
  const [idNumber, setIdNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: current, isLoading, isError, refetch } = useQuery({
    queryKey: discountIdQueryKey,
    queryFn: getDiscountId,
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      submitDiscountId({
        type,
        id_number: idNumber.trim(),
        full_name: fullName.trim(),
        front: front!,
        back: back!,
        selfie,
      }),
    onSuccess: (saved) => {
      queryClient.setQueryData(discountIdQueryKey, saved);
      showToast("ID submitted. We'll review it shortly.", "success");
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Could not upload your ID.", "error");
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (idNumber.trim().length < 3) next.idNumber = "Enter the ID number.";
    if (!fullName.trim()) next.fullName = "Enter the name shown on the ID.";
    if (!front) next.front = "Add a photo of the front of the ID.";
    if (!back) next.back = "Add a photo of the back of the ID.";
    for (const [key, file] of Object.entries({ front, back, selfie })) {
      if (file && file.size > MAX_BYTES) next[key] = "Photo is too large (5 MB max).";
    }
    setErrors(next);
    if (Object.keys(next).length === 0) submitMutation.mutate();
  }

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
        <Spinner />
      </div>
    );
  }
  if (isError) return <ErrorState onRetry={() => void refetch()} />;

  const status = current ? STATUS_TEXT[current.status] : null;
  const showForm = !current || current.status === "rejected";

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {current && status && (
        <div
          role="status"
          style={{ padding: 14, borderRadius: 12, color: status.color, background: status.background }}
        >
          <strong style={{ display: "block", marginBottom: 4 }}>{status.title}</strong>
          <span style={{ fontSize: 13 }}>
            {current.type_label} ID · {current.id_number} · {current.full_name}
          </span>
          <p style={{ margin: "6px 0 0", fontSize: 13 }}>
            {current.status === "rejected" && current.review_notes
              ? `Reason: ${current.review_notes}. ${status.body}`
              : status.body}
          </p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: 14 }}>
          <label>
            ID type
            <select value={type} onChange={(event) => setType(event.target.value as DiscountIdType)}>
              <option value="pwd">PWD ID (DOH-registered)</option>
              <option value="senior">Senior Citizen ID (OSCA or government ID, age 60+)</option>
            </select>
          </label>
          <PkField
            label="ID number"
            value={idNumber}
            maxLength={50}
            onChange={(event) => setIdNumber(event.target.value)}
            error={errors.idNumber}
          />
          <PkField
            label="Full name on the ID"
            value={fullName}
            maxLength={255}
            autoComplete="name"
            onChange={(event) => setFullName(event.target.value)}
            error={errors.fullName}
          />
          <FileField label="Front of the ID" file={front} error={errors.front} onChange={setFront} />
          <FileField label="Back of the ID" file={back} error={errors.back} onChange={setBack} />
          <FileField
            label="Selfie holding the ID (optional)"
            hint="Helps us approve first-time applications faster."
            file={selfie}
            error={errors.selfie}
            onChange={setSelfie}
          />

          <p style={{ margin: 0, fontSize: 12, color: "var(--muted, #64748b)" }}>
            Use clear, unedited photos. The discount is 20% off the delivery fee (VAT-exclusive)
            and can&apos;t be combined with vouchers. Show the original ID to the rider on delivery;
            otherwise the discount is collected in cash. Your ID is used only to verify the
            discount (Data Privacy Act of 2012).
          </p>

          <button type="submit" className="btn primary" disabled={submitMutation.isPending}>
            {submitMutation.isPending && <ButtonSpinner />}
            {submitMutation.isPending ? "Uploading…" : "Submit ID for review"}
          </button>
        </form>
      )}
    </div>
  );
}
