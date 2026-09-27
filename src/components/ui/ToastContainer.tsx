import { useToastStore, type ToastVariant } from "@/stores/toastStore";

const variantClasses: Record<ToastVariant, string> = {
  success: "bg-status-delivered text-white",
  error: "bg-status-cancelled text-white",
  info: "bg-text text-white",
};

export default function ToastContainer() {
  const { toasts, dismissToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-20 z-40 flex flex-col items-center gap-2 px-4 md:bottom-6"
    >
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => dismissToast(toast.id)}
          className={`w-full max-w-sm rounded-lg px-4 py-3 text-left text-sm shadow-lg ${variantClasses[toast.variant]}`}
        >
          {toast.message}
        </button>
      ))}
    </div>
  );
}
