import { adminApiClient } from "@/services/api/adminClient";
import type {
  AdminVoucher,
  AdminVoucherPage,
  VoucherCustomer,
  VoucherTarget,
} from "@/types/adminVoucher";

export async function listAdminVouchers(
  search = "",
  page = 1,
): Promise<AdminVoucherPage> {
  const { data } = await adminApiClient.get<AdminVoucherPage>("/admin/vouchers", {
    params: { search: search || undefined, page },
  });
  return data;
}

export interface VoucherPayload {
  code: string;
  description?: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  applies_to: VoucherTarget[];
  min_order_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  per_customer_limit?: number;
  is_active: boolean;
  is_public: boolean;
  for_specific_customers: boolean;
  customer_ids: number[];
  market_id?: number;
  starts_at?: string;
  expires_at?: string;
}

export async function createAdminVoucher(payload: VoucherPayload): Promise<AdminVoucher> {
  const { data } = await adminApiClient.post<AdminVoucher>("/admin/vouchers", payload);
  return data;
}

export async function updateAdminVoucher(
  voucherId: number,
  payload: VoucherPayload,
): Promise<AdminVoucher> {
  const { data } = await adminApiClient.patch<AdminVoucher>(
    `/admin/vouchers/${voucherId}`,
    payload,
  );
  return data;
}

/** Customers whose email contains `email` (at least 3 characters), up to 10. */
export async function searchVoucherCustomers(email: string): Promise<VoucherCustomer[]> {
  const { data } = await adminApiClient.get<{ customers: VoucherCustomer[] }>(
    "/admin/vouchers/customer-search",
    { params: { email } },
  );
  return data.customers;
}

export async function deleteAdminVoucher(voucherId: number): Promise<void> {
  await adminApiClient.delete(`/admin/vouchers/${voucherId}`);
}
