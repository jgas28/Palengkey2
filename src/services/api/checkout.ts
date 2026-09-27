import { apiClient } from "@/services/api/client";
import type {
  CheckoutPayload,
  CheckoutSuccessResponse,
  DeliveryFeeResponse,
} from "@/types/checkout";

export async function getDeliveryFee(params: {
  lat: number;
  lng: number;
  marketId: number;
}): Promise<DeliveryFeeResponse> {
  const { data } = await apiClient.get<DeliveryFeeResponse>("/customer/delivery/fee", {
    params: { lat: params.lat, lng: params.lng, market_id: params.marketId },
  });
  return data;
}

export async function checkout(
  payload: CheckoutPayload,
): Promise<CheckoutSuccessResponse> {
  const { data } = await apiClient.post<CheckoutSuccessResponse>(
    "/customer/checkout",
    payload,
  );
  return data;
}
