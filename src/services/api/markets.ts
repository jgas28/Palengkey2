import { apiClient } from "@/services/api/client";
import type { Market } from "@/types/market";

export async function listMarkets(coords?: {
  lat: number;
  lng: number;
}): Promise<Market[]> {
  const { data } = await apiClient.get<Market[]>("/customer/markets", {
    params: coords ? { lat: coords.lat, lng: coords.lng } : undefined,
  });
  return data;
}
