import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Market } from "@/types/market";

interface MarketState {
  selectedMarket: Market | null;
  setMarket: (market: Market) => void;
  clearMarket: () => void;
}

export const useMarketStore = create<MarketState>()(
  persist(
    (set) => ({
      selectedMarket: null,
      setMarket: (market) => set({ selectedMarket: market }),
      clearMarket: () => set({ selectedMarket: null }),
    }),
    { name: "palengkey_market" },
  ),
);
