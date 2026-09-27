import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMarketStore } from "./marketStore";
import type { Market } from "@/types/market";

const market: Market = {
  id: 1,
  name: "Quiapo Market",
  address: "Quiapo, Manila",
  latitude: 14.599,
  longitude: 120.983,
  has_items: true,
  distance: 1.2,
};

describe("marketStore", () => {
  beforeEach(() => {
    useMarketStore.setState({ selectedMarket: null });
    localStorage.clear();
  });

  it("starts with no selected market", () => {
    expect(useMarketStore.getState().selectedMarket).toBeNull();
  });

  it("sets the selected market and persists it", async () => {
    useMarketStore.getState().setMarket(market);

    expect(useMarketStore.getState().selectedMarket).toEqual(market);
    await vi.waitFor(() => {
      expect(localStorage.getItem("palengkey_market")).toContain("Quiapo Market");
    });
  });

  it("clears the selected market", () => {
    useMarketStore.getState().setMarket(market);
    useMarketStore.getState().clearMarket();

    expect(useMarketStore.getState().selectedMarket).toBeNull();
  });
});
