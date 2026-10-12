import { useLocation } from "react-router-dom";
import { Browser } from "@capacitor/browser";
import PaymentScreen from "@/features/checkout/PaymentScreen";
import { paymentMethodLabel } from "@/features/orders/paymentMethods";

interface LocationState {
  redirectUrl?: string;
}

/** Waiting screen for methods paid on an external page — BPI online banking, and
 * card/GCash/Maya/UnionBank on PayMongo's hosted checkout. */
export default function RedirectPaymentScreen() {
  const location = useLocation();
  const initialRedirectUrl = (location.state as LocationState | null)?.redirectUrl;

  return (
    <PaymentScreen
      title="Complete your payment"
      failureMessage="This payment link has expired or the payment failed."
      timeoutMessage="This is taking longer than expected. Please try again."
      expiryHint="Finish paying within 15–30 minutes or the order is cancelled."
      renderPending={(order) => {
        const redirectUrl = order?.cashless_payment?.redirect_url ?? initialRedirectUrl;
        const label = order ? paymentMethodLabel(order.payment_method) : "payment page";
        return (
          <button
            type="button"
            className="btn primary"
            disabled={!redirectUrl}
            onClick={() => redirectUrl && void Browser.open({ url: redirectUrl })}
          >
            Continue to {label}
          </button>
        );
      }}
    />
  );
}
