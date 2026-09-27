import { useQuery } from "@tanstack/react-query";
import { getOrder } from "@/services/api/orders";
import type { PaymentStatus } from "@/types/order";

const TERMINAL_STATUSES = new Set<PaymentStatus>(["paid", "expired", "failed"]);
const FAILED_STATUSES = new Set<PaymentStatus>(["expired", "failed"]);

export function isTerminalPaymentStatus(status: PaymentStatus | undefined): boolean {
  return Boolean(status && TERMINAL_STATUSES.has(status));
}

/** True for a terminal *failure* status specifically — excludes "paid". */
export function isFailedPaymentStatus(status: PaymentStatus | undefined): boolean {
  return Boolean(status && FAILED_STATUSES.has(status));
}

/** Polls the order every few seconds until payment reaches a terminal state. */
export function usePaymentStatus(orderId: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrder(orderId),
    enabled: options?.enabled ?? true,
    refetchInterval: (query) =>
      isTerminalPaymentStatus(query.state.data?.payment_status) ? false : 4000,
  });
}
