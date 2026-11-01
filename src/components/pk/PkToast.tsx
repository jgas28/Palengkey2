import { createPortal } from "react-dom";
import Icon from "@/components/pk/Icon";
import { useToastStore } from "@/stores/toastStore";

/**
 * The design's dark pill toast — customer app only (admin keeps ToastContainer).
 * Rendered on the body: inside a grid page like .auth-page its wrapper would
 * become a grid item and add a row, squeezing the page whenever a toast shows.
 */
export default function PkToast() {
  const { toasts, dismissToast } = useToastStore();
  const toast = toasts[toasts.length - 1];

  if (!toast) return null;

  return createPortal(
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
    </div>,
    document.body,
  );
}
