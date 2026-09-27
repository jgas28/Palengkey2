import { COOKING_STATUS_LABELS, COOKING_STATUS_STEPS } from "@/features/orders/orderStatus";
import type { CookingStatus } from "@/features/orders/orderStatus";

export default function CookingStatusTimeline({ status }: { status: CookingStatus }) {
  const currentIndex = COOKING_STATUS_STEPS.indexOf(status);

  return (
    <ol className="flex items-center gap-1">
      {COOKING_STATUS_STEPS.map((step, index) => {
        const isComplete = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === COOKING_STATUS_STEPS.length - 1;
        return (
          <li key={step} className="flex flex-1 items-center gap-1">
            <div className="flex flex-1 flex-col items-center gap-1">
              <span
                className={`h-1.5 w-full rounded-full transition-colors ${
                  isComplete ? "bg-primary-500" : "bg-border"
                }`}
                aria-hidden="true"
              />
              <span
                className={`text-center text-[10px] leading-tight ${
                  isCurrent ? "font-semibold text-primary" : "text-text-muted"
                }`}
              >
                {COOKING_STATUS_LABELS[step]}
              </span>
            </div>
            {!isLast && <span className="sr-only">, then</span>}
          </li>
        );
      })}
    </ol>
  );
}
