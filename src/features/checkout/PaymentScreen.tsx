import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/common/LoadingState";
import { isFailedPaymentStatus, usePaymentStatus } from "@/features/checkout/usePaymentStatus";
import type { Order } from "@/types/order";

const PAYMENT_TIMEOUT_MS = 15 * 60 * 1000;

export interface PaymentScreenProps {
  title: string;
  failureMessage: string;
  timeoutMessage: string;
  expiryHint: string;
  renderPending: (order: Order | undefined) => ReactNode;
}

/** Shared shell for the BPI/QRPh payment-waiting screens — polling, terminal
 * failure/timeout UI, and the paid-order redirect are identical between the
 * two; only the mid-screen content (redirect button vs. QR image) differs. */
export default function PaymentScreen({
  title,
  failureMessage,
  timeoutMessage,
  expiryHint,
  renderPending,
}: PaymentScreenProps) {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [timedOut, setTimedOut] = useState(false);

  const { data: order } = usePaymentStatus(Number(orderId), { enabled: !timedOut });
  const isTerminalFailure = isFailedPaymentStatus(order?.payment_status);

  useEffect(() => {
    if (order?.payment_status === "paid") {
      navigate(`/checkout/confirmation/${order.id}`, { state: { order }, replace: true });
    }
  }, [order, navigate]);

  useEffect(() => {
    if (order?.payment_status === "paid" || isTerminalFailure) return;
    const timeout = setTimeout(() => setTimedOut(true), PAYMENT_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [order?.payment_status, isTerminalFailure]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-6 py-8 text-center">
      <h1 className="text-lg font-semibold">{title}</h1>

      {isTerminalFailure || timedOut ? (
        <>
          <p className="text-sm text-status-cancelled">
            {timedOut ? timeoutMessage : failureMessage}
          </p>
          <Button variant="solid" onClick={() => navigate("/cart")}>
            Back to cart
          </Button>
        </>
      ) : (
        <>
          {renderPending(order)}
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Spinner className="h-4 w-4" />
            Waiting for payment confirmation…
          </div>
          <p className="text-xs text-text-muted">{expiryHint}</p>
        </>
      )}
    </div>
  );
}
