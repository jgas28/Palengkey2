import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "@/components/pk/Icon";
import {
  isFailedPaymentStatus,
  usePaymentStatus,
} from "@/features/checkout/usePaymentStatus";
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

  const failed = isTerminalFailure || timedOut;

  return (
    <main className="inner-page account-bg">
      <section className="confirmation shell">
        <span
          style={
            failed
              ? { background: "#dc2626", boxShadow: "0 0 0 12px #fde8e8" }
              : { background: "var(--teal)", boxShadow: "0 0 0 12px var(--teal-pale)" }
          }
        >
          <Icon name={failed ? "x" : "clock"} size={38} />
        </span>
        <p className="kicker">{failed ? "Payment not completed" : "Awaiting payment"}</p>
        <h1>{title}</h1>
        {failed ? (
          <>
            <p>{timedOut ? timeoutMessage : failureMessage}</p>
            <button
              type="button"
              className="btn primary"
              onClick={() => navigate("/cart")}
            >
              Back to basket <Icon name="arrow" />
            </button>
          </>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                placeItems: "center",
                gridTemplateColumns: "1fr",
              }}
            >
              {renderPending(order)}
            </div>
            <p>Waiting for payment confirmation… {expiryHint}</p>
          </>
        )}
        <button type="button" onClick={() => navigate("/orders")}>
          View my orders
        </button>
      </section>
    </main>
  );
}
