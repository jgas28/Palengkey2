import { apiClient } from "@/services/api/client";
import type { PopupAd } from "@/types/popupAd";

export async function getActivePopupAds(): Promise<PopupAd[]> {
  const { data } = await apiClient.get<{ data: PopupAd[] }>("/popup-ads");
  return data.data;
}
