import {
  normalizeOrderStatus,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STEPS,
} from "@/features/orders/orderStatus";

export default function OrderStatusTimeline({ status }: { status: string }) {
  const canonical = normalizeOrderStatus(status);

  if (canonical === "cancelled") {
    return (
      <div className="flex items-center gap-2.5 rounded-card bg-status-cancelled/10 p-4 text-sm font-medium text-status-cancelled">
        <span
          aria-hidden="true"
          className="h-2.5 w-2.5 shrink-0 rounded-full bg-status-cancelled"
        />
        This order was cancelled.
      </div>
    );
  }

  const currentIndex =
    canonical === "pending_payment" ? -1 : ORDER_STATUS_STEPS.indexOf(canonical);

  return (
    <ol className="flex flex-col rounded-card border border-border bg-surface p-4 shadow-soft">
      {ORDER_STATUS_STEPS.map((step, index) => {
        const isComplete = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === ORDER_STATUS_STEPS.length - 1;
        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white transition-colors ${
                  isComplete ? "bg-primary-500 shadow-soft" : "bg-border"
                } ${isCurrent ? "ring-4 ring-primary-100" : ""}`}
              >
                {isComplete && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </span>
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`w-0.5 flex-1 ${isComplete && index < currentIndex ? "bg-primary" : "bg-border"}`}
                  style={{ minHeight: "1.5rem" }}
                />
              )}
            </div>
            <span
              className={`text-sm ${isLast ? "" : "pb-6"} ${isComplete ? "font-semibold text-text" : "text-text-muted"} ${isCurrent ? "text-primary" : ""}`}
            >
              {ORDER_STATUS_LABELS[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
