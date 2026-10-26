import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useToastStore, type ToastVariant } from "@/stores/toastStore";

const VARIANTS: Record<
  ToastVariant,
  { icon: typeof CheckCircle2; iconClass: string; ring: string; label: string }
> = {
  success: {
    icon: CheckCircle2,
    iconClass: "bg-emerald-50 text-emerald-600",
    ring: "border-emerald-200",
    label: "Success",
  },
  error: {
    icon: XCircle,
    iconClass: "bg-rose-50 text-rose-600",
    ring: "border-rose-200",
    label: "Error",
  },
  info: {
    icon: Info,
    iconClass: "bg-primary-50 text-primary-700",
    ring: "border-slate-200",
    label: "Notice",
  },
};

/**
 * Admin toasts: top-right cards above everything, including open modals
 * (they used to sit under the modal overlay and go unseen).
 */
export default function ToastContainer() {
  const { toasts, dismissToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 top-4 z-[70] flex flex-col items-end gap-2 sm:left-auto sm:right-6 sm:top-6"
    >
      {toasts.map((toast) => {
        const v = VARIANTS[toast.variant];
        const Icon = v.icon;
        return (
          <div
            key={toast.id}
            role={toast.variant === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex w-full max-w-sm animate-scale-in items-start gap-3 rounded-2xl border bg-white p-3.5 shadow-[0_12px_32px_rgba(16,24,40,0.14)] ${v.ring}`}
          >
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${v.iconClass}`}
            >
              <Icon size={18} aria-hidden="true" />
            </span>
            <p className="min-w-0 flex-1 pt-1 text-sm leading-5 text-slate-800">
              <span className="sr-only">{v.label}: </span>
              {toast.message}
            </p>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
