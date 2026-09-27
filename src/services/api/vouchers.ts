import { apiClient } from "@/services/api/client";
import type { Voucher, VoucherValidation } from "@/types/voucher";

export async function listVouchers(marketId?: number): Promise<Voucher[]> {
  const { data } = await apiClient.get<{ vouchers: Voucher[] }>("/customer/vouchers", {
    params: { market_id: marketId },
  });
  return data.vouchers;
}

export async function validateVoucher(
  code: string,
  subtotal: number,
  marketId?: number,
): Promise<{ message: string; voucher: VoucherValidation; discount_amount: number }> {
  const { data } = await apiClient.post<{
    message: string;
    voucher: VoucherValidation;
    discount_amount: number;
  }>("/customer/voucher/validate", { code, subtotal, market_id: marketId });
  return data;
}
