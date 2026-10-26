import { useState } from "react";
import Icon from "@/components/pk/Icon";
import MarketPickerDrawer from "@/features/home/MarketPickerDrawer";
import { useMarketStore } from "@/stores/marketStore";

export interface MarketPillProps {
  /** Shown when no market is chosen yet (e.g. the homepage's nearest market). */
  fallbackName?: string;
  className?: string;
}

/**
 * "Now delivering from <market>" pill that doubles as the market selector —
 * prices, stock, stalls and recipes all follow the market picked here.
 */
export default function MarketPill({ fallbackName, className = "" }: MarketPillProps) {
  const selectedMarket = useMarketStore((state) => state.selectedMarket);
  const [pickerOpen, setPickerOpen] = useState(false);
  const name = selectedMarket?.name ?? fallbackName;

  return (
    <>
      <button
        type="button"
        className={`location-pill market-pill ${className}`}
        onClick={() => setPickerOpen(true)}
        aria-haspopup="dialog"
        aria-label={name ? `Delivering from ${name}. Change market` : "Choose a market"}
      >
        <span aria-hidden="true"></span>
        {name ? (
          <>
            Now delivering from <strong>{name}</strong>
          </>
        ) : (
          "Choose your market"
        )}
        <em>
          Change <Icon name="chevron" size={13} />
        </em>
      </button>
      <MarketPickerDrawer isOpen={pickerOpen} onClose={() => setPickerOpen(false)} />
    </>
  );
}
