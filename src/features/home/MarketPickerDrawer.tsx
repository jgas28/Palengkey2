import { useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import Icon from "@/components/pk/Icon";
import { listMarkets } from "@/services/api/markets";
import { getCurrentCoordinates } from "@/utils/geolocation";
import { useMarketStore } from "@/stores/marketStore";
import type { Market } from "@/types/market";

export interface MarketPickerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

/** The design's "Select a market" modal (.market-picker), on the real market list. */
export default function MarketPickerDrawer({ isOpen, onClose }: MarketPickerDrawerProps) {
  const setMarket = useMarketStore((state) => state.setMarket);
  const selectedMarketId = useMarketStore((state) => state.selectedMarket?.id);
  const [query, setQuery] = useState("");

  const {
    data: markets = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["markets"],
    queryFn: async () => {
      const coords = await getCurrentCoordinates();
      return listMarkets(coords ?? undefined);
    },
    enabled: isOpen,
  });

  if (!isOpen) return null;

  const shown = markets.filter((market) =>
    `${market.name} ${market.address}`.toLowerCase().includes(query.toLowerCase()),
  );

  function handleSelect(market: Market) {
    setMarket(market);
    onClose();
  }

  return createPortal(
    <div className="market-picker-backdrop" onClick={onClose}>
      <section
        className="market-picker"
        role="dialog"
        aria-modal="true"
        aria-label="Select a market"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="picker-head">
          <div>
            <p className="kicker">Choose your palengke</p>
            <h2>Select a market</h2>
            <p>Availability and delivery time are based on your address.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close market selector">
            <Icon name="x" />
          </button>
        </div>
        <label className="picker-search">
          <Icon name="search" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search markets or cities..."
            aria-label="Search markets"
          />
        </label>
        <div className="market-options">
          {isLoading && <p style={{ margin: 0, color: "var(--muted)", fontSize: 11 }}>Loading markets…</p>}
          {isError && (
            <button type="button" onClick={() => void refetch()}>
              <span>
                <Icon name="x" />
              </span>
              <div>
                <strong>Couldn&apos;t load markets</strong>
                <p>Tap to try again.</p>
              </div>
            </button>
          )}
          {!isLoading && !isError && shown.length === 0 && (
            <p style={{ color: "var(--muted)", fontSize: 11 }}>No markets match your search.</p>
          )}
          {shown.map((market) => {
            const selected = market.id === selectedMarketId;
            return (
              <button
                type="button"
                className={`${selected ? "selected" : ""} ${!market.has_items ? "disabled" : ""}`}
                disabled={!market.has_items}
                onClick={() => handleSelect(market)}
                key={market.id}
              >
                <span>
                  <Icon name="bag" />
                </span>
                <div>
                  <strong>{market.name}</strong>
                  <p>{market.address}</p>
                  <small>
                    {market.distance !== null ? `${market.distance} km away · ` : ""}
                    {market.has_items ? "Open today" : "No items today"}
                  </small>
                </div>
                {market.has_items ? (
                  <i>
                    {selected ? <Icon name="check" size={16} /> : <Icon name="chevron" size={16} />}
                  </i>
                ) : (
                  <b>Coming soon</b>
                )}
              </button>
            );
          })}
        </div>
        <div className="picker-note">
          <Icon name="truck" />
          <span>
            <strong>Market-to-door delivery</strong>
            <small>
              Your order is shopped and delivered from one market to keep everything fresh.
            </small>
          </span>
        </div>
      </section>
    </div>,
    document.body,
  );
}
