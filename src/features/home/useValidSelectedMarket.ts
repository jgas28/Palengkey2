import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { listMarkets } from "@/services/api/markets";
import { useMarketStore } from "@/stores/marketStore";

/**
 * The chosen market is saved in the browser, so it outlives an admin turning
 * that market off. Drop a saved market that is no longer active (the pages
 * then fall back to the nearest market with items) and refresh its saved name.
 */
export function useValidSelectedMarket() {
  const selectedMarket = useMarketStore((state) => state.selectedMarket);
  const setMarket = useMarketStore((state) => state.setMarket);
  const clearMarket = useMarketStore((state) => state.clearMarket);

  const { data: activeMarkets } = useQuery({
    queryKey: ["activeMarkets"],
    queryFn: () => listMarkets(),
    enabled: selectedMarket !== null,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (!selectedMarket || !activeMarkets) return;
    const current = activeMarkets.find((market) => market.id === selectedMarket.id);
    if (!current) {
      clearMarket();
    } else if (
      current.name !== selectedMarket.name ||
      current.address !== selectedMarket.address
    ) {
      setMarket({ ...selectedMarket, name: current.name, address: current.address });
    }
  }, [selectedMarket, activeMarkets, setMarket, clearMarket]);
}
