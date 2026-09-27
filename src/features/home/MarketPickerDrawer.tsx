import { useQuery } from "@tanstack/react-query";
import Drawer from "@/components/ui/Drawer";
import { Spinner } from "@/components/common/LoadingState";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import MarketsMap from "@/features/home/MarketsMap";
import { listMarkets } from "@/services/api/markets";
import { getCurrentCoordinates } from "@/utils/geolocation";
import { useMarketStore } from "@/stores/marketStore";
import type { Market } from "@/types/market";

export interface MarketPickerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MarketPickerDrawer({ isOpen, onClose }: MarketPickerDrawerProps) {
  const setMarket = useMarketStore((state) => state.setMarket);
  const selectedMarketId = useMarketStore((state) => state.selectedMarket?.id);

  const {
    data: markets,
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

  function handleSelect(market: Market) {
    setMarket(market);
    onClose();
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} side="bottom" title="Choose a market">
      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {!isLoading && !isError && markets?.length === 0 && (
        <EmptyState
          icon={<span className="text-5xl">🏪</span>}
          title="No markets found nearby."
        />
      )}

      {!isLoading && !isError && markets && markets.length > 0 && (
        <div className="mb-3">
          <MarketsMap
            markets={markets}
            selectedMarketId={selectedMarketId}
            onSelect={handleSelect}
          />
        </div>
      )}

      {!isLoading && !isError && markets && markets.length > 0 && (
        <ul className="flex flex-col gap-2">
          {markets.map((market) => {
            const isSelected = market.id === selectedMarketId;
            return (
              <li key={market.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(market)}
                  className={`flex w-full items-start gap-3 rounded-card border p-3.5 text-left transition-colors ${
                    isSelected
                      ? "border-primary bg-primary-50"
                      : "border-border bg-surface md:hover:border-primary-200"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-lg shadow-soft"
                  >
                    🏪
                  </span>
                  <span className="flex flex-1 flex-col items-start gap-0.5">
                    <span className="font-semibold text-text">{market.name}</span>
                    <span className="text-sm text-text-muted">{market.address}</span>
                    <span className="flex items-center gap-1.5 pt-0.5 text-xs">
                      {market.distance !== null && (
                        <span className="text-text-muted">{market.distance} km away</span>
                      )}
                      <span
                        className={`rounded-pill px-2 py-0.5 font-semibold ${
                          market.has_items
                            ? "bg-status-delivered/15 text-status-delivered"
                            : "bg-background text-text-muted"
                        }`}
                      >
                        {market.has_items ? "Open today" : "No items today"}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Drawer>
  );
}
