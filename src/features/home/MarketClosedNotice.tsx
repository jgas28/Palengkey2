import Icon from "@/components/pk/Icon";
import { formatReopenDate, useMarketClosure } from "@/features/home/useMarketClosure";

/** Shown while an admin has closed the customer's market (Order Later only). */
export default function MarketClosedNotice({
  marketId,
  paluto = false,
}: {
  marketId?: number | null;
  /** Paluto can't be ordered at all while closed, unlike regular items. */
  paluto?: boolean;
}) {
  const market = useMarketClosure(marketId);
  if (!market) return null;

  return (
    <div className="market-closed-notice" role="status">
      <Icon name="clock" />
      <div>
        <strong>
          {market.name} is closed until {formatReopenDate(market.closed_until!)}
        </strong>
        <p>
          {paluto
            ? "Paluto isn't available while the market is closed. Order again once it reopens."
            : "You can still order. Deliveries start the day it reopens."}
        </p>
        {market.closed_reason && <p>{market.closed_reason}</p>}
      </div>
    </div>
  );
}
