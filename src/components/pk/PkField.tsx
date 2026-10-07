import type { InputHTMLAttributes, ReactNode } from "react";

export interface PkFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
  error?: string;
}

/** Label + input + error in the design's form style (inherits .auth-card / .checkout-card / .address-form label rules). */
export default function PkField({ label, error, style, ...input }: PkFieldProps) {
  return (
    <label>
      {label}
      <input
        {...input}
        aria-invalid={Boolean(error)}
        style={error ? { ...style, borderColor: "#dc2626" } : style}
      />
      {error && <small style={{ color: "#dc2626", fontWeight: 500 }}>{error}</small>}
    </label>
  );
}
