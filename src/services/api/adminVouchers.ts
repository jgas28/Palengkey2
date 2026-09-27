import { adminApiClient } from "@/services/api/adminClient";
import type { AdminVoucher, AdminVoucherPage, VoucherTarget } from "@/types/adminVoucher";

export async function listAdminVouchers(search = ""): Promise<AdminVoucherPage> {
  const { data } = await adminApiClient.get<AdminVoucherPage>("/admin/vouchers", {
    params: { search: search || undefined },
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

export async function deleteAdminVoucher(voucherId: number): Promise<void> {
  await adminApiClient.delete(`/admin/vouchers/${voucherId}`);
}
