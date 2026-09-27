import { useLocation } from "react-router-dom";
import { Browser } from "@capacitor/browser";
import Button from "@/components/ui/Button";
import PaymentScreen from "@/features/checkout/PaymentScreen";

interface LocationState {
  redirectUrl?: string;
}

export default function BpiPaymentScreen() {
  const location = useLocation();
  const initialRedirectUrl = (location.state as LocationState | null)?.redirectUrl;

  return (
    <PaymentScreen
      title="Pay with BPI"
      failureMessage="This payment link has expired or the payment failed."
      timeoutMessage="This is taking longer than expected. Please try again."
      expiryHint="This link expires in about 15 minutes."
      renderPending={(order) => {
        const redirectUrl = order?.cashlessPayment?.redirect_url ?? initialRedirectUrl;
        return (
          <Button
            variant="solid"
            disabled={!redirectUrl}
            onClick={() => redirectUrl && void Browser.open({ url: redirectUrl })}
          >
            Continue to BPI
          </Button>
        );
      }}
    />
  );
}
