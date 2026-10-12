import { useLocation } from "react-router-dom";
import { Spinner } from "@/components/common/LoadingState";
import PaymentScreen from "@/features/checkout/PaymentScreen";

interface LocationState {
  qrUrl?: string;
}

export default function QrphPaymentScreen() {
  const location = useLocation();
  const initialQrUrl = (location.state as LocationState | null)?.qrUrl;

  return (
    <PaymentScreen
      title="Scan to pay with QR Ph"
      failureMessage="This QR code has expired or the payment failed."
      timeoutMessage="This is taking longer than expected. Please try again."
      expiryHint="This code expires in about 15 minutes."
      renderPending={(order) => {
        const qrUrl = order?.cashless_payment?.qr_url ?? initialQrUrl;
        return qrUrl ? (
          <img
            src={qrUrl}
            alt="QR Ph payment code"
            className="h-64 w-64 object-contain"
          />
        ) : (
          <div className="flex h-64 w-64 items-center justify-center">
            <Spinner />
          </div>
        );
      }}
    />
  );
}
