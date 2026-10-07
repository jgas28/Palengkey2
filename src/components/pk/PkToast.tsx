import Icon from "@/components/pk/Icon";
import { useToastStore } from "@/stores/toastStore";

/** The design's dark pill toast — customer app only (admin keeps ToastContainer). */
export default function PkToast() {
  const { toasts, dismissToast } = useToastStore();
  const toast = toasts[toasts.length - 1];

  if (!toast) return null;

  return (
    <div role="status" aria-live="polite">
      <button
        type="button"
        className="toast"
        onClick={() => dismissToast(toast.id)}
        style={{ border: 0 }}
      >
        <span style={toast.variant === "error" ? { background: "#f19a9a" } : undefined}>
          <Icon name={toast.variant === "error" ? "x" : "check"} size={16} />
        </span>
        {toast.message}
      </button>
    </div>
  );
}
