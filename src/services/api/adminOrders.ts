import { adminApiClient } from "@/services/api/adminClient";
import type {
  AdminActiveRider,
  AdminOrderCounts,
  AdminOrderDetail,
  AdminOrderItem,
  AdminOrderPage,
  AdminOrderRecipeBundle,
  AdminOrderStatus,
  CookingStatus,
} from "@/types/adminOrder";

export interface AdminOrderFilter {
  status?: AdminOrderStatus;
  search?: string;
  reservationsOnly?: boolean;
  marketId?: number;
  page?: number;
}

export async function listAdminOrders(
  filter: AdminOrderFilter,
): Promise<{ orders: AdminOrderPage; counts: AdminOrderCounts }> {
  const { data } = await adminApiClient.get<{
    orders: AdminOrderPage;
    counts: AdminOrderCounts;
  }>("/admin/orders", {
    params: {
      status: filter.status,
      search: filter.search || undefined,
      reservations_only: filter.reservationsOnly || undefined,
      market_id: filter.marketId,
      page: filter.page,
    },
  });
  return data;
}

export async function getAdminOrder(orderId: number): Promise<AdminOrderDetail> {
  const { data } = await adminApiClient.get<AdminOrderDetail>(`/admin/orders/${orderId}`);
  return data;
}

export async function updateAdminOrderStatus(
  orderId: number,
  status: AdminOrderStatus,
): Promise<{ message: string; order: AdminOrderDetail }> {
  const { data } = await adminApiClient.patch<{ message: string; order: AdminOrderDetail }>(
    `/admin/orders/${orderId}/status`,
    { status },
  );
  return data;
}

export interface OrderItemChangeResult {
  message: string;
  /** New total minus old total (negative = cheaper). */
  total_difference: number;
  /** Amount to refund when a paid order got cheaper. */
  refund_due: number;
  order: AdminOrderDetail;
}

/** Changes a line's quantity/price (e.g. partly out of stock); totals are recalculated. */
export async function updateAdminOrderItem(
  orderId: number,
  orderItemId: number,
  payload: { quantity: number; price: number; reason?: string },
): Promise<OrderItemChangeResult> {
  const { data } = await adminApiClient.patch<OrderItemChangeResult>(
    `/admin/orders/${orderId}/items/${orderItemId}`,
    payload,
  );
  return data;
}

/** Removes a line the market couldn't supply. */
export async function removeAdminOrderItem(
  orderId: number,
  orderItemId: number,
  reason?: string,
): Promise<OrderItemChangeResult> {
  const { data } = await adminApiClient.delete<OrderItemChangeResult>(
    `/admin/orders/${orderId}/items/${orderItemId}`,
    { data: { reason } },
  );
  return data;
}

/** Records the vendor's actual (haggled) price per unit and an admin note on one ordered line. */
export async function updateAdminOrderItemVendorPrice(
  orderId: number,
  orderItemId: number,
  payload: { vendor_price: number | null; vendor_note: string | null },
): Promise<{ message: string; item: AdminOrderItem }> {
  const { data } = await adminApiClient.patch<{ message: string; item: AdminOrderItem }>(
    `/admin/orders/${orderId}/items/${orderItemId}/vendor-price`,
    payload,
  );
  return data;
}

export async function updateAdminOrderRecipeBundleCookingStatus(
  orderId: number,
  recipeBundleId: number,
  cookingStatus: CookingStatus,
): Promise<{ message: string; recipe_bundle: AdminOrderRecipeBundle }> {
  const { data } = await adminApiClient.patch<{
    message: string;
    recipe_bundle: AdminOrderRecipeBundle;
  }>(`/admin/orders/${orderId}/recipe-bundles/${recipeBundleId}/cooking-status`, {
    cooking_status: cookingStatus,
  });
  return data;
}

export async function cancelAdminOrder(
  orderId: number,
  reason: string,
): Promise<{ message: string; order: AdminOrderDetail }> {
  const { data } = await adminApiClient.post<{ message: string; order: AdminOrderDetail }>(
    `/admin/orders/${orderId}/cancel`,
    { reason },
  );
  return data;
}

export async function assignAdminOrderRider(
  orderId: number,
  riderId: number,
): Promise<{ message: string; order: AdminOrderDetail }> {
  const { data } = await adminApiClient.post<{ message: string; order: AdminOrderDetail }>(
    `/admin/orders/${orderId}/assign-rider`,
    { rider_id: riderId },
  );
  return data;
}

export async function listActiveAdminRiders(): Promise<AdminActiveRider[]> {
  const { data } = await adminApiClient.get<AdminActiveRider[]>("/admin/orders/riders/active");
  return data;
}

/** Two-page PDF: a picking list, followed by stick-on item labels for bagging produce. */
export async function printAdminOrderLabels(orderId: number): Promise<Blob> {
  const { data } = await adminApiClient.get<Blob>(`/admin/orders/${orderId}/print`, {
    responseType: "blob",
  });
  return data;
}
